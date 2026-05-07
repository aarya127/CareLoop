<<<<<<< HEAD
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const SESSION_COOKIE = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME ?? 'careloop_session';

const PUBLIC_PATH_PREFIXES = ['/login', '/health'];

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
=======
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'cl_session';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/meta.json',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE);
  if (!session?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
>>>>>>> auth
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
<<<<<<< HEAD
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico)$).*)',
  ],
=======
  matcher: ['/((?!_next/static|_next/image|public/).*)'],
>>>>>>> auth
};
