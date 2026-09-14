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
    if (!hasPermission(currentUser.role, Permission.MODERATE_REPORTS)) {
      return errorResponse('FORBIDDEN', 'No autorizado', 403);
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const isActiveFilter = includeInactive ? {} : { isActive: true };

    const propertyReports = await prisma.propertyReport.groupBy({
      by: ['propertyId', 'reason', 'details', 'createdAt'],
      _count: { propertyId: true },
      where: {
        property: isActiveFilter,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const propertyIds = Array.from(new Set(propertyReports.map((r) => r.propertyId)));

    const properties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: {
        id: true,
        title: true,
        isActive: true,
      },
    });

    const propertyMap = new Map(properties.map((p) => [p.id, p]));

    const reportCountMap = new Map<string, number>();
    for (const r of propertyReports) {
      reportCountMap.set(r.propertyId, (reportCountMap.get(r.propertyId) || 0) + Number(r._count.propertyId));
    }

    const reportList = propertyReports
      .map((r) => {
        const property = propertyMap.get(r.propertyId);
        if (!property) return null;
        return {
          id: property.id,
          title: property.title,
          isActive: property.isActive,
          reportCount: reportCountMap.get(r.propertyId) || 0,
          latestReport: {
            reason: r.reason,
            details: r.details,
            createdAt: r.createdAt,
          },
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      title: string;
      isActive: boolean;
      reportCount: number;
      latestReport: { reason: string; details: string | null; createdAt: Date };
    }>;

    return successResponse(reportList);
  } catch (error) {
    console.error('Admin reports error:', error);
    return errorResponse('INTERNAL_ERROR', 'Error interno');
  }
}

export async function GET(request: NextRequest) {
  return GET_impl(request);
}
