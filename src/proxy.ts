import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionFromRequest } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { hasPermission, Permission, type Role } from '@/lib/permissions';

const protectedRoutes = ['/perfil', '/publicar', '/favoritos'];
const adminRoutes = ['/admin'];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: http: blob:; connect-src 'self' https://api.telegram.org https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org https://ipapi.co; frame-ancestors 'none'; form-action 'self'; base-uri 'self';"
  );
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  const isAdminRoute = adminRoutes.some((route) => path === route || path.startsWith(`${route}/`));

  if (protectedRoutes.some((route) => path === route || path.startsWith(`${route}/`))) {
    try {
      const session = await getServerSessionFromRequest(request);
      if (!session?.user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', path);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isAdminRoute) {
    try {
      const session = await getServerSessionFromRequest(request);
      if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      const role = (user?.role as Role) || 'FINDER';

      if (role !== 'ADMIN' || !hasPermission(role, Permission.DASHBOARD_ACCESS)) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
