import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '../login/route';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (token) {
    // Tell the API to revoke the session
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {}); // best-effort
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
