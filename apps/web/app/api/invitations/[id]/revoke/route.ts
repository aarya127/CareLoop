import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/cookies';

const API_URL = process.env.API_URL ?? 'https://careloop-tf2l.onrender.com';

/** POST — revoke a pending invite (admin/manager, tenant-scoped by the API). */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const res = await fetch(`${API_URL}/invitations/${encodeURIComponent(id)}/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
