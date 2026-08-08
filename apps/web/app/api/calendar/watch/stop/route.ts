import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { stopChannel } from '@/lib/google/calendar';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/server';
import { routeError } from '@/lib/http/route-error';

const schema = z.object({ calendarId: z.string().min(1).max(1024).default('primary') });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = schema.parse(await req.json());
    const conn = await prisma.googleCalendarConnection.findFirst({
      where: { userId: user.id, calendarId: body.calendarId, provider: 'google' },
    });
    if (!conn?.resourceId || !conn?.channelId)
      return NextResponse.json({ ok: true, message: 'no_active_channel' });
    await stopChannel(user.id, body.calendarId, conn.resourceId, conn.channelId);
    await prisma.googleCalendarConnection.update({
      where: { id: conn.id },
      data: { resourceId: null, channelId: null, channelExpiry: null },
    });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return routeError(error);
  }
}
