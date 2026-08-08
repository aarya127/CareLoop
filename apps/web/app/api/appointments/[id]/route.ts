import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';

export async function PATCH(req: NextRequest) {
  try {
    await requireUser(req);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Authentication unavailable' }, { status: 503 });
  }
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
