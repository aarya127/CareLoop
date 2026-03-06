import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  // TODO: append immutable note with author + timestamp
  return NextResponse.json({ ok: true, id });
}
