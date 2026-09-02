import { NextResponse } from 'next/server';
import { generateCsrfToken, setCsrfTokenCookie } from '@/lib/security/csrf';

export async function GET() {
  const token = generateCsrfToken();
  const response = NextResponse.json({ token });
  setCsrfTokenCookie(response, token);
  return response;
}
