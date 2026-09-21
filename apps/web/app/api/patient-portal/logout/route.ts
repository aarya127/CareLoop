import { NextRequest, NextResponse } from 'next/server';
import { PATIENT_SESSION_COOKIE } from '@/lib/patient-auth/cookies';
import { getServerApiUrl } from '@/lib/config/api-server';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(PATIENT_SESSION_COOKIE)?.value;

  if (token) {
    await fetch(`${getServerApiUrl()}/patient-auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {}); // best-effort
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(PATIENT_SESSION_COOKIE);
  return response;
}
