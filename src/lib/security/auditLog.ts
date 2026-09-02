import { NextRequest } from 'next/server';
import fs from 'fs';

interface SecurityEvent {
  timestamp: string;
  type: 'rate_limit' | 'csrf_failure' | 'origin_blocked' | 'auth_failure' | 'suspicious_input';
  ip: string;
  userAgent: string;
  path: string;
  userId?: string;
  details?: Record<string, unknown>;
}

const SECURITY_LOG_FILE = process.env.SECURITY_LOG_PATH || 'security-events.json';

function logSecurityEvent(event: SecurityEvent): void {
  const logLine = JSON.stringify({ ...event, timestamp: new Date().toISOString() }) + '\n';

  try {
    fs.appendFileSync(SECURITY_LOG_FILE, logLine);
  } catch {
    console.error('[SECURITY] Failed to write log:', event);
  }
}

export function logRateLimit(request: NextRequest): void {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  logSecurityEvent({
    type: 'rate_limit',
    timestamp: new Date().toISOString(),
    ip,
    userAgent: request.headers.get('user-agent') || 'unknown',
    path: request.nextUrl.pathname,
  });
}

export function logCsrfFailure(request: NextRequest): void {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  logSecurityEvent({
    type: 'csrf_failure',
    timestamp: new Date().toISOString(),
    ip,
    userAgent: request.headers.get('user-agent') || 'unknown',
    path: request.nextUrl.pathname,
    details: {
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
    },
  });
}

export function logOriginBlocked(request: NextRequest): void {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  logSecurityEvent({
    type: 'origin_blocked',
    timestamp: new Date().toISOString(),
    ip,
    userAgent: request.headers.get('user-agent') || 'unknown',
    path: request.nextUrl.pathname,
    details: {
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
    },
  });
}

export function logAuthFailure(request: NextRequest, reason: string): void {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  logSecurityEvent({
    type: 'auth_failure',
    timestamp: new Date().toISOString(),
    ip,
    userAgent: request.headers.get('user-agent') || 'unknown',
    path: request.nextUrl.pathname,
    details: { reason },
  });
}

export function logSuspiciousInput(request: NextRequest, field: string, value: unknown): void {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  logSecurityEvent({
    type: 'suspicious_input',
    timestamp: new Date().toISOString(),
    ip,
    userAgent: request.headers.get('user-agent') || 'unknown',
    path: request.nextUrl.pathname,
    details: { field, value: String(value).slice(0, 100) },
  });
}
