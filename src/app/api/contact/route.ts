import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { sendContactNotification } from '@/lib/notifications/email';

export async function POST(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const body = await request.json();
    const { propertyId, propertyTitle, name, email, phone, message } = body as Record<string, unknown>;

    if (typeof propertyId !== 'string' || !propertyId.trim()) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'propertyId inválido' } }, { status: 400 });
    }
    if (typeof propertyTitle !== 'string' || !propertyTitle.trim()) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'propertyTitle inválido' } }, { status: 400 });
    }
    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Nombre inválido' } }, { status: 400 });
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email inválido' } }, { status: 400 });
    }
    if (typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Mensaje inválido' } }, { status: 400 });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, publisherId: true },
    });

    if (!property) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Propiedad no encontrada' } }, { status: 404 });
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        propertyId,
        propertyTitle: propertyTitle.trim(),
        senderName: name.trim(),
        senderEmail: email.trim(),
        senderPhone: typeof phone === 'string' && phone.trim() ? phone.trim() : null,
        message: message.trim(),
        recipientId: property.publisherId || null,
      },
      select: {
        id: true,
        propertyId: true,
        propertyTitle: true,
        senderName: true,
        senderEmail: true,
        senderPhone: true,
        message: true,
        recipientId: true,
        status: true,
        createdAt: true,
      },
    });

    if (property.publisherId) {
      const publisher = await prisma.publisherProfile.findUnique({
        where: { id: property.publisherId },
        select: { phone: true },
      });

      const user = await prisma.user.findUnique({
        where: { id: property.publisherId },
        select: { email: true },
      });

      const recipientEmail = user?.email || null;
      const recipientPhone = publisher?.phone || null;

      if (recipientEmail) {
        await sendContactNotification({
          to: recipientEmail,
          propertyTitle: propertyTitle.trim(),
          senderName: name.trim(),
          senderEmail: email.trim(),
          senderPhone: typeof phone === 'string' && phone.trim() ? phone.trim() : undefined,
          message: message.trim(),
        }).catch((err) => {
          console.error('Resend notification error:', err);
        });
      }
    }

    return NextResponse.json({ success: true, data: contactMessage }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 });
  }
}
