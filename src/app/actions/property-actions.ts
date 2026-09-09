'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, hasPermission, Permission, UnauthorizedError } from '@/lib/permissions';
import type { user_role, ReportReason } from '@prisma/client';

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

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Debes iniciar sesión' };
    }
    if (!hasPermission(currentUser.role, Permission.REPORT_PROPERTIES)) {
      return { error: 'No autorizado' };
    }

    await prisma.propertyReport.create({
      data: {
        property: { connect: { id: propertyId } },
        reason: reasonResult.data as ReportReason,
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
    if (error instanceof UnauthorizedError) {
      return { error: error.message };
    }
    return { error: 'Error al enviar el reporte' };
  }
}

const ModerationActionSchema = z.enum(['ACTIVATE', 'DEACTIVATE', 'DELETE']);

interface ModerationResult {
  success?: boolean;
  error?: string;
}

export async function moderatePropertyAction(
  prev: ModerationResult | undefined,
  formData: FormData
): Promise<ModerationResult> {
  try {
    const propertyId = formData.get('propertyId') as string;
    const action = formData.get('action') as string;

    const actionResult = ModerationActionSchema.safeParse(action);
    if (!actionResult.success) {
      return { error: 'Acción inválida' };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Debes iniciar sesión' };
    }
    if (!hasPermission(currentUser.role, Permission.MODERATE_REPORTS)) {
      return { error: 'No autorizado: se requieren permisos de administrador' };
    }

    const existing = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, isActive: true },
    });

    if (!existing) {
      return { error: 'Propiedad no encontrada' };
    }

    if (actionResult.data === 'ACTIVATE') {
      await prisma.property.update({
        where: { id: propertyId },
        data: { isActive: true },
      });
    } else if (actionResult.data === 'DEACTIVATE') {
      await prisma.property.update({
        where: { id: propertyId },
        data: { isActive: false },
      });
    } else if (actionResult.data === 'DELETE') {
      await prisma.property.update({
        where: { id: propertyId },
        data: { isActive: false },
      });
    }

    revalidatePath('/feed');
    revalidatePath('/admin');
    revalidatePath(`/properties/${propertyId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { error: error.message };
    }
    return { error: 'Error en la moderación' };
  }
}

const UpdateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['FINDER', 'OWNER', 'REALTOR', 'DEVELOPER_B2B', 'ADMIN']),
});

export async function updateUserRoleAction(
  prev: { success?: boolean; error?: string } | undefined,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  try {
    const userId = formData.get('userId') as string;
    const role = formData.get('role') as string;

    const result = UpdateUserRoleSchema.safeParse({ userId, role });
    if (!result.success) {
      return { error: 'Datos inválidos' };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Debes iniciar sesión' };
    }
    if (!hasPermission(currentUser.role, Permission.MANAGE_USERS)) {
      return { error: 'No autorizado: se requieren permisos de administrador' };
    }

    await prisma.user.update({
      where: { id: result.data.userId },
      data: { role: result.data.role as user_role },
    });

    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { error: error.message };
    }
    return { error: 'Error al actualizar el rol' };
  }
}
