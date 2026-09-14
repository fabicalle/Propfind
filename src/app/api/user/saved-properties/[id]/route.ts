import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withCsrf } from '@/lib/security/withCsrf';
import { withRateLimit } from '@/lib/rateLimit';
import { logAuthFailure } from '@/lib/security/auditLog';

const IdSchema = z.object({
  id: z.string().uuid(),
});

async function DELETE_impl(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const { id } = await params;
    const validated = IdSchema.parse({ id });
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      logAuthFailure(request, 'missing_session');
      return errorResponse('UNAUTHORIZED', 'No autorizado', 401);
    }

    const deleted = await prisma.userSavedProperties.deleteMany({
      where: {
        id: validated.id,
        userId: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return errorResponse('NOT_FOUND', 'Saved property not found', 404);
    }

    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input', 400);
    }
    return errorResponse('INTERNAL_ERROR', 'Failed to unsave property');
  }
}

export const DELETE = withRateLimit(withCsrf(DELETE_impl));
