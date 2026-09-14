import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { logAuthFailure } from '@/lib/security/auditLog';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      logAuthFailure(request, 'missing_session');
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } }, { status: 401 });
    }

    const { id: propertyId } = await params;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, publisherId: true },
    });

    if (!property) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Propiedad no encontrada' } }, { status: 404 });
    }

    const publisher = property.publisherId
      ? await prisma.publisherProfile.findUnique({
          where: { id: property.publisherId },
          select: { userId: true },
        })
      : null;

    if (!publisher || publisher.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'No tenés permiso para eliminar esta propiedad' } }, { status: 403 });
    }

    await prisma.property.delete({
      where: { id: propertyId },
    });

    return successResponse({ deleted: true });
  } catch {
    return errorResponse('INTERNAL_ERROR', 'Failed to delete property');
  }
}
