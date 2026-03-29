import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/api/cron') || pathname.startsWith('/api/monthly-report')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api') && !pathname.startsWith('/api/login')) {
    const sessionCookie = request.cookies.get('webguard_session');
    if (sessionCookie?.value !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

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
