'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const ReportReasonSchema = z.enum([
  'INAPPROPRIATE_CONTENT',
  'NOT_A_REAL_ESTATE',
  'SPAM_OR_FRAUD',
  'OTHER',
]);

export async function reportPropertyAction(
  prev: { success?: boolean; error?: string } | undefined,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  try {
    const propertyId = formData.get('propertyId') as string;
    const reason = formData.get('reason') as string;
    const details = formData.get('details') as string;
    const reporterEmail = formData.get('reporterEmail') as string;

    const reasonResult = ReportReasonSchema.safeParse(reason);
    if (!reasonResult.success) {
      return { error: 'Motivo de reporte inválido' };
    }

    const session = await getServerSession();

    await prisma.propertyReport.create({
      data: {
        property: { connect: { id: propertyId } },
        reason: reasonResult.data as any,
        details: details || undefined,
        reporterEmail: reporterEmail || session?.user?.email || undefined,
      },
    });

    const reportCount = await prisma.propertyReport.count({
      where: { propertyId },
    });

    if (reportCount >= 2) {
      await prisma.property.update({
        where: { id: propertyId },
        data: { isActive: false },
      });
    }

    revalidatePath('/feed');
    revalidatePath(`/properties/${propertyId}`);

    return { success: true };
  } catch (error) {
    return { error: 'Error al enviar el reporte' };
  }
}
