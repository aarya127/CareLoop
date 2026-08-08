import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';
import { listCalendars } from '@/lib/google/calendar';
import { routeError } from '@/lib/http/route-error';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const items = await listCalendars(user.id);
    const mapped = items.map((c) => ({
      id: c.id,
      summary: c.summary,
      timeZone: c.timeZone,
      accessRole: c.accessRole,
    }));
    return NextResponse.json({ ok: true, calendars: mapped });
  } catch (error: unknown) {
    return routeError(error);
  }
}
