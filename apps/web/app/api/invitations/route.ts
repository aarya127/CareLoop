import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/cookies';

const API_URL = process.env.API_URL ?? 'https://careloop-tf2l.onrender.com';

function authHeaders(req: NextRequest): HeadersInit {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** GET — list pending invites for the caller's practice (admin/manager). */
export async function GET(req: NextRequest) {
  const res = await fetch(`${API_URL}/invitations`, {
    headers: authHeaders(req),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

/** POST — create an invite (admin/manager). */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${API_URL}/invitations`, {
    method: 'POST',
    headers: authHeaders(req),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
