import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_KEY = 'lf_admin_auth';

const PUBLIC_PATH_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/errors',
];

const PUBLIC_EXACT_PATHS = new Set(['/login']);

const isPublicPath = (pathname: string): boolean => {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const hasAuthCookie = Boolean(request.cookies.get(AUTH_COOKIE_KEY)?.value);

  if (!hasAuthCookie && !isPublicPath(pathname)) {
    const signInUrl = new URL('/sign-in', request.url);
    const nextPath = pathname === '/' ? '/dashboard' : `${pathname}${search}`;
    signInUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(signInUrl);
  }

  if (hasAuthCookie && isPublicPath(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
