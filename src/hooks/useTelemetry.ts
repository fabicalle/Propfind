'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import { useTelemetryStore } from '@/store/useTelemetryStore';

export function useTelemetry() {
  const { userSession, analyticsConsent } = useSessionStore();
  const { trackEvent, flushTelemetry } = useTelemetryStore();
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const track = useCallback(
    (type: string, payload: Record<string, unknown>) => {
      if (!analyticsConsent) return;
      trackEvent({ type, payload });
    },
    [analyticsConsent, trackEvent]
  );

  const flush = useCallback(async () => {
    const events = flushTelemetry();
    if (events.length === 0) return;

    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': userSession.sessionId,
        },
        body: JSON.stringify({ events }),
      });
    } catch {
      // Silent fail for telemetry
    }
  }, [flushTelemetry, userSession.sessionId]);

  useEffect(() => {
    if (!analyticsConsent) return;

    flushTimerRef.current = setInterval(() => {
      flush();
    }, 5000);

    return () => {
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, [analyticsConsent, flush]);

  return {
    track,
    flush,
  };
}
