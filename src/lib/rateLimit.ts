import { NextRequest, NextResponse } from 'next/server';
import { logRateLimit } from '@/lib/security/auditLog';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function getRateLimitKey(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'anonymous';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}:${userAgent}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, resetTime: entry.resetTime };
}

export function withRateLimit<A extends unknown[]>(handler: (request: NextRequest, ...args: A) => Promise<NextResponse>) {
  return async (request: NextRequest, ...args: A) => {
    const key = getRateLimitKey(request);
    const result = checkRateLimit(key);

    const response = result.allowed
      ? await handler(request, ...args)
      : NextResponse.json(
          { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.' } },
          { status: 429 }
        );

    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('Retry-After', String(Math.max(0, Math.ceil((result.resetTime - Date.now()) / 1000))));

    if (!result.allowed) {
      logRateLimit(request);
    }

    return response;
  };
}
