export interface TelemetryEvent {
  type: 'ZONE_VIEWED' | 'CARD_SWIPED' | 'FILTER_CHANGED' | 'SEARCH_PERFORMED' | 'MAP_INTERACTION' | 'CARD_VIEW';
  sessionId: string;
  hashedSessionId: string;
  timestamp: string;
  payload: Record<string, unknown>;
  userId: string | null;
}

type EventHandler = (events: TelemetryEvent[]) => Promise<void>;

class AsyncTelemetryLogger {
  private queue: TelemetryEvent[] = [];
  private processing = false;
  private handler: EventHandler | null = null;
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private maxBatchSize = 50;
  private flushDelayMs = 1000;

  constructor(handler: EventHandler) {
    this.handler = handler;
    this.flushInterval = setInterval(() => this.flush(), this.flushDelayMs);
  }

  enqueue(event: TelemetryEvent) {
    this.queue.push(event);
    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.processing || this.queue.length === 0 || !this.handler) {
      return;
    }

    this.processing = true;
    const batch = this.queue.splice(0, this.maxBatchSize);

    try {
      await this.handler(batch);
    } catch {
      // Silent fail for telemetry - never block user experience
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.flush());
      }
    }
  }

  drain() {
    return this.queue.length;
  }

  shutdown() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    return this.flush();
  }
}

let logger: AsyncTelemetryLogger | null = null;

export function getTelemetryLogger(): AsyncTelemetryLogger | null {
  return logger;
}

export function initTelemetryLogger(handler: EventHandler) {
  if (typeof window === 'undefined') {
    logger = new AsyncTelemetryLogger(handler);
  }
  return logger;
}

export async function shutdownTelemetryLogger() {
  if (logger) {
    const remaining = logger.drain();
    logger.shutdown();
    logger = null;
    return remaining;
  }
  return 0;
}
