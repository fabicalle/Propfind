import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withRateLimit } from '@/lib/rateLimit';

const contactSchema = {
  propertyId: { type: 'string', required: true },
  propertyTitle: { type: 'string', required: true },
  name: { type: 'string', required: true, minLength: 2 },
  email: { type: 'string', required: true, email: true },
  phone: { type: 'string', required: false },
  message: { type: 'string', required: true, minLength: 10 },
};

export async function POST(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  const rateLimitResponse = withRateLimit(request, { windowMs: 60_000, max: 5 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { propertyId, propertyTitle, name, email, phone, message } = body as Record<string, unknown>;

    const errors: string[] = [];
    if (typeof propertyId !== 'string' || !propertyId.trim()) errors.push('propertyId inválido');
    if (typeof propertyTitle !== 'string' || !propertyTitle.trim()) errors.push('propertyTitle inválido');
    if (typeof name !== 'string' || name.trim().length < 2) errors.push('Nombre inválido');
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email inválido');
    if (typeof phone === 'string' && phone.trim()) {
      const cleaned = phone.replace(/[\s\-()]/g, '');
      if (!/^\+?\d{7,15}$/.test(cleaned)) errors.push('Teléfono inválido');
    }
    if (typeof message !== 'string' || message.trim().length < 10) errors.push('Mensaje inválido');

    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors[0] } }, { status: 400 });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, publisherId: true, contactInfo: true },
    });

    if (!property) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Propiedad no encontrada' } }, { status: 404 });
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        propertyId,
        propertyTitle,
        senderName: name.trim(),
        senderEmail: email.trim(),
        senderPhone: phone?.trim() || null,
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

    const contactInfo = property.contactInfo as Record<string, unknown> | null;
    const recipientEmail = contactInfo?.email as string | undefined;
    const recipientWhatsApp = contactInfo?.whatsapp as string | undefined;

    if (recipientEmail || recipientWhatsApp) {
      try {
        const text = [
          `Nueva consulta por "${propertyTitle}"`,
          `De: ${name.trim()}`,
          `Email: ${email.trim()}`,
          phone?.trim() ? `Teléfono: ${phone.trim()}` : null,
          ``,
          `Mensaje:`,
          message.trim(),
        ].filter(Boolean).join('\n');

        const payload: Record<string, unknown> = {
          to: recipientEmail || recipientWhatsAPP,
          propertyTitle,
          senderName: name.trim(),
          senderEmail: email.trim(),
          senderPhone: phone?.trim() || null,
          message: message.trim(),
          text,
        };

        if (recipientWhatsApp) {
          payload.whatsapp = `https://wa.me/${recipientWhatsAPP}?text=${encodeURIComponent(text)}`;
        }

        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      } catch {
        // ignore notification failures
      }
    }

    return NextResponse.json({ success: true, data: contactMessage }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 });
  }
}
