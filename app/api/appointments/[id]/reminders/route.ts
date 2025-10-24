import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest, ctx: { params: { id: string } }) {
  // TODO: schedule SMS/email reminders via messaging service
  return NextResponse.json({ ok: true, id: ctx.params.id });
}
