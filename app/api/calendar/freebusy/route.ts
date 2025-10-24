import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';
import { freebusy } from '@/lib/google/calendar';
import { z } from 'zod';

const schema = z.object({
  timeMin: z.string(),
  timeMax: z.string(),
  items: z.array(z.object({ id: z.string() })),
  timeZone: z.string().default('America/Toronto'),
});

export async function POST(req: NextRequest) {
  try {
    const user = requireUser(req);
    const body = schema.parse(await req.json());
    const data = await freebusy(user.id, body.timeMin, body.timeMax, body.items, body.timeZone);
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 });
  }
}
