import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireVoiceWebhookRequest } from '@/lib/services/voice-webhook-auth';
import { routeError } from '@/lib/http/route-error';

const webhookSchema = z.object({
  event: z.enum(['call.completed', 'call.segment']),
  callSid: z.string().min(3).max(200),
  payload: z.record(z.unknown()).default({}),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const rejected = requireVoiceWebhookRequest(req, rawBody);
    if (rejected) return rejected;
    const body = webhookSchema.parse(JSON.parse(rawBody));

    if (body.event !== 'call.completed') {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const transcript = await prisma.callTranscript.findUnique({ where: { callSid: body.callSid } });
    if (!transcript) {
      return NextResponse.json({ ok: false, error: 'transcript_not_found' }, { status: 404 });
    }

    // KPI extraction has no production implementation yet. Acknowledge the
    // signed event without persisting fabricated zero/false measurements.
    return NextResponse.json(
      { ok: true, transcriptId: transcript.id, analyticsStatus: 'not_configured' },
      { status: 202 },
    );
  } catch (error: unknown) {
    return routeError(error);
  }
}
