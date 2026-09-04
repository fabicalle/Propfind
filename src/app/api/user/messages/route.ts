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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || '1'));
    const pageSize = 15;
    const skip = (page - 1) * pageSize;

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where: {
          OR: [
            { recipientId: session.user.id },
            ...(user?.email ? [{ senderEmail: user.email }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          propertyId: true,
          propertyTitle: true,
          senderName: true,
          senderEmail: true,
          senderPhone: true,
          message: true,
          status: true,
          read: true,
          createdAt: true,
        },
      }),
      prisma.contactMessage.count({
        where: {
          OR: [
            { recipientId: session.user.id },
            ...(user?.email ? [{ senderEmail: user.email }] : []),
          ],
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 });
  }
}
