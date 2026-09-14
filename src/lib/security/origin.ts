import { NextRequest, NextResponse } from 'next/server';
import { logOriginBlocked } from '@/lib/security/auditLog';
import { env } from '@/lib/env';

function getCurrentHost(request: NextRequest): string | null {
  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    if (!host) return null;
    const protocol = request.headers.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    return `${protocol}://${host}`;
  } catch {
    return null;
  }
}

function buildAllowedOrigins(request: NextRequest): string[] {
  const origins = new Set<string>();

  const currentHost = getCurrentHost(request);
  if (currentHost) {
    origins.add(currentHost);
  }

  const appUrl = env.appUrl;
  if (appUrl && appUrl !== 'http://localhost:3000') {
    origins.add(appUrl);
  }

  if (env.isDev) {
    origins.add('http://localhost:3000');
    origins.add('http://localhost:3001');
  }

  return Array.from(origins);
}

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (!origin && !referer) {
    return true;
  }

  const allowedOrigins = buildAllowedOrigins(request);
  const checkOrigin = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return allowedOrigins.some((allowed) => {
        try {
          const allowedHostname = new URL(allowed).hostname;
          return hostname === allowedHostname || hostname.endsWith(`.${allowedHostname}`);
        } catch {
          return false;
        }
      });
    } catch {
      return false;
    }
  };

  return checkOrigin(origin || referer || '');
}

export function rejectInvalidOrigin(request: NextRequest): NextResponse | null {
  if (!validateOrigin(request)) {
    logOriginBlocked(request);
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Invalid origin' } },
      { status: 403 }
    );
  }
  return null;
}
