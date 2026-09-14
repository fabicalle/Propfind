import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getCurrentUser, hasPermission, Permission } from '@/lib/permissions';

async function GET_impl(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'No autorizado', 401);
    }
    if (!hasPermission(currentUser.role, Permission.MANAGE_USERS)) {
      return errorResponse('FORBIDDEN', 'No autorizado', 403);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { id: { equals: search } },
            ],
          }
        : undefined,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return successResponse(
      users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role || 'FINDER',
        createdAt: user.createdAt,
      }))
    );
  } catch (error) {
    console.error('Admin users error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error interno');
  }
}

export async function GET(request: NextRequest) {
  return GET_impl(request);
}
