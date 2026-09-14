import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getDemandHeatmap, getZonePriceElasticity, getAvgRequestedM2ByZone } from '@/lib/telemetry/aggregations';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { logAuthFailure } from '@/lib/security/auditLog';

const AnalyticsQuerySchema = z.object({
  timeBucket: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
  metric: z.enum(['demand_heatmap', 'price_elasticity', 'avg_requested_m2'], { required_error: 'metric is required' }),
  zoneGeoHash: z.string().optional(),
  neighborhood: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export async function GET(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      logAuthFailure(request, 'missing_session');
      return errorResponse('UNAUTHORIZED', 'No autorizado', 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const validated = AnalyticsQuerySchema.parse(Object.fromEntries(searchParams));

    const timeBucket = validated.timeBucket || 'daily';
    const limit = validated.limit ?? 50;

    switch (validated.metric) {
      case 'demand_heatmap': {
        const data = await getDemandHeatmap({ timeBucket, limit });
        return successResponse({ data, meta: { metric: validated.metric, timeBucket, count: data.length } });
      }

      case 'price_elasticity': {
        const data = await getZonePriceElasticity({
          timeBucket,
          zoneGeoHash: validated.zoneGeoHash,
          neighborhood: validated.neighborhood,
          limit,
        });
        return successResponse({ data, meta: { metric: validated.metric, timeBucket, count: data.length } });
      }

      case 'avg_requested_m2': {
        const data = await getAvgRequestedM2ByZone({
          timeBucket,
          limit,
        });
        return successResponse({ data, meta: { metric: validated.metric, timeBucket, count: data.length } });
      }

      default:
        return errorResponse('VALIDATION_ERROR', `Unsupported metric: ${validated.metric}`, 400);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input', 400);
    }
    return errorResponse('INTERNAL_ERROR', 'Failed to compute analytics');
  }
}
