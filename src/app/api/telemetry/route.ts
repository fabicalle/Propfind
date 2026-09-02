import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { computeDailySessionHash } from '@/lib/telemetry/sessionHash';
import { initTelemetryLogger, getTelemetryLogger, type TelemetryEvent } from '@/lib/telemetry/asyncLogger';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { withRateLimit } from '@/lib/rateLimit';
import { withCsrf } from '@/lib/security/withCsrf';
import { rejectInvalidOrigin } from '@/lib/security/origin';

const ACCEPTED_TYPES = new Set([
  'ZONE_VIEWED',
  'CARD_SWIPED',
  'FILTER_CHANGED',
  'SEARCH_PERFORMED',
  'MAP_INTERACTION',
  'CARD_VIEW',
]);

const TelemetryEventSchema = z.object({
  type: z.string(),
  payload: z.record(z.unknown()).optional(),
});

const TelemetryBatchSchema = z.object({
  events: z.array(TelemetryEventSchema).min(1, 'events array cannot be empty'),
});

async function handleBatch(events: TelemetryEvent[]): Promise<void> {
  for (const event of events) {
    try {
      switch (event.type) {
        case 'SEARCH_PERFORMED': {
          await prisma.searchTelemetry.create({
            data: {
              sessionId: event.hashedSessionId,
              userId: event.userId ?? null,
              filtersApplied: (event.payload.filtersApplied || {}) as Prisma.InputJsonValue,
              resultsCount: Number(event.payload.resultsCount || 0),
              searchDurationMs: event.payload.searchDurationMs ? Number(event.payload.searchDurationMs) : null,
              zoomLevel: event.payload.zoomLevel ? Number(event.payload.zoomLevel) : null,
            },
          });
          break;
        }

        case 'MAP_INTERACTION': {
          await prisma.searchTelemetry.create({
            data: {
              sessionId: event.hashedSessionId,
              userId: event.userId ?? null,
              filtersApplied: {},
              resultsCount: 0,
              zoomLevel: event.payload.zoomLevel ? Number(event.payload.zoomLevel) : null,
            },
          });
          break;
        }

        case 'CARD_VIEW': {
          await prisma.userInteraction.create({
            data: {
              propertyId: event.payload.propertyId as string,
              interactionType: 'VIEW_DETAIL',
              sessionId: event.hashedSessionId,
              userId: event.userId ?? null,
              metadata: (event.payload || {}) as Prisma.InputJsonValue,
            },
          });
          break;
        }

        default:
          break;
      }
    } catch {
      // Never throw from telemetry logger
    }
  }
}

async function POST_impl(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const body = await request.json();
    const validated = TelemetryBatchSchema.parse(body);

    const sessionId = request.headers.get('x-session-id') || `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const session = await getSessionFromRequest(request);
    const userId = session?.user?.id;
    const hashedSessionId = computeDailySessionHash({ sessionId, userId });

    const logger = getTelemetryLogger() || initTelemetryLogger(handleBatch);
    if (!logger) {
      return errorResponse('INTERNAL_ERROR', 'Telemetry logger unavailable');
    }

    let accepted = 0;
    let rejected = 0;

    for (const event of validated.events) {
      if (!ACCEPTED_TYPES.has(event.type)) {
        rejected++;
        continue;
      }

      logger.enqueue({
        type: event.type as TelemetryEvent['type'],
        sessionId,
        hashedSessionId,
        timestamp: new Date().toISOString(),
        payload: event.payload || {},
        userId: userId ?? null,
      });

      accepted++;
    }

    return successResponse({ accepted, rejected, hashedSessionId }, 202);
   } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input', 400);
      }
      return errorResponse('INTERNAL_ERROR', 'Failed to process telemetry');
    }
}

export const POST = withRateLimit(withCsrf(POST_impl));
