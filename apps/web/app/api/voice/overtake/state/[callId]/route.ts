import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';
import { getOrCreateControlSession } from '@/lib/services/manual-overtake';

export async function GET(req: NextRequest, ctx: { params: Promise<{ callId: string }> }) {
  try {
    const user = await requireUser(req);
    const params = await ctx.params;
    const state = getOrCreateControlSession(user.practiceId, params.callId);
    return NextResponse.json({ ok: true, state });
  } catch (error: unknown) {
    if (error instanceof Response) return error;
    return NextResponse.json({ ok: false, error: 'failed' }, { status: 500 });
  }
}
