import { NextRequest, NextResponse } from 'next/server';
import { SERVER_API_URL } from '@/lib/config/api-server';

/**
 * BFF proxy for self-serve signup. Forwards to the NestJS API's /auth/signup,
 * then sets the httpOnly session cookie server-side (same as the login route).
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  let res: Response;
  try {
    res = await fetch(`${SERVER_API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[auth/signup] fetch to API failed:', SERVER_API_URL, err);
    return NextResponse.json({ error: 'API unreachable', detail: String(err) }, { status: 502 });
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    const text = await res.text().catch(() => '');
    console.error('[auth/signup] API returned non-JSON:', res.status, text);
    return NextResponse.json(
      { error: 'Invalid API response', detail: text.slice(0, 200) },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: (data as Record<string, unknown>)?.message ?? 'Signup failed' },
      { status: res.status },
    );
  }

  const d = data as Record<string, unknown>;
  const response = NextResponse.json({ user: d.user });
  const sessionCookie = res.headers.get('set-cookie');
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Invalid API response' }, { status: 502 });
  }
  response.headers.append('set-cookie', sessionCookie);
  return response;
}
