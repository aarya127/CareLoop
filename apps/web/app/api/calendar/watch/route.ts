import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';
import { routeError } from '@/lib/http/route-error';

export async function POST(req: NextRequest) {
  try {
    await requireUser(req);
    return NextResponse.json(
      { ok: false, error: 'calendar_incremental_sync_not_implemented' },
      { status: 501 },
    );
  } catch (error: unknown) {
    return routeError(error);
  }
}
