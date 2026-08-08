import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';
import { routeError } from '@/lib/http/route-error';

export async function POST(req: NextRequest) {
  try {
    await requireUser(req);
    return NextResponse.json(
      { ok: false, error: 'outbound_voice_provider_not_configured' },
      { status: 501 },
    );
  } catch (error: unknown) {
    return routeError(error);
  }
}
