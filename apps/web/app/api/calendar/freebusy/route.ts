import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';
import { freebusy } from '@/lib/google/calendar';
import { z } from 'zod';
import { routeError } from '@/lib/http/route-error';

const schema = z.object({
  timeMin: z.string().datetime(),
  timeMax: z.string().datetime(),
  items: z
    .array(z.object({ id: z.string().min(1).max(1024) }))
    .min(1)
    .max(50),
  timeZone: z.string().max(100).default('America/Toronto'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = schema.parse(await req.json());
    const timeMin = new Date(body.timeMin);
    const timeMax = new Date(body.timeMax);
    if (timeMax <= timeMin || timeMax.getTime() - timeMin.getTime() > 366 * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ ok: false, error: 'invalid_calendar_range' }, { status: 400 });
    }
    const items = body.items.filter((item) => Boolean(item.id)) as Array<{ id: string }>;
    const data = await freebusy(user.id, body.timeMin, body.timeMax, items, body.timeZone);
    return NextResponse.json({ ok: true, data });
  } catch (error: unknown) {
    return routeError(error);
  }
}
