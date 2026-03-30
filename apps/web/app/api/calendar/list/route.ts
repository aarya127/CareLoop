import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';
import { listCalendars } from '@/lib/google/calendar';

export async function GET(req: NextRequest) {
  try {
    const user = requireUser(req);
    const items = await listCalendars(user.id);
    const mapped = items.map((c) => ({
      id: c.id,
      summary: c.summary,
      timeZone: c.timeZone,
      accessRole: (c as any).accessRole,
    }));
    return NextResponse.json({ ok: true, calendars: mapped });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 });
  }
}
