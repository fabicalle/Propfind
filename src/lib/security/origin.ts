import { NextRequest, NextResponse } from 'next/server';
import { logOriginBlocked } from '@/lib/security/auditLog';

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'https://propfind.vercel.app',
].filter(Boolean);

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (!origin && !referer) {
    return true;
  }

  const checkOrigin = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return ALLOWED_ORIGINS.some((allowed) => {
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
