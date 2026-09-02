import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { logAuthFailure } from '@/lib/security/auditLog';

export async function GET(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      logAuthFailure(request, 'missing_session');
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } }, { status: 401 });
    }

    const publisherProfile = await prisma.publisherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!publisherProfile) {
      return successResponse({ properties: [] });
    }

    const properties = await prisma.property.findMany({
      where: { publisherId: publisherProfile.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        price: true,
        priceCurrency: true,
        listingType: true,
        neighborhood: true,
        city: true,
        address: true,
        areaM2: true,
        rooms: true,
        bedrooms: true,
        bathrooms: true,
        propertyType: true,
        listingSubType: true,
        creditApproved: true,
        parking: true,
        images: true,
        description: true,
        amenities: true,
        createdAt: true,
      },
    });

    const mapped = properties.map((p) => ({
      ...p,
      price: p.price.toNumber(),
      areaM2: p.areaM2?.toNumber() || null,
      images: p.images as Array<{ url: string; width: number; height: number; alt?: string }>,
      amenities: p.amenities as string[],
    }));

    return successResponse({ properties: mapped });
  } catch {
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch user properties');
  }
}
