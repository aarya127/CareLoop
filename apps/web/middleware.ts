import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'cl_session';

const PUBLIC_PATH_PREFIXES = [
  '/login',
  // Self-serve organization signup (new practice + first admin).
  '/signup',
  // Accept-a-team-invitation flow — invitee has no session yet.
  '/join',
  // Patient-facing intake — no staff session required (mirrors the API's @Public
  // /intake/drafts endpoints). Without this, patients are bounced to /login.
  '/intake',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/meta.json',
];

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
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
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico)$).*)',
  ],
};
