import { NextRequest, NextResponse } from 'next/server';
import { createAuthUrl } from '@/lib/google/auth';
import { requireUser } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
  try {
    await requireUser(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { readonly } = await req.json().catch(() => ({ readonly: false }));
  const state = crypto.randomUUID();
  const url = createAuthUrl(state, !!readonly);
  const res = NextResponse.json({ url });
  res.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return res;
}
