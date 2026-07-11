import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';

const API_URL = process.env.API_URL ?? 'https://careloop-tf2l.onrender.com';
const SESSION_COOKIE = 'cl_session';

// Search runs on the NestJS API on Render (which has persistent storage).
// Running it as a Next.js serverless function would exceed the 250 MB size limit.
// The upstream /search endpoint scopes results to the caller's practice, so the
// session token must be forwarded — never proxy this anonymously.
export async function GET(req: NextRequest) {
  try {
    await requireUser(req);
  } catch (unauthorized) {
    if (unauthorized instanceof Response) return unauthorized;
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value ?? '';
    const params = new URLSearchParams();
    const q = req.nextUrl.searchParams.get('q') ?? '';
    const type = req.nextUrl.searchParams.get('type');
    params.set('q', q);
    if (type) params.set('type', type);

    const upstream = await fetch(`${API_URL}/search?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
