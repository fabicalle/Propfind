'use server';

import { getCurrentUser, hasPermission, Permission, UnauthorizedError } from '@/lib/permissions';
import { seedMockProperties, countMockProperties, purgeMockProperties } from '@/lib/mock-data-seeder';
import { revalidatePath } from 'next/cache';

interface MockActionResult {
  success?: boolean;
  error?: string;
  count?: number;
}

export async function seedMockDataAction(
  _prev: MockActionResult | undefined,
  _formData: FormData
): Promise<MockActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Debes iniciar sesión' };
    }
    if (!hasPermission(currentUser.role, Permission.MANAGE_USERS)) {
      return { error: 'No autorizado: se requieren permisos de administrador' };
    }

    const existingCount = await countMockProperties();
    if (existingCount > 0) {
      return {
        success: false,
        error: `Ya existen ${existingCount} propiedades demo. Elimínalas primero para recargar.`,
        count: existingCount,
      };
    }

    const { count } = await seedMockProperties(currentUser.id);

    revalidatePath('/admin');
    revalidatePath('/properties');
    revalidatePath('/feed');
    revalidatePath('/search');

    return { success: true, count };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { error: error.message };
    }
    return { error: 'Error al cargar datos demo' };
  }
}

export async function purgeMockDataAction(
  _prev: MockActionResult | undefined,
  _formData: FormData
): Promise<MockActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Debes iniciar sesión' };
    }
    if (!hasPermission(currentUser.role, Permission.MANAGE_USERS)) {
      return { error: 'No autorizado: se requieren permisos de administrador' };
    }

    const { count } = await purgeMockProperties();

    revalidatePath('/admin');
    revalidatePath('/properties');
    revalidatePath('/feed');
    revalidatePath('/search');

    return { success: true, count };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { error: error.message };
    }
    return { error: 'Error al eliminar datos demo' };
  }
}

export async function getMockPropertyCountAction(): Promise<{ count: number }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new UnauthorizedError();
    }
    if (!hasPermission(currentUser.role, Permission.MANAGE_USERS)) {
      throw new UnauthorizedError();
    }

    const count = await countMockProperties();
    return { count };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    return { count: 0 };
  }
}
