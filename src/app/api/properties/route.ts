import { NextRequest } from 'next/server';
import { z } from 'zod';
import { CreatePropertyUseCase } from '@/application/use-cases/CreatePropertyUseCase';
import { PrismaPropertyRepository } from '@/infrastructure/repositories/PrismaRepositories';
import { successResponse, errorResponse } from '@/lib/api/response';
import { PrismaClient } from '@prisma/client';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withCsrf } from '@/lib/security/withCsrf';
import { withRateLimit } from '@/lib/rateLimit';
import { logAuthFailure } from '@/lib/security/auditLog';

const prisma = new PrismaClient();

const CreatePropertySchema = z.object({
  title: z.string().min(1),
  listingType: z.enum(['sale', 'rent']),
  propertyType: z.enum(['apartment', 'house', 'condo', 'land', 'commercial']).optional(),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  priceCurrency: z.enum(['ARS', 'USD']),
  areaM2: z.number().min(0, 'La superficie no puede ser negativa').optional(),
  rooms: z.number().int().min(0, 'Los ambientes no pueden ser negativos').optional(),
  bedrooms: z.number().int().min(0, 'Los dormitorios no pueden ser negativos').optional(),
  bathrooms: z.number().int().min(0, 'Los baños no pueden ser negativos').optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  amenities: z.array(z.string()).optional(),
  description: z.string().optional(),
  images: z.array(z.object({
    url: z.string(),
    width: z.number(),
    height: z.number(),
    alt: z.string().optional(),
  })).optional(),
  userId: z.string().uuid(),
  listingSubType: z.string().optional(),
  creditApproved: z.boolean().optional(),
  parking: z.string().optional(),
});

const propertyRepository = new PrismaPropertyRepository();
const createPropertyUseCase = new CreatePropertyUseCase(propertyRepository);

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
    const validated = CreatePropertySchema.parse(body);

    if (validated.userId !== session.user.id) {
      return errorResponse('FORBIDDEN', 'No autorizado', 403);
    }

    const hasPublisherProfile = await prisma.publisherProfile.findUnique({
      where: { userId: validated.userId },
      select: { id: true },
    });

    let publisherId = hasPublisherProfile?.id ?? null;

    if (!publisherId) {
      const profile = await prisma.publisherProfile.create({
        data: {
          userId: validated.userId,
          phone: undefined,
        },
        select: { id: true },
      });
      publisherId = profile.id;
    }

    const propertyId = await createPropertyUseCase.execute({
      title: validated.title,
      description: validated.description,
      price: validated.price,
      priceCurrency: validated.priceCurrency,
      areaM2: validated.areaM2,
      rooms: validated.rooms,
      bedrooms: validated.bedrooms,
      bathrooms: validated.bathrooms,
      propertyType: validated.propertyType,
      listingType: validated.listingType,
      listingSubType: validated.listingSubType,
      creditApproved: validated.creditApproved,
      parking: validated.parking,
      lat: validated.lat,
      lng: validated.lng,
      address: validated.address,
      neighborhood: validated.neighborhood,
      city: validated.city,
      images: validated.images,
      amenities: validated.amenities,
      publisherId: publisherId ?? undefined,
    });

    return successResponse({ id: propertyId }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input', 400);
    }
    return errorResponse('INTERNAL_ERROR', 'Failed to create property');
  }
}

export const POST = withRateLimit(withCsrf(POST_impl));
