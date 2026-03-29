import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Permitir el paso para cron jobs y webhooks sin autenticación local (protegidos por secret o externos)
  if (pathname.startsWith('/api/cron') || pathname.startsWith('/api/monthly-report')) {
    return NextResponse.next();
  }

  // Rutas API del Dashboard
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/login')) {
    const sessionCookie = request.cookies.get('webguard_session');
    if (sessionCookie?.value !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Rutas Frontend Protegidas (Dashboard)
  if (pathname === '/' || pathname.startsWith('/dashboard')) {
    const sessionCookie = request.cookies.get('webguard_session');
    if (sessionCookie?.value !== process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard', '/api/:path*'],
};
