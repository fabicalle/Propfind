'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, hasPermission, Permission, UnauthorizedError } from '@/lib/permissions';
import {
  ReportPropertySchema,
  ReportPropertyInput,
  ModeratePropertySchema,
  ModeratePropertyInput,
  UpdateUserRoleSchema,
  UpdateUserRoleInput,
  ActionState,
} from '@/lib/schemas';
import type { user_role } from '@prisma/client';

async function getFormDataObject(formData: FormData): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Array.from(formData.entries())) {
    if (value instanceof File && value.size === 0) continue;
    result[key] = value;
  }
  return result;
}

export async function reportPropertyAction(
  prev: ActionState<unknown> | undefined,
  formData: FormData
): Promise<ActionState<{ reported: boolean }>> {
  try {
    const parsed = ReportPropertySchema.safeParse(await getFormDataObject(formData));
    if (!parsed.success) {
      return { success: false, error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const data: ReportPropertyInput = parsed.data;

    const session = await getServerSession();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Debes iniciar sesión' };
    }
    if (!hasPermission(currentUser.role, Permission.REPORT_PROPERTIES)) {
      return { success: false, error: 'No autorizado' };
    }

    try {
      await prisma.propertyReport.create({
        data: {
          property: { connect: { id: data.propertyId } },
          reason: data.reason,
          details: data.details ?? undefined,
          reporterEmail: data.reporterEmail ?? session?.user?.email ?? undefined,
        },
      });
    } catch {
      return { success: false, error: 'Ya has reportado esta propiedad' };
    }

    const reportCount = await prisma.propertyReport.count({
      where: { propertyId: data.propertyId },
    });

    if (reportCount >= 2) {
      await prisma.property.update({
        where: { id: data.propertyId },
        data: { isActive: false },
      });
    }

    revalidatePath('/feed');
    revalidatePath(`/properties/${data.propertyId}`);

    return { success: true, data: { reported: reportCount >= 2 } };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error al enviar el reporte' };
  }
}

export async function moderatePropertyAction(
  prev: ActionState<unknown> | undefined,
  formData: FormData
): Promise<ActionState<{ action: string }>> {
  try {
    const parsed = ModeratePropertySchema.safeParse(await getFormDataObject(formData));
    if (!parsed.success) {
      return { success: false, error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const data: ModeratePropertyInput = parsed.data;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Debes iniciar sesión' };
    }
    if (!hasPermission(currentUser.role, Permission.MODERATE_REPORTS)) {
      return { success: false, error: 'No autorizado: se requieren permisos de administrador' };
    }

    const existing = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { id: true, isActive: true },
    });

    if (!existing) {
      return { success: false, error: 'Propiedad no encontrada' };
    }

    if (data.action === 'ACTIVATE') {
      await prisma.property.update({
        where: { id: data.propertyId },
        data: { isActive: true },
      });
    } else if (data.action === 'DEACTIVATE') {
      await prisma.property.update({
        where: { id: data.propertyId },
        data: { isActive: false },
      });
    } else if (data.action === 'DELETE') {
      await prisma.property.update({
        where: { id: data.propertyId },
        data: { isActive: false },
      });
    }

    revalidatePath('/feed');
    revalidatePath('/admin');
    revalidatePath(`/properties/${data.propertyId}`);

    return { success: true, data: { action: data.action } };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error en la moderación' };
  }
}

export async function updateUserRoleAction(
  prev: ActionState<unknown> | undefined,
  formData: FormData
): Promise<ActionState<{ userId: string; role: string }>> {
  try {
    const parsed = UpdateUserRoleSchema.safeParse(await getFormDataObject(formData));
    if (!parsed.success) {
      return { success: false, error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const data: UpdateUserRoleInput = parsed.data;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Debes iniciar sesión' };
    }
    if (!hasPermission(currentUser.role, Permission.MANAGE_USERS)) {
      return { success: false, error: 'No autorizado: se requieren permisos de administrador' };
    }

    await prisma.user.update({
      where: { id: data.userId },
      data: { role: data.role as user_role },
    });

    revalidatePath('/admin');

    return { success: true, data: { userId: data.userId, role: data.role } };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error al actualizar el rol' };
  }
}
