import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MockPropertyRepository } from '@/mocks/repositories';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withCsrf } from '@/lib/security/withCsrf';
import { withRateLimit } from '@/lib/rateLimit';
import { logAuthFailure } from '@/lib/security/auditLog';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

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

    let contactInfo = null;

    if (!USE_MOCK && property.publisherId) {
      const publisher = await prisma.publisherProfile.findUnique({
        where: { id: property.publisherId },
        select: { id: true, userId: true, phone: true },
      });

      if (!publisher) {
        const fallbackPublisher = await prisma.publisherProfile.findFirst({
          where: { userId: property.publisherId },
          select: { id: true, userId: true, phone: true },
        });
        if (fallbackPublisher) {
          property.publisherId = fallbackPublisher.id;
        }
      }

      const targetPublisher = publisher ?? await prisma.publisherProfile.findUnique({
        where: { id: property.publisherId },
        select: { userId: true, phone: true },
      });

      const user = targetPublisher?.userId
        ? await prisma.user.findUnique({
            where: { id: targetPublisher.userId },
            select: { email: true, profile: true },
          })
        : null;

      const profile = (user?.profile as Record<string, unknown> | null) ?? null;
      const name = typeof profile?.name === 'string' ? profile.name : null;
      const email = typeof user?.email === 'string' ? user.email : null;
      const publisherPhone = typeof targetPublisher?.phone === 'string' && targetPublisher.phone.trim() ? targetPublisher.phone.trim() : null;
      const profilePhone = typeof profile?.phone === 'string' && profile.phone.trim() ? profile.phone.trim() : null;
      const phone = publisherPhone || profilePhone;
      const whatsapp = phone;

      if (name || email || phone) {
        contactInfo = {
          name: name ?? '',
          email: email ?? '',
          phone: phone ?? '',
          whatsapp: whatsapp ?? '',
        };
      }
    } else if (USE_MOCK) {
      const mockRepo = new MockPropertyRepository();
      const mockProperty = await mockRepo.findById(id);
      contactInfo = mockProperty?.contactInfo ?? null;
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
          contactInfo,
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
        title: body.title,
        description: body.description,
        price: body.price,
        priceCurrency: body.priceCurrency,
        totalMonthlyCost: body.totalMonthlyCost,
        areaM2: body.areaM2,
        rooms: body.rooms,
        bathrooms: body.bathrooms,
        propertyType: body.propertyType,
        listingType: body.listingType,
        lat: body.lat,
        lng: body.lng,
        address: body.address,
        neighborhood: body.neighborhood,
        city: body.city,
        images: body.images,
        amenities: body.amenities,
        sourceUrl: body.sourceUrl,
      },
    });

    return successResponse({ id: property.id });
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 'Failed to update property');
  }
}

export const PUT = withRateLimit(withCsrf(PUT_impl));
