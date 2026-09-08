import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { MockPropertyRepository } from '@/mocks/repositories';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withCsrf } from '@/lib/security/withCsrf';
import { withRateLimit } from '@/lib/rateLimit';
import { logAuthFailure } from '@/lib/security/auditLog';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

const UpdatePropertySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1, 'La descripción es requerida'),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  priceCurrency: z.enum(['ARS', 'USD']),
  totalMonthlyCost: z.number().min(0).optional(),
  areaM2: z.number().min(0, 'La superficie no puede ser negativa').optional(),
  rooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  propertyType: z.enum(['apartment', 'house', 'condo', 'land', 'commercial']).optional(),
  listingType: z.enum(['sale', 'rent']),
  lat: z.number().refine((v) => v !== 0, 'La latitud es requerida'),
  lng: z.number().refine((v) => v !== 0, 'La longitud es requerida'),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  departmentId: z.string().optional(),
  localityId: z.string().optional(),
  images: z.array(z.object({
    url: z.string(),
    width: z.number(),
    height: z.number(),
    alt: z.string().optional(),
  })).optional(),
  amenities: z.array(z.string()).optional(),
  sourceUrl: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let property = null;

    if (USE_MOCK) {
      const mockRepo = new MockPropertyRepository();
      property = await mockRepo.findById(id);
    } else {
      property = await prisma.property.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          priceCurrency: true,
          totalMonthlyCost: true,
          areaM2: true,
          rooms: true,
          bathrooms: true,
          propertyType: true,
          listingType: true,
          lat: true,
          lng: true,
          address: true,
          neighborhood: true,
          city: true,
          departmentId: true,
          localityId: true,
          images: true,
          amenities: true,
          sourceUrl: true,
          isActive: true,
          publisherId: true,
        },
      });
    }

    if (!property || !property.isActive) {
      return errorResponse('NOT_FOUND', 'Property not found', 404);
    }

    const toNumber = (value: number | { toNumber(): number } | null | undefined): number | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'number') return value;
      return value.toNumber();
    };

    const session = await getSessionFromRequest(request);
    const isAuthenticated = Boolean(session?.user?.id);

    let publicContactInfo = null;

    if (!USE_MOCK && property.publisherId) {
      const publisher = await prisma.publisherProfile.findUnique({
        where: { id: property.publisherId },
        select: { id: true, userId: true },
      });

      if (!publisher) {
        const fallbackPublisher = await prisma.publisherProfile.findFirst({
          where: { userId: property.publisherId },
          select: { id: true, userId: true },
        });
        if (fallbackPublisher) {
          property.publisherId = fallbackPublisher.id;
        }
      }

      const targetPublisher = publisher ?? await prisma.publisherProfile.findUnique({
        where: { id: property.publisherId },
        select: { userId: true },
      });

      const user = targetPublisher?.userId
        ? await prisma.user.findUnique({
            where: { id: targetPublisher.userId },
            select: { profile: true },
          })
        : null;

      const profile = (user?.profile as Record<string, unknown> | null) ?? null;
      const name = typeof profile?.name === 'string' ? profile.name : null;

      if (isAuthenticated && name) {
        publicContactInfo = { name };
      }
    } else if (USE_MOCK) {
      const mockRepo = new MockPropertyRepository();
      const mockProperty = await mockRepo.findById(id);
      publicContactInfo = mockProperty?.contactInfo ? { name: mockProperty.contactInfo.name ?? '' } : null;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...property,
          price: toNumber(property.price) ?? 0,
          areaM2: toNumber(property.areaM2),
          totalMonthlyCost: toNumber(property.totalMonthlyCost),
          images: property.images as Array<{ url: string; width: number; height: number; alt?: string }>,
          amenities: property.amenities as string[],
          contactInfo: publicContactInfo,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch property');
  }
}

async function PUT_impl(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      logAuthFailure(request, 'missing_session');
      return errorResponse('UNAUTHORIZED', 'No autorizado', 401);
    }

    const { id } = await params;
    const body = await request.json();
    const validated = UpdatePropertySchema.parse(body);

    const existing = await prisma.property.findUnique({
      where: { id },
      select: { publisherId: true },
    });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Property not found', 404);
    }

    const publisher = existing.publisherId
      ? await prisma.publisherProfile.findUnique({
          where: { id: existing.publisherId },
          select: { userId: true },
        })
      : null;

    if (!publisher || publisher.userId !== session.user.id) {
      return errorResponse('FORBIDDEN', 'No autorizado', 403);
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        title: validated.title,
        description: validated.description,
        price: validated.price,
        priceCurrency: validated.priceCurrency,
        totalMonthlyCost: validated.totalMonthlyCost,
        areaM2: validated.areaM2,
        rooms: validated.rooms,
        bathrooms: validated.bathrooms,
        propertyType: validated.propertyType,
        listingType: validated.listingType,
        lat: validated.lat,
        lng: validated.lng,
        address: validated.address,
        neighborhood: validated.neighborhood,
        city: validated.city,
        departmentId: validated.departmentId,
        localityId: validated.localityId,
        images: validated.images,
        amenities: validated.amenities,
        sourceUrl: validated.sourceUrl,
      },
    });

    return successResponse({ id: property.id });
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 'Failed to update property');
  }
}

export const PUT = withRateLimit(withCsrf(PUT_impl));
