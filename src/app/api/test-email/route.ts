import { NextRequest, NextResponse } from 'next/server';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { Resend } from 'resend';

export async function GET(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'RESEND_API_KEY no configurada' }, { status: 500 });
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'PropFind <noreply@propfind.com.ar>',
      to: ['fabicalle@gmail.com'],
      subject: 'Prueba de Resend desde PropFind',
      html: '<p>Si recibís este email, Resend está funcionando correctamente.</p>',
    });

    if (error) {
      return NextResponse.json({ success: false, error: JSON.stringify(error) }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
