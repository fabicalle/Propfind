import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withCsrf } from '@/lib/security/withCsrf';
import { withRateLimit } from '@/lib/rateLimit';
import { sendContactNotification } from '@/lib/notifications/email';

const ContactSchema = z.object({
  propertyId: z.string().min(1, 'propertyId inválido'),
  propertyTitle: z.string().min(1, 'propertyTitle inválido'),
  name: z.string().min(2, 'Nombre inválido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Mensaje inválido'),
});

async function POST_impl(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const body = await request.json();
    const validated = ContactSchema.parse(body);

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
          select: { userId: true, phone: true },
        })
      : null;

    const recipientUserId = publisher?.userId || null;

    const contactMessage = await prisma.contactMessage.create({
      data: {
        propertyId: validated.propertyId,
        propertyTitle: validated.propertyTitle.trim(),
        senderName: validated.name.trim(),
        senderEmail: validated.email.trim(),
        senderPhone: validated.phone?.trim() || null,
        message: validated.message.trim(),
        recipientId: recipientUserId,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    const user = recipientUserId
      ? await prisma.user.findUnique({
          where: { id: recipientUserId },
          select: { email: true },
        })
      : null;

    const recipientEmail = user?.email || null;

    if (recipientEmail) {
      await sendContactNotification({
        to: recipientEmail,
        propertyTitle: validated.propertyTitle.trim(),
        senderName: validated.name.trim(),
        senderEmail: validated.email.trim(),
        senderPhone: validated.phone?.trim() || undefined,
        message: validated.message.trim(),
      }).catch((err) => {
        console.error('Resend notification error:', err);
      });
    }

    return NextResponse.json({ success: true, data: contactMessage }, { status: 201 });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 });
  }
}

export const POST = withRateLimit(withCsrf(POST_impl));
