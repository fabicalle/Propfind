import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withCsrf } from '@/lib/security/withCsrf';
import { withRateLimit } from '@/lib/rateLimit';
import { logAuthFailure } from '@/lib/security/auditLog';

const saveSchema = z.object({
  propertyId: z.string().uuid(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return successResponse({ properties: [] });
    }

    const saved = await prisma.userSavedProperties.findMany({
      where: { userId: session.user.id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
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
            images: true,
            amenities: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const properties = saved.map((s) => ({
      ...s.property,
      price: s.property.price.toNumber(),
      areaM2: s.property.areaM2?.toNumber() || null,
      images: s.property.images as Array<{ url: string; width: number; height: number; alt?: string }>,
      amenities: s.property.amenities as string[],
      savedAt: s.createdAt,
      tags: s.tags as string[],
      notes: s.notes,
    }));

    return successResponse({ properties });
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch saved properties');
  }
}

async function POST_impl(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      logAuthFailure(request, 'missing_session');
      return errorResponse('UNAUTHORIZED', 'No autorizado', 401);
    }

    const body = await request.json();
    const validated = saveSchema.parse(body);

    const saved = await prisma.userSavedProperties.create({
      data: {
        userId: session.user.id,
        propertyId: validated.propertyId,
        tags: validated.tags || [],
        notes: validated.notes,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
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
            images: true,
            amenities: true,
          },
        },
      },
    });

    const property = {
      ...saved.property,
      price: saved.property.price.toNumber(),
      areaM2: saved.property.areaM2?.toNumber() || null,
      images: saved.property.images as Array<{ url: string; width: number; height: number; alt?: string }>,
      amenities: saved.property.amenities as string[],
      savedAt: saved.createdAt,
      tags: saved.tags as string[],
      notes: saved.notes,
    };

    return successResponse({ property }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input', 400);
    }
    return errorResponse('INTERNAL_ERROR', 'Failed to save property');
  }
}

export const POST = withRateLimit(withCsrf(POST_impl));
