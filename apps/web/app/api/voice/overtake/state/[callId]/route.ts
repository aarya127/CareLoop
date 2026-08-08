import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';
import { routeError } from '@/lib/http/route-error';

export async function GET(req: NextRequest, ctx: { params: Promise<{ callId: string }> }) {
  try {
    await requireUser(req);
    await ctx.params;
    return NextResponse.json(
      { ok: false, error: 'provider_call_control_not_configured' },
      { status: 501 },
    );
  } catch (error: unknown) {
    return routeError(error);
  }
}
