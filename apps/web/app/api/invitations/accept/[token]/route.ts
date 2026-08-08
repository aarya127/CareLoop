import { NextRequest, NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/config/api-server';

/** GET — preview an invite (public). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const res = await fetch(`${getServerApiUrl()}/invitations/accept/${encodeURIComponent(token)}`, {
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

/** POST — accept an invite (public); sets the session cookie on success. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const body = await req.json();

  let res: Response;
  try {
    res = await fetch(`${getServerApiUrl()}/invitations/accept/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return NextResponse.json({ error: 'API unreachable', detail: String(err) }, { status: 502 });
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.message ?? 'Could not accept invitation' },
      { status: res.status },
    );
  }

  const response = NextResponse.json({ user: data.user });
  const sessionCookie = res.headers.get('set-cookie');
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Invalid API response' }, { status: 502 });
  }
  response.headers.append('set-cookie', sessionCookie);
  return response;
}
