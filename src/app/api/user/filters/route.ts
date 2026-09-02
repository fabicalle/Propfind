import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withCsrf } from '@/lib/security/withCsrf';
import { withRateLimit } from '@/lib/rateLimit';
import { logAuthFailure } from '@/lib/security/auditLog';

const createFilterSchema = z.object({
  filterName: z.string().min(1).max(100),
  criteria: z.object({
    priceMin: z.number().optional(),
    priceMax: z.number().optional(),
    areaMin: z.number().optional(),
    areaMax: z.number().optional(),
    rooms: z.array(z.number()).optional(),
    propertyTypes: z.array(z.string()).optional(),
    amenities: z.array(z.string()).optional(),
    listingType: z.enum(['sale', 'rent']).optional(),
  }),
  isDefault: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return successResponse({ filters: [] });
    }

    const filters = await prisma.savedFilter.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filterName: true,
        criteria: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return successResponse({ filters });
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch filters');
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
    const validated = createFilterSchema.parse(body);

    const filter = await prisma.savedFilter.create({
      data: {
        userId: session.user.id,
        filterName: validated.filterName,
        criteria: validated.criteria,
        isDefault: validated.isDefault ?? false,
      },
      select: {
        id: true,
        filterName: true,
        criteria: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return successResponse({ filter }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input', 400);
    }
    return errorResponse('INTERNAL_ERROR', 'Failed to create filter');
  }
}

export const POST = withRateLimit(withCsrf(POST_impl));
