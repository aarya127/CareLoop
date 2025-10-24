import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest, ctx: { params: { id: string } }) {
  // TODO: append immutable note with author + timestamp
  return NextResponse.json({ ok: true, id: ctx.params.id });
}
