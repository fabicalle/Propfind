import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withCsrf } from '@/lib/security/withCsrf';
import { withRateLimit } from '@/lib/rateLimit';
import { logAuthFailure } from '@/lib/security/auditLog';

const MagicSyncSchema = z.object({
  filters: z.record(z.unknown()).optional(),
  sessionId: z.string().optional(),
  propertyId: z.string().optional(),
});

async function POST_impl(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      logAuthFailure(request, 'missing_session');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { filters, sessionId, propertyId } = MagicSyncSchema.parse(body);

    if (!sessionId && !filters) {
      return NextResponse.json(
        { error: 'Se requiere sessionId o filters' },
        { status: 400 }
      );
    }

    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        filters: (filters || {}) as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        filters: (filters || {}) as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error en sync' }, { status: 500 });
  }
}

export const POST = withRateLimit(withCsrf(POST_impl));
