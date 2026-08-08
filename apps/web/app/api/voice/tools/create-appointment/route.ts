import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/server';
import { SESSION_COOKIE } from '@/lib/auth/cookies';
import { getServerApiUrl } from '@/lib/config/api-server';
import { routeError } from '@/lib/http/route-error';

const schema = z.object({
  patientId: z.string().max(100).optional(),
  providerId: z.string().min(1).max(100),
  title: z.string().trim().min(3).max(200),
  notes: z.string().max(5000).optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  timeZone: z.string().max(100).optional(),
  roomId: z.string().max(100).optional(),
  procedureCode: z.string().max(100).optional(),
  callSid: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = schema.parse(await req.json());
    const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionToken) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const idempotencyKey = body.callSid
      ? `voice:${body.callSid}:${body.providerId}:${body.start}`
      : undefined;
    const response = await fetch(`${getServerApiUrl()}/appointments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${sessionToken}`,
        ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
      },
      body: JSON.stringify({
        userId: user.id,
        patientId: body.patientId,
        providerId: body.providerId,
        title: body.title,
        notes: body.notes,
        start: body.start,
        end: body.end,
        timeZone: body.timeZone,
        roomId: body.roomId,
        procedureCode: body.procedureCode,
        source: 'ai_voice',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const result = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: result.message ?? result.error ?? 'appointment_create_failed' },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true, appointment: result }, { status: 201 });
  } catch (error: unknown) {
    return routeError(error);
  }
}
