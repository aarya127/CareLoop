import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  // TODO: update appointment locally and patch Google event
  return NextResponse.json({ ok: true, id });
}
