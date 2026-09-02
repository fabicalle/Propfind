import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/supabase/session';
import { rejectInvalidOrigin } from '@/lib/security/origin';

export async function GET(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  const session = await getSessionFromRequest(request);
  return NextResponse.json({
    userId: session?.user?.id || null,
    email: session?.user?.email || null,
  });
}
