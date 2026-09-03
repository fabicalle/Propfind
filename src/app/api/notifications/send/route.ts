import { NextRequest, NextResponse } from 'next/server';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  const rateLimitResponse = withRateLimit(request, { windowMs: 60_000, max: 10 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { to, propertyTitle, senderName, senderEmail, senderPhone, message } = body as Record<string, unknown>;

    const errors: string[] = [];
    if (typeof to !== 'string' || !to.trim()) errors.push('Destinatario inválido');
    if (typeof propertyTitle !== 'string' || !propertyTitle.trim()) errors.push('Título de propiedad inválido');
    if (typeof senderName !== 'string' || senderName.trim().length < 2) errors.push('Nombre inválido');
    if (typeof senderEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) errors.push('Email inválido');
    if (typeof message !== 'string' || message.trim().length < 10) errors.push('Mensaje inválido');

    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors[0] } }, { status: 400 });
    }

    const text = [
      `Nueva consulta por "${propertyTitle}"`,
      `De: ${senderName}`,
      `Email: ${senderEmail}`,
      senderPhone ? `Teléfono: ${senderPhone}` : null,
      ``,
      `Mensaje:`,
      message,
    ].filter(Boolean).join('\n');

    return NextResponse.json({ success: true, data: { message: 'Notificación simulada', text } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 });
  }
}
