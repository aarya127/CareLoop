import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, upsertConnectionForUser } from '@/lib/google/auth';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const expected = req.cookies.get('oauth_state')?.value;
    if (!code || !state || !expected || state !== expected) {
      return NextResponse.json({ ok: false, error: 'invalid_state' }, { status: 400 });
    }
    const tokens = await exchangeCode({ code });
    // For now, bind to primary calendar; UI can later select another calendar
    const userId = req.headers.get('x-user-id') || process.env.DEMO_USER_ID || 'demo-user';
    await upsertConnectionForUser({ userId, calendarId: 'primary', tokens });

    const redirect = process.env.APP_BASE_URL || 'http://localhost:3000';
    const res = NextResponse.redirect(redirect + '/admin/calendar?connected=1');
    res.cookies.delete('oauth_state');
    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'oauth_failed' }, { status: 500 });
  }
}
