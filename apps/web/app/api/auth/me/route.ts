import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '../login/route';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json(null, { status: 401 });

  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return NextResponse.json(null, { status: 401 });
  return NextResponse.json(await res.json());
}
