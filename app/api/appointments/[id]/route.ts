import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(_req: NextRequest, ctx: { params: { id: string } }) {
  // TODO: update appointment locally and patch Google event
  return NextResponse.json({ ok: true, id: ctx.params.id });
}
