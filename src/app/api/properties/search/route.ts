import { NextRequest } from 'next/server';
import { z } from 'zod';
import { SearchPropertiesUseCase } from '@/application/use-cases/propertyUseCases';
import { PrismaPropertyRepository, PrismaInteractionRepository } from '@/infrastructure/repositories/PrismaRepositories';
import { MockPropertyRepository, MockInteractionRepository } from '@/mocks/repositories';
import { successResponse, errorResponse } from '@/lib/api/response';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withCsrf } from '@/lib/security/withCsrf';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { seedMockProperties, countMockProperties, purgeMockProperties } from '@/lib/mock-data-seeder';
import { headers } from 'next/headers';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';
const AUTO_SEED = env.isDev && !USE_MOCK;
const EXPECTED_MOCK_COUNT = 26;

const propertyRepository = USE_MOCK ? new MockPropertyRepository() : new PrismaPropertyRepository();
const interactionRepository = USE_MOCK ? new MockInteractionRepository() : new PrismaInteractionRepository();
const searchPropertiesUseCase = new SearchPropertiesUseCase(propertyRepository, interactionRepository);

const searchSchema = z.object({
  query: z.string().optional(),
  locationQuery: z.string().optional(),
  localityIds: z.array(z.string()).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radiusKm: z.number().int().positive().max(500).optional(),
  operationType: z.enum(['RENT', 'SALE']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  excludeIds: z.array(z.string()).optional(),
  filters: z.object({
    priceMin: z.number().optional(),
    priceMax: z.number().optional(),
    areaMin: z.number().optional(),
    areaMax: z.number().optional(),
    rooms: z.array(z.number()).optional(),
    bedrooms: z.array(z.number()).optional(),
    bathrooms: z.number().optional(),
    propertyTypes: z.array(z.string()).optional(),
    amenities: z.array(z.string()).optional(),
    listingType: z.enum(['sale', 'rent']).optional(),
    listingSubType: z.enum(['temporal']).optional(),
    currency: z.enum(['ARS', 'USD']).optional(),
    creditApproved: z.boolean().optional(),
    parking: z.enum(['any', '1+', '2+']).optional(),
    sellerType: z.enum(['OWNER', 'AGENCY']).optional(),
  }).optional(),
});

async function POST_impl(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    if (AUTO_SEED) {
      const forceReseed =
        request.nextUrl.searchParams.get('reseed') === 'true' ||
        request.nextUrl.searchParams.get('reseed') === '1';
      try {
        if (forceReseed) {
          await purgeMockProperties();
          await seedMockProperties();
        } else {
          const mockCount = await countMockProperties();
          if (mockCount !== EXPECTED_MOCK_COUNT) {
            if (mockCount > 0) await purgeMockProperties();
            await seedMockProperties();
          }
        }
      } catch (seedError) {
        console.error('Auto-seed error:', seedError);
      }
    }

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      return errorResponse('VALIDATION_ERROR', 'Request body is empty or not valid JSON', 400);
    }
    const validated = searchSchema.parse(body);

    const headersList = await headers();
    const latFromHeader = parseFloat(headersList.get('x-vercel-ip-latitude') || '');
    const lngFromHeader = parseFloat(headersList.get('x-vercel-ip-longitude') || '');

    const hasExplicitLocation = validated.lat != null && validated.lng != null;
    const hasLocationQuery = Boolean(validated.locationQuery) || Boolean(validated.query) || (validated.localityIds && validated.localityIds.length > 0);

     const params = {
       query: validated.query,
       locationQuery: validated.locationQuery,
       lat: hasExplicitLocation
         ? validated.lat
         : !hasLocationQuery && Number.isFinite(latFromHeader)
           ? latFromHeader
           : undefined,
       lng: hasExplicitLocation
         ? validated.lng
         : !hasLocationQuery && Number.isFinite(lngFromHeader)
           ? lngFromHeader
           : undefined,
       radiusKm: validated.radiusKm ?? 50,
       operationType: validated.operationType ?? undefined,
       page: validated.page ?? 1,
       limit: validated.limit ?? 15,
       localityIds: validated.localityIds,
       excludeIds: validated.excludeIds,
       filters: validated.filters,
     };

    const sessionId = request.headers.get('x-session-id') || undefined;

    let result;
    try {
      result = await searchPropertiesUseCase.execute(params, sessionId);
    } catch (searchError) {
      if (env.isDev) {
        console.error('DB search failed, falling back to mock:', searchError);
        const mockRepo = new MockPropertyRepository();
        const fallbackUseCase = new SearchPropertiesUseCase(mockRepo, new MockInteractionRepository());
        result = await fallbackUseCase.execute(params, sessionId);
      } else {
        throw searchError;
      }
    }

    const publisherIds = Array.from(new Set(result.items.map((p) => p.publisherId).filter((id): id is string => Boolean(id))));

    const publishers = publisherIds.length
      ? await prisma.publisherProfile.findMany({
          where: { id: { in: publisherIds } },
          select: { id: true, userId: true, phone: true },
        })
      : [];

    const unresolvedPublisherIds = result.items
      .map((p) => p.publisherId)
      .filter((id): id is string => Boolean(id));

    const publisherIdSet = new Set(publishers.map((pub) => pub.id));
    const unresolvedByPublisherId = unresolvedPublisherIds.filter((id) => !publisherIdSet.has(id));

    if (unresolvedByPublisherId.length > 0) {
      const fallbackPublishers = await prisma.publisherProfile.findMany({
        where: { userId: { in: unresolvedByPublisherId } },
        select: { id: true, userId: true, phone: true },
      });
      fallbackPublishers.forEach((fp) => publishers.push(fp));
    }

    const allUserIds = Array.from(new Set(publishers.map((p) => p.userId).filter((id): id is string => Boolean(id))));

    const users = allUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: allUserIds } },
          select: { id: true, email: true, profile: true },
        })
      : [];

    const userMap = new Map(users.map((u) => [u.id, u]));
    const publisherMap = new Map(publishers.map((p) => [p.id, p]));
    const publisherByUserMap = new Map(publishers.map((p) => [p.userId, p]));

    const session = await getSessionFromRequest(request);
    const isAuthenticated = Boolean(session?.user?.id);

    const feedProperties = result.items.map((p) => {
      const publisher = publisherMap.get(p.publisherId ?? '') || publisherByUserMap.get(p.publisherId ?? '') || null;
      const user = publisher?.userId ? userMap.get(publisher.userId) : null;
      const profile = (user?.profile as Record<string, unknown> | null) ?? null;
      const publisherPhone = typeof publisher?.phone === 'string' && publisher.phone.trim() ? publisher.phone.trim() : null;
      const profilePhone = typeof profile?.phone === 'string' && profile.phone.trim() ? profile.phone.trim() : null;
      const phone = publisherPhone || profilePhone;
      const name = typeof profile?.name === 'string' ? profile.name : null;
      const email = typeof user?.email === 'string' ? user.email : null;

      const contactInfo =
        name || email || phone
          ? {
              name: name ?? '',
              email: email ?? '',
              phone: phone ?? '',
              whatsapp: phone ?? '',
            }
          : null;

      const safeContactInfo = isAuthenticated && contactInfo ? { name: contactInfo.name } : null;

      return {
        id: p.id,
        title: p.title,
        price: p.price,
        listingType: p.listingType,
        sellerType: p.sellerType,
        neighborhood: p.neighborhood,
        city: p.city,
        lat: p.lat,
        lng: p.lng,
        images: p.images,
        rooms: p.rooms,
        bedrooms: p.bedrooms,
        areaM2: p.areaM2,
        bathrooms: p.bathrooms,
        amenities: p.amenities,
        priceCurrency: p.priceCurrency,
        creditApproved: p.creditApproved,
        parking: p.parking,
        listingSubType: p.listingSubType,
        description: p.description,
        publisherId: p.publisherId,
        contactInfo: safeContactInfo,
      };
    });

    return successResponse({
      properties: feedProperties,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input', 400);
    }
    const message = error instanceof Error ? error.message : 'Failed to search properties';
    return errorResponse('INTERNAL_ERROR', message);
  }
}

export const POST = withCsrf(POST_impl);
