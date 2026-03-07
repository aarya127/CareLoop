import { NextRequest, NextResponse } from 'next/server';
import { createAuthUrl } from '@/lib/google/auth';

export async function POST(req: NextRequest) {
  const { readonly } = await req.json().catch(() => ({ readonly: false }));
  const state = crypto.randomUUID();
  const url = createAuthUrl(state, !!readonly);
  const res = NextResponse.json({ url });
  res.cookies.set('oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 });
  return res;
}
