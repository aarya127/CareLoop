import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';
import { watchCalendar } from '@/lib/google/calendar';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const schema = z.object({ calendarId: z.string().default('primary') });

export async function POST(req: NextRequest) {
  try {
    const user = requireUser(req);
    const body = schema.parse(await req.json());
    const channelId = crypto.randomUUID();
    const webhookUrl = `${process.env.APP_BASE_URL}/api/calendar/webhook`;
    const data = await watchCalendar(user.id, body.calendarId, channelId, webhookUrl);
    await prisma.googleCalendarConnection.updateMany({
      where: { userId: user.id, provider: 'google', calendarId: body.calendarId },
      data: { channelId, resourceId: data.resourceId || undefined, channelExpiry: data.expiration ? new Date(Number(data.expiration)) : null },
    });
    return NextResponse.json({ ok: true, channelId, resourceId: data.resourceId, expiration: data.expiration });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 });
  }
}
