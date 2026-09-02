import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withCsrf } from '@/lib/security/withCsrf';
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profile: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' } }, { status: 404 });
    }

    const profile = (user.profile as Record<string, unknown>) || {};

    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
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
    const { firstName, lastName, phone } = body as {
      firstName?: string;
      lastName?: string;
      phone?: string;
    };

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Nombre y apellido son obligatorios' } }, { status: 400 });
    }

    if (!phone?.trim()) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'El teléfono es obligatorio' } }, { status: 400 });
    }

    const cleanedPhone = phone.replace(/[\s\-()]/g, '');
    if (!/^\+?\d{7,15}$/.test(cleanedPhone)) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Ingresá un número válido con código de área' } }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' } }, { status: 404 });
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
