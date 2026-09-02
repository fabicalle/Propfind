import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, setCsrfTokenCookie } from '@/lib/security/csrf';

export const GET = async (request: NextRequest) => {
  const token = generateCsrfToken();
  const response = NextResponse.json({ token });
  setCsrfTokenCookie(response, token);
  return response;
};
