import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  const error = requestUrl.searchParams.get('error');
  const message = requestUrl.searchParams.get('message');

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, requestUrl.origin));
  }

  if (message) {
    return NextResponse.redirect(new URL(`/login?message=${encodeURIComponent(message)}`, requestUrl.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  const response = NextResponse.redirect(new URL(next, requestUrl.origin));

  const supabase = createServerClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  if (!supabase) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
  }

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
    }

    if (data?.session) {
      return response;
    }
  } catch {
    return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
