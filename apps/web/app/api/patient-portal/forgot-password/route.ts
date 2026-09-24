import { NextRequest, NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/config/api-server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    await fetch(`${getServerApiUrl()}/patient-auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[patient-portal/forgot-password] fetch to API failed:', err);
    // Still return the generic ok response — never let a network error on our
    // side turn into an enumeration signal.
  }

  return NextResponse.json({ ok: true });
}
