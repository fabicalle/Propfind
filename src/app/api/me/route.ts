import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { rejectInvalidOrigin } from '@/lib/security/origin';

export async function GET(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ userId: null, email: null });
    }

    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, profile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          email: session.user.email ?? `${session.user.id}@anonymous.local`,
          authProvider: 'google',
          authProviderId: session.user.id,
          profile: {},
        },
        select: { id: true, email: true, profile: true },
      });
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email,
    });
  } catch {
    return NextResponse.json({ userId: null, email: null }, { status: 500 });
  }
}
