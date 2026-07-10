import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/cookies';

const API_URL = process.env.API_URL ?? 'https://careloop-tf2l.onrender.com';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 8 * 60 * 60, // 8 hours
};

/**
 * BFF proxy for self-serve signup. Forwards to the NestJS API's /auth/signup,
 * then sets the httpOnly session cookie server-side (same as the login route).
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[auth/signup] fetch to API failed:', API_URL, err);
    return NextResponse.json({ error: 'API unreachable', detail: String(err) }, { status: 502 });
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    const text = await res.text().catch(() => '');
    console.error('[auth/signup] API returned non-JSON:', res.status, text);
    return NextResponse.json({ error: 'Invalid API response', detail: text.slice(0, 200) }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: (data as Record<string, unknown>)?.message ?? 'Signup failed' },
      { status: res.status },
    );
  }

  const d = data as Record<string, unknown>;
  const response = NextResponse.json({ user: d.user });
  response.cookies.set(SESSION_COOKIE, (d.sessionToken as string) ?? '', COOKIE_OPTS);
  return response;
}
