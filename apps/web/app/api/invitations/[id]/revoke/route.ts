import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/cookies';
import { SERVER_API_URL } from '@/lib/config/api-server';

/** POST — revoke a pending invite (admin/manager, tenant-scoped by the API). */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const res = await fetch(`${SERVER_API_URL}/invitations/${encodeURIComponent(id)}/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
