import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, upsertConnectionForUser } from '@/lib/google/auth';
import { getUser } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    // Bind the calendar connection to the authenticated session user — never a
    // client-supplied x-user-id header (which could bind it to any account).
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const expected = req.cookies.get('oauth_state')?.value;
    if (!code || !state || !expected || state !== expected) {
      return NextResponse.json({ ok: false, error: 'invalid_state' }, { status: 400 });
    }
    const tokens = await exchangeCode({ code });
    // For now, bind to primary calendar; UI can later select another calendar
    await upsertConnectionForUser({ userId: user.id, calendarId: 'primary', tokens });

    const redirect = process.env.APP_BASE_URL || 'http://localhost:3000';
    const res = NextResponse.redirect(redirect + '/admin/calendar?connected=1');
    res.cookies.delete('oauth_state');
    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'oauth_failed' }, { status: 500 });
  }
}
