import { NextRequest } from 'next/server';
import { z } from 'zod';
import { RecordSwipeUseCase } from '@/application/use-cases/propertyUseCases';
import { PrismaPropertyRepository, PrismaInteractionRepository } from '@/infrastructure/repositories/PrismaRepositories';
import { MockPropertyRepository, MockInteractionRepository } from '@/mocks/repositories';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { withRateLimit } from '@/lib/rateLimit';
import { withCsrf } from '@/lib/security/withCsrf';
import { rejectInvalidOrigin } from '@/lib/security/origin';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

const propertyRepository = USE_MOCK ? new MockPropertyRepository() : new PrismaPropertyRepository();
const interactionRepository = USE_MOCK ? new MockInteractionRepository() : new PrismaInteractionRepository();
const recordSwipeUseCase = new RecordSwipeUseCase(interactionRepository, propertyRepository);

const SwipeSchema = z.object({
  propertyId: z.string().uuid(),
  direction: z.enum(['left', 'right', 'up']),
  metadata: z.object({
    swipeVelocity: z.number().optional(),
    timeOnCardMs: z.number().int().nonnegative().optional(),
    source: z.string().optional(),
  }).optional(),
});

async function POST_impl(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const body = await request.json();
    const validated = SwipeSchema.parse(body);

    const session = await getSessionFromRequest(request);
    const sessionId = request.headers.get('x-session-id') || 'anonymous';
    const userId = session?.user?.id;

    const nextProperty = await recordSwipeUseCase.execute(
      {
        propertyId: validated.propertyId,
        direction: validated.direction,
        metadata: validated.metadata,
      },
      sessionId,
      userId
    );

    if (!nextProperty) {
      return successResponse({ nextProperty: null, remainingInQueue: 0 });
    }

    const feedProperty = {
      id: nextProperty.id,
      title: nextProperty.title,
      price: nextProperty.price,
      listingType: nextProperty.listingType,
      neighborhood: nextProperty.neighborhood,
      city: nextProperty.city,
      lat: nextProperty.lat,
      lng: nextProperty.lng,
      images: nextProperty.images.slice(0, 1),
      rooms: nextProperty.rooms,
      areaM2: nextProperty.areaM2,
      bathrooms: nextProperty.bathrooms,
      amenities: nextProperty.amenities,
    };

    return successResponse({ nextProperty: feedProperty, remainingInQueue: 0 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input', 400);
    }
    return errorResponse('INTERNAL_ERROR', 'Failed to process swipe');
  }
}

export const POST = withRateLimit(withCsrf(POST_impl));
