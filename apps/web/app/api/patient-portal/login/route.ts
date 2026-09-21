import { NextRequest, NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/config/api-server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  let res: Response;
  try {
    res = await fetch(`${getServerApiUrl()}/patient-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[patient-portal/login] fetch to API failed:', err);
    return NextResponse.json({ error: 'API unreachable', detail: String(err) }, { status: 502 });
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    const text = await res.text().catch(() => '');
    console.error('[patient-portal/login] API returned non-JSON:', res.status, text);
    return NextResponse.json(
      { error: 'Invalid API response', detail: text.slice(0, 200) },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: (data as Record<string, unknown>)?.message ?? 'Invalid credentials' },
      { status: res.status },
    );
  }

  const d = data as Record<string, unknown>;
  const response = NextResponse.json({ patient: d.patient });
  const sessionCookie = res.headers.get('set-cookie');
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Invalid API response' }, { status: 502 });
  }
  response.headers.append('set-cookie', sessionCookie);
  return response;
}
