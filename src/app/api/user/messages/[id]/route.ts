import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { prisma } from '@/lib/prisma';
import { rejectInvalidOrigin } from '@/lib/security/origin';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } }, { status: 401 });
    }

    const messageId = params.id;

    const message = await prisma.contactMessage.findUnique({
      where: { id: messageId },
      select: { id: true, recipientId: true },
    });

    if (!message) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Mensaje no encontrado' } }, { status: 404 });
    }

    if (message.recipientId !== session.user.id) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'No autorizado' } }, { status: 403 });
    }

    const updated = await prisma.contactMessage.update({
      where: { id: messageId },
      data: { read: true },
      select: { id: true, read: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } }, { status: 401 });
    }

    const messageId = params.id;

    const message = await prisma.contactMessage.findUnique({
      where: { id: messageId },
      select: { id: true, recipientId: true },
    });

    if (!message) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Mensaje no encontrado' } }, { status: 404 });
    }

    if (message.recipientId !== session.user.id) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'No autorizado' } }, { status: 403 });
    }

    await prisma.contactMessage.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true, data: { id: messageId } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 });
  }
}
