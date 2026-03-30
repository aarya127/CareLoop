import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { stopChannel } from '@/lib/google/calendar';
import { z } from 'zod';

const schema = z.object({ calendarId: z.string().default('primary') });

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const conn = await prisma.googleCalendarConnection.findFirst({ where: { calendarId: body.calendarId, provider: 'google' } });
    if (!conn?.resourceId || !conn?.channelId) return NextResponse.json({ ok: true, message: 'no_active_channel' });
    await stopChannel(conn.resourceId, conn.channelId);
    await prisma.googleCalendarConnection.update({ where: { id: conn.id }, data: { resourceId: null, channelId: null, channelExpiry: null } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 });
  }
}
