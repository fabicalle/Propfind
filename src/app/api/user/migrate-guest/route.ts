import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withCsrf } from '@/lib/security/withCsrf';
import { withRateLimit } from '@/lib/rateLimit';
import { logAuthFailure } from '@/lib/security/auditLog';

const migrateSchema = z.object({
  swipes: z.array(
    z.object({
      propertyId: z.string().uuid(),
      action: z.enum(['LIKE', 'DISLIKE']),
      timestamp: z.number(),
    })
  ),
});

async function POST_impl(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      logAuthFailure(request, 'missing_session');
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } }, { status: 401 });
    }

    const body = await request.json();
    const validated = migrateSchema.parse(body);

    const userId = session.user.id;

    for (const swipe of validated.swipes) {
      await prisma.userInteraction.create({
        data: {
          userId,
          propertyId: swipe.propertyId,
          interactionType: swipe.action === 'LIKE' ? 'SWIPE_RIGHT' : 'SWIPE_LEFT',
          swipeDirection: swipe.action === 'LIKE' ? 'right' : 'left',
          sessionId: userId,
          metadata: { source: 'guest_migration', timestamp: swipe.timestamp },
        },
      });

      if (swipe.action === 'LIKE') {
        await prisma.userSavedProperties.upsert({
          where: {
            userId_propertyId: {
              userId,
              propertyId: swipe.propertyId,
            },
          },
          create: {
            userId,
            propertyId: swipe.propertyId,
            tags: [],
          },
          update: {},
        });
      }
    }

    return NextResponse.json({ success: true, data: { migrated: validated.swipes.length } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0]?.message || 'Invalid input' } }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 });
  }
}

export const POST = withRateLimit(withCsrf(POST_impl));
