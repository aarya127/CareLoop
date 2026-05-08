import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';
export const SESSION_COOKIE = 'cl_session';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 8 * 60 * 60, // 8 hours
};

export async function POST(request: NextRequest) {
  const body = await request.json();

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.message ?? 'Invalid credentials' },
      { status: res.status }
    );
  }

  // The NestJS API returns { user, sessionToken } — we set the cookie server-side
  const response = NextResponse.json({ user: data.user });
  response.cookies.set(SESSION_COOKIE, data.sessionToken ?? '', COOKIE_OPTS);
  return response;
}
