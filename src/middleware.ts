import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow these paths through without auth check
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/vendor-portal') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check for Better-Auth session cookie (prefix = 'vp')
  const sessionCookie =
    request.cookies.get('vp.session_token') ??
    request.cookies.get('__Secure-vp.session_token');

  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
