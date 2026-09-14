import { PrismaClient, PropertyType, ListingType, InteractionType } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const NEIGHBORHOODS = [
  'Palermo', 'Recoleta', 'Belgrano', 'San Telmo', 'Puerto Madero',
  'La Boca', 'Caballito', 'Almagro', 'Villa Crespo', 'Colegiales',
  'Núñez', 'Villa Urquiza', 'Villa Devoto', 'Flores', 'Barracas',
];

const PROPERTY_TYPES: PropertyType[] = ['apartment', 'house', 'condo', 'land', 'commercial'];
const LISTING_TYPES: ListingType[] = ['sale', 'rent'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateGeoHash(lat: number, lng: number): string {
  return `${lat.toFixed(3)}_${lng.toFixed(3)}`;
}

function generateProperties(count: number) {
  const properties = [];
  const usedCoords = new Set<string>();
  const duplicateChance = 0.08;

  for (let i = 0; i < count; i++) {
    let lat: number;
    let lng: number;
    let coordKey: string;
    let attempts = 0;

    do {
      lat = -34.6 + Math.random() * 0.3;
      lng = -58.45 + Math.random() * 0.35;
      coordKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
      attempts++;
    } while (usedCoords.has(coordKey) && attempts < 50);

    usedCoords.add(coordKey);

    const isDuplicate = Math.random() < duplicateChance && i > 0;
    const basePrice = randomInt(50000, 1500000);
    const areaM2 = randomInt(25, 400);
    const rooms = Math.max(1, Math.floor(areaM2 / 35));
    const bathrooms = Math.max(1, Math.floor(rooms / 2));

    const property = {
      title: isDuplicate
        ? `${randomItem(['Amplio', 'Moderno', 'Luminoso'])} ${randomItem(PROPERTY_TYPES).toLowerCase()} en ${randomItem(NEIGHBORHOODS)}`
        : faker.location.buildingNumber() + ' ' + faker.location.street(),
      description: faker.lorem.paragraph(),
      price: basePrice,
      priceCurrency: 'USD',
      totalMonthlyCost: randomItem([true, false]) ? Math.floor(basePrice * 0.005) : null,
      areaM2: areaM2,
      rooms: rooms,
      bathrooms: bathrooms,
      propertyType: randomItem(PROPERTY_TYPES),
      listingType: randomItem(LISTING_TYPES),
      lat: lat,
      lng: lng,
      geoJson: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      address: faker.location.streetAddress(),
      neighborhood: randomItem(NEIGHBORHOODS),
      city: 'Buenos Aires',
      geoHash: generateGeoHash(lat, lng),
      images: [faker.image.url()],
      amenities: ['WiFi', 'Aire acondicionado', 'Calefacción'],
      sourceUrl: `https://propfind.example.com/prop/${i + 1}`,
      sourceId: `src_${i + 1}`,
      isActive: true,
      publisherId: null,
    };

    properties.push(property);
  }

  return properties;
}

async function deduplicateProperties(properties: any[]) {
  const duplicates = new Map<string, any[]>();

  for (const prop of properties) {
    const key = `${prop.lat.toFixed(2)}_${prop.lng.toFixed(2)}_${prop.areaM2}`;
    if (!duplicates.has(key)) {
      duplicates.set(key, []);
    }
    duplicates.get(key)!.push(prop);
  }

  const flagged = [];
  for (const [key, group] of duplicates) {
    if (group.length > 1) {
      for (const prop of group) {
        flagged.push({ ...prop, duplicateFlag: true, duplicateGroup: key });
      }
    }
  }

  return flagged;
}

async function main() {
  console.log('Seeding database...');

  const users = [];
  for (let i = 0; i < 20; i++) {
    const role = i < 10 ? 'FINDER' : i < 15 ? 'REALTOR' : 'OWNER';
    const user = await prisma.user.upsert({
      where: { email: `user${i}@example.com` },
      update: {},
      create: {
        email: `user${i}@example.com`,
        authProvider: 'anonymous',
        profile: {},
        consentFlags: { analytics: false, marketing: false, personalization: false },
      },
    });
    users.push(user);

    if (role !== 'FINDER') {
      await prisma.publisherProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          companyName: faker.company.name(),
          licenseNumber: `LIC${randomInt(1000, 9999)}`,
          phone: faker.phone.number(),
          verified: Math.random() > 0.3,
        },
      });
    }
  }

  console.log(`Created ${users.length} users`);

  const properties = generateProperties(500);
  const deduplicated = await deduplicateProperties(properties);

  console.log(`Generated ${properties.length} properties`);
  console.log(`Flagged ${deduplicated.length} as potential duplicates`);

  for (const prop of properties) {
    await prisma.property.create({
      data: {
        ...prop,
        price: prop.price,
      },
    });
  }

  console.log('Properties created successfully');

  const filters = [
    { filterName: 'Apartamentos Palermo', criteria: { neighborhood: 'Palermo', propertyType: 'apartment', minPrice: 100000, maxPrice: 500000 } },
    { filterName: 'Casas en Recoleta', criteria: { neighborhood: 'Recoleta', propertyType: 'house', minPrice: 200000, maxPrice: 800000 } },
    { filterName: 'Estudios Belgrano', criteria: { neighborhood: 'Belgrano', propertyType: 'condo', minPrice: 50000, maxPrice: 150000 } },
  ];

  for (const filter of filters) {
    await prisma.savedFilter.create({
      data: {
        ...filter,
        userId: users[0].id,
        isDefault: false,
      },
    });
  }

  console.log('Created saved filters');

  const interactions = [];
  const interactionTypes = ['SWIPE_RIGHT', 'SWIPE_LEFT', 'VIEW_DETAIL', 'CONTACT_REALTOR'];
  const swipeDirections = ['left', 'right', null] as (string | null)[];

  for (let i = 0; i < 100; i++) {
    interactions.push({
      userId: randomItem(users).id,
      propertyId: (await prisma.property.findMany({ take: 1 }))[0].id,
      interactionType: randomItem(interactionTypes) as InteractionType,
      swipeDirection: randomItem(swipeDirections),
      sessionId: `session_${randomInt(1, 10)}`,
    });
  }

  await prisma.userInteraction.createMany({
    data: interactions,
  });

  console.log('Created user interactions');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
