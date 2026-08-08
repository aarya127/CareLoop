import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/cookies';
import { getServerApiUrl } from '@/lib/config/api-server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json(null, { status: 401 });

  const res = await fetch(`${getServerApiUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return NextResponse.json(null, { status: 401 });
  return NextResponse.json(await res.json());
}
