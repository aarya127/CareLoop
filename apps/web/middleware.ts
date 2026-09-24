import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'cl_session';
const PATIENT_SESSION_COOKIE = 'cl_patient_session';

const PUBLIC_PATH_PREFIXES = [
  '/login',
  // Self-serve organization signup (new practice + first admin).
  '/signup',
  // Accept-a-team-invitation flow — invitee has no session yet.
  '/join',
  // Forgot/reset password — no session yet by definition.
  '/forgot-password',
  '/reset-password',
  // Patient-facing intake — no staff session required (mirrors the API's @Public
  // /intake/drafts endpoints). Without this, patients are bounced to /login.
  '/intake',
  // Patient portal sign-in, accept-invite, and forgot/reset-password flows —
  // separate principal, separate cookie (see the /portal branch below); these
  // paths need no session at all.
  '/portal/login',
  '/portal/join',
  '/portal/forgot-password',
  '/portal/reset-password',
  '/api/auth',
  '/api/patient-portal',
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

  // Patient portal pages are gated by the patient session cookie, never the
  // staff one — a patient must never be redirected into (or satisfy) the staff
  // login, and vice versa.
  if (pathname.startsWith('/portal')) {
    const patientSessionCookie = req.cookies.get(PATIENT_SESSION_COOKIE)?.value;
    if (!patientSessionCookie) {
      const loginUrl = new URL('/portal/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
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
