import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/server';

const schema = z.object({
  callSid: z.string().min(3),
  endedAt: z.string().datetime(),
  fullTranscript: z.string().optional(),
  handoffOccurred: z.boolean().optional(),
  appointmentId: z.string().optional(),
  treatmentAcceptance: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = schema.parse(await req.json());

    // Only finalize a transcript that belongs to the caller's practice.
    const existing = await prisma.callTranscript.findFirst({
      where: { callSid: body.callSid, practiceId: user.practiceId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'transcript_not_found' }, { status: 404 });
    }

    const transcript = await prisma.callTranscript.update({
      where: { id: existing.id },
      data: {
        endedAt: new Date(body.endedAt),
        fullTranscript: body.fullTranscript,
        handoffOccurred: body.handoffOccurred,
        appointmentId: body.appointmentId,
        treatmentAcceptance: body.treatmentAcceptance,
      },
    });

    return NextResponse.json({ ok: true, transcript });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
