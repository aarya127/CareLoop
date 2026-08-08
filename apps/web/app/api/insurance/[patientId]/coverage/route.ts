import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/cookies';
import { getServerApiUrl } from '@/lib/config/api-server';

/** GET — structured coverage + remaining benefit for a patient's active plan. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await ctx.params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const res = await fetch(
    `${getServerApiUrl()}/insurance/${encodeURIComponent(patientId)}/coverage`,
    {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: 'no-store',
    },
  );
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
