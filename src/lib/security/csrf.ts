import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const CSRF_COOKIE_NAME = 'propfind-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function getCsrfTokenFromRequest(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME) || request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

export function validateCsrfToken(request: NextRequest, token: string | null): boolean {
  if (!token) return false;
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  return cookieToken !== undefined && cookieToken === token;
}

export function setCsrfTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600,
    path: '/',
  });
}

export function rejectInvalidCsrf(request: NextRequest, token: string | null): NextResponse | null {
  if (!validateCsrfToken(request, token)) {
    return NextResponse.json(
      { error: { code: 'CSRF_INVALID', message: 'Invalid CSRF token' } },
      { status: 403 }
    );
  }
  return null;
}
