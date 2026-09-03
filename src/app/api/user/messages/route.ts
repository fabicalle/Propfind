import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { prisma } from '@/lib/prisma';
import { rejectInvalidOrigin } from '@/lib/security/origin';

export async function GET(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } }, { status: 401 });
    }

    const messages = await prisma.contactMessage.findMany({
      where: { recipientId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        propertyId: true,
        propertyTitle: true,
        senderName: true,
        senderEmail: true,
        senderPhone: true,
        message: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: { messages } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 });
  }
}
