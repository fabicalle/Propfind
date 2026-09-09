import { prisma } from '@/lib/prisma';
import { PrismaPropertyRepository } from '@/infrastructure/repositories/PrismaRepositories';
import type { CreatePropertyInput } from '@/domain/value-objects';
import type { user_role } from '@prisma/client';

const createPropertyUseCase = (() => {
  // Lazy import equivalent - just use repository directly
  const repo = new PrismaPropertyRepository();
  return { execute: (data: CreatePropertyInput) => repo.create(data) };
})();

const ADMIN_USER = { id: 'admin-default', email: 'admin@propfind.com' };

interface MockPropertyData {
  title: string;
  description: string;
  price: number;
  priceCurrency: 'ARS' | 'USD';
  totalMonthlyCost?: number;
  areaM2?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType: string;
  listingType: 'sale' | 'rent';
  listingSubType?: string;
  lat: number;
  lng: number;
  address?: string;
  neighborhood?: string;
  city?: string;
  amenities?: string[];
  images?: Array<{ url: string; width: number; height: number; alt?: string }>;
}

const MOCK_UNSPLASH = 'https://images.unsplash.com';

const MOCK_PROPERTIES: MockPropertyData[] = [
  // CABA / GBA
  {
    title: '[DEMO] Departamento luminoso en Palermo Hollywood',
    description: 'Edificio de esquina con frente a la calle, Living comedor integrado con parrilla, balcón amplio, apto mascotas, ideal para home office con espacio dedicado y conexión a internet de alta velocidad. A 2 cuadras del Bosque de Palermo.',
    price: 550000,
    priceCurrency: 'USD',
    totalMonthlyCost: 320,
    areaM2: 75,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 2,
    propertyType: 'apartment',
    listingType: 'rent',
    lat: -34.5918,
    lng: -58.4212,
    address: 'Calle Gorriti 5700, C1414, CABA',
    neighborhood: 'Palermo Hollywood',
    city: 'Buenos Aires',
    amenities: ['Apto mascotas', 'Balcón', 'Parrilla', 'Home office', 'Gimnasio', 'Estacionamiento'],
    images: [
      { url: `${MOCK_UNSPLASH}/photo1.jpg`, width: 800, height: 600, alt: 'Living con parrilla' },
      { url: `${MOCK_UNSPLASH}/photo2.jpg`, width: 800, height: 600, alt: 'Balcón con vista' },
    ],
  },
  {
    title: '[DEMO] Casa moderna en barrio Recoleta con jardín',
    description: 'Casa de dos plantas con jardín privado, garage para 2 autos, cocina integral, sistema de seguridad, ambientes luminosos con grandes ventanales, apto para familia joven. Ubicación premium cerca del centro comercial Alto Recoleta.',
    price: 1200000,
    priceCurrency: 'USD',
    totalMonthlyCost: 550,
    areaM2: 180,
    rooms: 6,
    bedrooms: 4,
    bathrooms: 4,
    propertyType: 'house',
    listingType: 'sale',
    lat: -34.6075,
    lng: -58.4196,
    address: 'Jorge Luis Borgna 2500, C1425, CABA',
    neighborhood: 'Recoleta',
    city: 'Buenos Aires',
    amenities: ['Jardín', 'Garage 2 autos', 'Cocina integral', 'Seguridad', 'Terraza', 'Patio'],
    images: [
      { url: `${MOCK_UNSPLASH}/recoleta-house1.jpg`, width: 800, height: 600, alt: 'Fachada' },
      { url: `${MOCK_UNSPLASH}/recoleta-house2.jpg`, width: 800, height: 600, alt: 'Jardín' },
    ],
  },
  {
    title: '[DEMO] Edificio de departamentos en Belgrano con bodegón',
    description: 'Departamento en edificio nuevo con bodegón privado, baño de lujo con amenities, cocina moderna con electrodoméricos, balcón con parrilla, apto para trabajo remoto, excelente conectividad. A pasos del Centro Comercial Paseo.',
    price: 850000,
    priceCurrency: 'USD',
    totalMonthlyCost: 420,
    areaM2: 120,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'apartment',
    listingType: 'sale',
    lat: -34.5591,
    lng: -58.4867,
    address: 'Avenida Cabildo 3450, B1424, CABA',
    neighborhood: 'Belgrano',
    city: 'Buenos Aires',
    amenities: ['Bodegón', 'Balcón con parrilla', 'Home office', 'Gimnasio', 'Piscina', 'Sum', 'Seguridad 24/7'],
    images: [
      { url: `${MOCK_UNSPLASH}/belgrano-apt1.jpg`, width: 800, height: 600, alt: 'Living' },
    ],
  },
  // Córdoba
  {
    title: '[DEMO] Depto 2 ambientes en Nueva Córdoba',
    description: 'Departamento nuevo en pleno corazón de Nueva Córdoba, a metros de la Universidad, con patio privado compartido, cocina completa, lavadero, estacionamiento de uso única, ideal para estudiantes o jóvenes profesionales.',
    price: 90000,
    priceCurrency: 'USD',
    totalMonthlyCost: 4500,
    areaM2: 45,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    propertyType: 'apartment',
    listingType: 'rent',
    lat: -31.4300,
    lng: -64.1888,
    address: 'Calle 25 de Mayo 300, X5000, Córdoba',
    neighborhood: 'Nueva Córdoba',
    city: 'Córdoba',
    amenities: ['Patio', 'Cocina completa', 'Lavadero', 'Estacionamiento', 'WiFi'],
    images: [
      { url: `${MOCK_UNSPLASH}/cordoba-apt1.jpg`, width: 800, height: 600, alt: 'Living' },
    ],
  },
  {
    title: '[DEMO] Casa con lago en Carlos Paz',
    description: 'Cabaña moderna con vista al lago, 5 ambientes, patio con parrilla, pileta privada, cancha de fútbol de uso compartido, sistema de alarmas, ideal para escapadas familiares. Playa privada y marina disponible.',
    price: 450000,
    priceCurrency: 'USD',
    totalMonthlyCost: 3800,
    areaM2: 220,
    rooms: 6,
    bedrooms: 4,
    bathrooms: 3,
    propertyType: 'house',
    listingType: 'rent',
    lat: -31.4294,
    lng: -64.1995,
    address: 'Ruta Nacional 19, X2000, Carlos Paz',
    neighborhood: 'Lago del Cerro',
    city: 'Carlos Paz',
    amenities: ['Lago', 'Pileta privada', 'Parrilla', 'Cancha de fútbol', 'Alarma', 'Playa privada'],
    images: [
      { url: `${MOCK_UNSPLASH}/carlos-paz1.jpg`, width: 800, height: 600, alt: 'Fachada' },
    ],
  },
  // Mendoza
  {
    title: '[DEMO] Departamento con vista al cerro en el centro de Mendoza',
    description: 'Depto reciclado con vista al cerro de la Glorieta, living-comedor con parrilla, cocina a medida con bajo elaborado, balcón, apto para mascotas. A 2 cuadras de la Plaza Independencia.',
    price: 120000,
    priceCurrency: 'USD',
    totalMonthlyCost: 6200,
    areaM2: 70,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    propertyType: 'apartment',
    listingType: 'rent',
    lat: -32.8895,
    lng: -68.8440,
    address: 'Calle San Martín 850, M5500, Mendoza',
    neighborhood: 'Centro',
    city: 'Mendoza',
    amenities: ['Vista cerro', 'Parrilla', 'Apto mascotas', 'Cocina a medida', 'Balcón', 'Bodegón'],
    images: [
      { url: `${MOCK_UNSPLASH}/mendoza-apt1.jpg`, width: 800, height: 600, alt: 'Living con vista' },
    ],
  },
  {
    title: '[DEMO] Casa con viñedos en Chacras de Coria',
    description: 'Casa moderna en el corazón del distrito vitivinícola de Chacras de Coria, con patio con parrilla, bodega propia con espacio para fermentación, jardín con plantas autóctonas, ideal para amantes del vino y la tranquilidad.',
    price: 380000,
    priceCurrency: 'USD',
    totalMonthlyCost: 2100,
    areaM2: 190,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 3,
    propertyType: 'house',
    listingType: 'sale',
    lat: -32.9925,
    lng: -68.8017,
    address: 'Calle San Martín 205, M5321, Chacras de Coria',
    neighborhood: 'Chacras de Coria',
    city: 'Mendoza',
    amenities: ['Viñedos', 'Bodega', 'Parrilla', 'Jardín', 'Apto para perros', 'Cercado'],
    images: [
      { url: `${MOCK_UNSPLASH}/chacras1.jpg`, width: 800, height: 600, alt: 'Fachada con viñedos' },
    ],
  },
  {
    title: '[DEMO] Edificio de departamentos en Godoy Cruz con cochera',
    description: 'Edificio nuevo en Godoy Cruz con cochera para residentes, salón de usos múltiples, gimnasio, pileta al aire libre, seguridad 24/7, departamentos de 1 a 3 ambientes. Excelente conectividad y transporte público.',
    price: 180000,
    priceCurrency: 'USD',
    totalMonthlyCost: 3200,
    areaM2: 95,
    rooms: 4,
    bedrooms: 2,
    bathrooms: 2,
    propertyType: 'apartment',
    listingType: 'sale',
    lat: -32.9473,
    lng: -68.8828,
    address: 'Avenida España 1200, M5219, Godoy Cruz',
    neighborhood: 'Centro',
    city: 'Godoy Cruz',
    amenities: ['Cochera', 'Gimnasio', 'Piscina', 'Seguridad 24/7', 'Salón de eventos', 'Cafetería'],
    images: [
      { url: `${MOCK_UNSPLASH}/godoy-cruz1.jpg`, width: 800, height: 600, alt: 'Edificio' },
    ],
  },
  // Santa Fe
  {
    title: '[DEMO] Departamento nuevo en el centro de Rosario',
    description: 'Depto en edificio de diseño contemporáneo, living con parrilla, cocina integral con electrodoméricos, baño con amueblado, balcón, sistema de sonido integrado. A metros del Parque de las Colectividades.',
    price: 150000,
    priceCurrency: 'USD',
    totalMonthlyCost: 5500,
    areaM2: 85,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 2,
    propertyType: 'apartment',
    listingType: 'rent',
    lat: -32.9468,
    lng: -60.7638,
    address: 'Avenida Peñaloza 950, S2000, Rosario',
    neighborhood: 'Centro',
    city: 'Rosario',
    amenities: ['Parrilla', 'Electrodomésticos', 'Balcón', 'Sonido integrado', 'Gimnasio', 'Estacionamiento'],
    images: [
      { url: `${MOCK_UNSPLASH}/rosario-apt1.jpg`, width: 800, height: 600, alt: 'Living' },
    ],
  },
  // Turísticos / Regionales
  {
    title: '[DEMO] Cabaña de lujo en Bariloche con vista al lago Nahuelito',
    description: 'Cabaña de madera con vista al lago, 4 ambientes, chimenea de leña, terraza con parrilla, sauna compartida, ideal para escapadas invernales o veraniegas. A pasos del cerro Catedral.',
    price: 650000,
    priceCurrency: 'USD',
    areaM2: 150,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'house',
    listingType: 'sale',
    lat: -41.1335,
    lng: -71.3000,
    address: 'Calle Pioneros 2500, R8434, Bariloche',
    neighborhood: 'Lago Nahuelito',
    city: 'Bariloche',
    amenities: ['Lago', 'Chimenea', 'Parrilla', 'Sauna', 'Terraza', 'Apto para perros'],
    images: [
      { url: `${MOCK_UNSPLASH}/bariloche1.jpg`, width: 800, height: 600, alt: 'Cabaña con vista' },
    ],
  },
  {
    title: '[DEMO] Departamento colonial en el centro histórico de Salta',
    description: 'Depto restaurado en edificio colonial, techos altos con vigas de madera, patio interior con fuente, cocina moderna fusionada con antiguo, balcón con vista a la catedral. Ambiente único y acogedor.',
    price: 110000,
    priceCurrency: 'USD',
    totalMonthlyCost: 3800,
    areaM2: 90,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    propertyType: 'apartment',
    listingType: 'rent',
    lat: -24.1948,
    lng: -65.2977,
    address: 'Calle Florida 205, A4000, Salta',
    neighborhood: 'Centro Histórico',
    city: 'Salta',
    amenities: ['Edificio colonial', 'Patio interior', 'Techos altos', 'Cocina moderna', 'Apto mascotas'],
    images: [
      { url: `${MOCK_UNSPLASH}/salta-apt1.jpg`, width: 800, height: 600, alt: 'Patio interior' },
    ],
  },
  {
    title: '[DEMO] Departamento temporada en Mar del Plata frente al mar',
    description: 'Depto en edificio frente al mar con vista a la costanera, living con ventanales, balcón con parrilla, completo amenities: piscina, gimnasio, sauna, salón de juegos infantil. Ideal para veraneo.',
    price: 220000,
    priceCurrency: 'USD',
    totalMonthlyCost: 18000,
    areaM2: 110,
    rooms: 4,
    bedrooms: 2,
    bathrooms: 2,
    propertyType: 'apartment',
    listingType: 'rent',
    listingSubType: 'temporal',
    lat: -38.0225,
    lng: -57.5436,
    address: 'Calle Colón 3500, B7100, Mar del Plata',
    neighborhood: 'Centro',
    city: 'Mar del Plata',
    amenities: ['Frente al mar', 'Piscina', 'Gimnasio', 'Sauna', 'Parilla', 'Balcón', 'WiFi', 'TV'],
    images: [
      { url: `${MOCK_UNSPLASH}/mdp-apt1.jpg`, width: 800, height: 600, alt: 'Vista al mar' },
    ],
  },
  {
    title: '[DEMO] Loft moderno en Neuquén cerca de los Arrayanes',
    description: 'Loft de diseño con techos altos, cocina abierta con parrilla, baño con ducha de lluvia, balcón con parrilla, sistema de calefacción por estufa de leña. Ideal para amantes del outdoors y el skiing cercano.',
    price: 180000,
    priceCurrency: 'USD',
    totalMonthlyCost: 9500,
    areaM2: 65,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    propertyType: 'apartment',
    listingType: 'rent',
    lat: -40.1475,
    lng: -71.2600,
    address: 'Calle Augusto Líder n° 150, Q8300, Neuquén',
    neighborhood: 'B° Arrayanes',
    city: 'Neuquén',
    amenities: ['Loft', 'Techos altos', 'Parrilla', 'Estufa leña', 'Apto mascotas', 'Cercanía a skis'],
    images: [
      { url: `${MOCK_UNSPLASH}/neuquen-loft1.jpg`, width: 800, height: 600, alt: 'Living con parrilla' },
    ],
  },
  {
    title: '[DEMO] Casa con cobertura en Ushuaia frente al lago',
    description: 'Casa de dos plantas con cobertura y vista al lago Argentino, patio con parrilla, sistema de calefacción completo, garage para 1 auto, adecuada para frío patagónico. Cerca del Parque Nacional.',
    price: 280000,
    priceCurrency: 'USD',
    totalMonthlyCost: 11000,
    areaM2: 140,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'house',
    listingType: 'sale',
    lat: -54.8045,
    lng: -68.3251,
    address: 'Calle Río Grande 1250, U9000, Ushuaia',
    neighborhood: 'Lago Argentino',
    city: 'Ushuaia',
    amenities: ['Cobertura', 'Parrilla', 'Calefacción', 'Garage', 'Jardín', 'Apto frío'],
    images: [
      { url: `${MOCK_UNSPLASH}/ushuaia1.jpg`, width: 800, height: 600, alt: 'Casa con vista al lago' },
    ],
  },
];

// Deterministic embedding generator (hash-based for reproducibility)
function generateEmbedding(text: string, dimensions = 1536): number[] {
  const seed = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const embedding: number[] = [];
  for (let i = 0; i < dimensions; i++) {
    // Simple deterministic pseudo-random based on position and seed
    const value = Math.sin(seed + i * 0.1) * 10000;
    embedding.push(Math.abs(value % 1));
  }
  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return embedding;
  return embedding.map((v) => v / norm);
}

export async function seedMockProperties(
  targetUserId?: string
): Promise<{ count: number; properties: { id: string; title: string }[] }> {
  const userId = targetUserId || ADMIN_USER.id;

  // Ensure user exists in DB
  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: ADMIN_USER.email,
      authProvider: 'google',
      authProviderId: userId,
      profile: {},
      role: 'ADMIN' as user_role,
    },
  });

  let publisher = await prisma.publisherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!publisher) {
    publisher = await prisma.publisherProfile.create({
      data: {
        userId: user.id,
        phone: '+54 9 11 0000-0000',
      },
      select: { id: true },
    });
  }

  const created: { id: string; title: string }[] = [];

  for (const mock of MOCK_PROPERTIES) {
    const embedding = generateEmbedding(mock.description);
    const fullDescription = `${mock.title}. ${mock.description}`;

    const propertyData: CreatePropertyInput = {
      title: mock.title,
      description: fullDescription,
      price: mock.price,
      priceCurrency: mock.priceCurrency,
      totalMonthlyCost: mock.totalMonthlyCost,
      areaM2: mock.areaM2,
      rooms: mock.rooms,
      bedrooms: mock.bedrooms,
      bathrooms: mock.bathrooms,
      propertyType: mock.propertyType as 'apartment' | 'house' | 'condo' | 'land' | 'commercial',
      listingType: mock.listingType,
      listingSubType: mock.listingSubType,
      lat: mock.lat,
      lng: mock.lng,
      address: mock.address,
      neighborhood: mock.neighborhood,
      city: mock.city,
      images: mock.images,
      amenities: mock.amenities,
      publisherId: publisher.id,
      isMock: true,
      embedding: JSON.stringify(embedding),
    };

    const property = await createPropertyUseCase.execute(propertyData);
    created.push({ id: property.id, title: property.title });
  }

  return { count: created.length, properties: created };
}

export async function countMockProperties(): Promise<number> {
  return prisma.property.count({
    where: { isMock: true },
  });
}

export async function purgeMockProperties(): Promise<{ count: number }> {
  const result = await prisma.property.deleteMany({
    where: { isMock: true },
  });
  return { count: result.count };
}
