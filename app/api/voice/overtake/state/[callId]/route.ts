import { NextRequest, NextResponse } from "next/server";
import { getOrCreateControlSession } from "@/lib/services/manual-overtake";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ callId: string }> }) {
  const params = await ctx.params;
  const state = getOrCreateControlSession(params.callId);
  return NextResponse.json({ ok: true, state });
}
