import { NextRequest, NextResponse } from 'next/server';
import { validateCsrfToken, getCsrfTokenFromRequest } from './csrf';
import { logCsrfFailure } from './auditLog';

export function withCsrf<A extends unknown[]>(handler: (request: NextRequest, ...args: A) => Promise<NextResponse>) {
  return async (request: NextRequest, ...args: A) => {
    const token = getCsrfTokenFromRequest(request);
    if (!validateCsrfToken(request, token)) {
      logCsrfFailure(request);
      return NextResponse.json(
        { error: { code: 'CSRF_INVALID', message: 'Invalid CSRF token' } },
        { status: 403 }
      );
    }
    return handler(request, ...args);
  };
}
