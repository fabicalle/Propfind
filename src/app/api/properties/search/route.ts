import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SearchPropertiesUseCase } from '@/application/use-cases/propertyUseCases';
import { PrismaPropertyRepository, PrismaInteractionRepository } from '@/infrastructure/repositories/PrismaRepositories';
import { MockPropertyRepository, MockInteractionRepository } from '@/mocks/repositories';
import { BoundingBox, PropertySearchFilters, SearchParams } from '@/domain/value-objects';
import { successResponse, errorResponse } from '@/lib/api/response';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withCsrf } from '@/lib/security/withCsrf';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { prisma } from '@/lib/prisma';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

const propertyRepository = USE_MOCK ? new MockPropertyRepository() : new PrismaPropertyRepository();
const interactionRepository = USE_MOCK ? new MockInteractionRepository() : new PrismaInteractionRepository();
const searchPropertiesUseCase = new SearchPropertiesUseCase(propertyRepository, interactionRepository);

const searchSchema = z.object({
  bbox: z.object({
    south: z.number(),
    west: z.number(),
    north: z.number(),
    east: z.number(),
  }).optional(),
  filters: z.object({
    priceMin: z.number().optional(),
    priceMax: z.number().optional(),
    areaMin: z.number().optional(),
    areaMax: z.number().optional(),
    rooms: z.array(z.number()).optional(),
    bedrooms: z.array(z.number()).optional(),
    propertyTypes: z.array(z.string()).optional(),
    amenities: z.array(z.string()).optional(),
    listingType: z.enum(['sale', 'rent']).optional(),
    listingSubType: z.enum(['temporal']).optional(),
    currency: z.enum(['ARS', 'USD']).optional(),
    creditApproved: z.boolean().optional(),
    parking: z.enum(['any', '1+', '2+']).optional(),
    sellerType: z.enum(['OWNER', 'AGENCY']).optional(),
  }).optional(),
  excludeIds: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

async function POST_impl(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      return errorResponse('VALIDATION_ERROR', 'Request body is empty or not valid JSON', 400);
    }
    const validated = searchSchema.parse(body);

    const limit = validated.limit ?? 15;
    const offset = validated.offset ?? 0;

    const bbox: BoundingBox = validated.bbox ?? {
      south: -90,
      west: -180,
      north: 90,
      east: 180,
    };

    const filters: PropertySearchFilters = validated.filters ?? {};

    const searchParams: SearchParams = {
      bbox,
      filters,
      excludeIds: validated.excludeIds,
      limit,
      offset,
    };

    const sessionId = request.headers.get('x-session-id') || undefined;
    const properties = await searchPropertiesUseCase.execute(searchParams, sessionId);

    const publisherIds = Array.from(new Set(properties.map((p) => p.publisherId).filter((id): id is string => Boolean(id))));

    const publishers = publisherIds.length
      ? await prisma.publisherProfile.findMany({
          where: { id: { in: publisherIds } },
          select: { id: true, userId: true, phone: true },
        })
      : [];

    const unresolvedPublisherIds = properties
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

    const feedProperties = properties.map((p) => {
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

      console.log('[Search contactInfo debug]', {
        propertyId: p.id,
        publisherId: p.publisherId,
        matchedPublisher: publisher?.id ?? null,
        publisherUserId: publisher?.userId ?? null,
        publisherPhone: publisher?.phone ?? null,
        profilePhone: profilePhone,
        contactInfo,
      });

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

    return successResponse({ properties: feedProperties, limit, offset });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input', 400);
    }
    const message = error instanceof Error ? error.message : 'Failed to search properties';
    return errorResponse('INTERNAL_ERROR', message);
  }
}

export const POST = withCsrf(POST_impl);
