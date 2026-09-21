import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/cookies';
import { getServerApiUrl } from '@/lib/config/api-server';

function authHeaders(req: NextRequest): HeadersInit {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** POST — staff invites a patient (in their own practice) to the patient portal. */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${getServerApiUrl()}/patient-auth/invitations`, {
    method: 'POST',
    headers: authHeaders(req),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
