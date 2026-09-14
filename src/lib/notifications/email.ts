import { env } from '@/lib/env';

export async function sendContactNotification(params: {
  to: string;
  propertyTitle: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  message: string;
}) {
  const apiKey = env.resendApiKey;
  if (!apiKey) {
    console.warn('Resend not configured: missing RESEND_API_KEY');
    return { success: false, error: new Error('Missing RESEND_API_KEY') };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: 'PropFind <noreply@propfind.com.ar>',
      to: params.to,
      replyTo: params.senderEmail,
      subject: `Nueva consulta por "${params.propertyTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Nueva consulta por ${params.propertyTitle}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2D5A43 0%, #1a3d2e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #F5F2EB; margin: 0; font-size: 24px;">PropFind</h1>
              <p style="color: #C86D51; margin: 8px 0 0 0; font-size: 14px;">Nueva consulta por tu propiedad</p>
            </div>
            
            <div style="background: #F5F2EB; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e0d5;">
              <h2 style="color: #231F1D; margin-top: 0;">${params.propertyTitle}</h2>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #C86D51; margin-top: 0; font-size: 16px;">Datos del interesado</h3>
                <p style="margin: 8px 0;"><strong>Nombre:</strong> ${params.senderName}</p>
                <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${params.senderEmail}" style="color: #2D5A43;">${params.senderEmail}</a></p>
                ${params.senderPhone ? `<p style="margin: 8px 0;"><strong>Teléfono:</strong> <a href="tel:${params.senderPhone}" style="color: #2D5A43;">${params.senderPhone}</a></p>` : ''}
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #C86D51; margin-top: 0; font-size: 16px;">Mensaje</h3>
                <p style="white-space: pre-wrap; color: #231F1D;">${params.message}</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e0d5;">
                <p style="color: #6E675F; font-size: 12px; margin: 0;">
                  Este mensaje fue enviado desde PropFind. Respondé directamente a ${params.senderEmail}.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
