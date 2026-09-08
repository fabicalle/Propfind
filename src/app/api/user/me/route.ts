import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withCsrf } from '@/lib/security/withCsrf';
import { logAuthFailure } from '@/lib/security/auditLog';

const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, 'Nombre y apellido son obligatorios'),
  lastName: z.string().min(1, 'Nombre y apellido son obligatorios'),
  phone: z.string().regex(/^\+?\d{7,15}$/, 'Ingresá un número válido con código de área'),
});

export async function GET(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } }, { status: 401 });
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

    const profile = (user.profile as Record<string, unknown>) || {};
    const email = session.user.email || user.email || `${session.user.id}@anonymous.local`;

    return NextResponse.json({
      success: true,
      data: {
        email,
        firstName: (profile.firstName as string) || '',
        lastName: (profile.lastName as string) || '',
        phone: (profile.phone as string) || '',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 });
  }
}

async function PATCH_impl(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      logAuthFailure(request, 'missing_session');
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateProfileSchema.parse(body);
    const { firstName, lastName, phone } = validated;

    const cleanedPhone = phone.replace(/[\s\-()]/g, '');

    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profile: true },
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
        select: { profile: true },
      });
    }

    const currentProfile = (user.profile as Record<string, unknown>) || {};

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        profile: JSON.parse(JSON.stringify({
          ...currentProfile,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: cleanedPhone,
        })) as Prisma.InputJsonValue,
      },
      select: { profile: true },
    });

    const newProfile = (updated.profile as Record<string, unknown>) || {};

    return NextResponse.json({
      success: true,
      data: {
        firstName: (newProfile.firstName as string) || '',
        lastName: (newProfile.lastName as string) || '',
        phone: (newProfile.phone as string) || '',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 });
  }
}

export const PATCH = withCsrf(PATCH_impl);
