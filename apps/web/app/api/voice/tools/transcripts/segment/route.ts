import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/server';
import { Prisma } from '@prisma/client';

const schema = z.object({
  callSid: z.string().min(3),
  orchestrator: z.enum(['vapi', 'retell']),
  speaker: z.enum(['patient', 'ai', 'staff']),
  text: z.string().min(1),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  confidence: z.number().min(0).max(1).optional(),
  meta: z.record(z.unknown()).optional(),
  patientId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = schema.parse(await req.json());

    if (body.patientId) {
      const patient = await prisma.patient.findFirst({
        where: { id: body.patientId, practiceId: user.practiceId },
        select: { id: true },
      });
      if (!patient) {
        return NextResponse.json({ ok: false, error: 'patient_not_found' }, { status: 404 });
      }
    }

    const existing = await prisma.callTranscript.findUnique({
      where: { callSid: body.callSid },
    });
    if (existing && existing.practiceId !== user.practiceId) {
      return NextResponse.json({ ok: false, error: 'transcript_not_found' }, { status: 404 });
    }

    const transcript =
      existing ??
      (await prisma.callTranscript.create({
        data: {
          practiceId: user.practiceId,
          callSid: body.callSid,
          orchestrator: body.orchestrator,
          startedAt: new Date(body.startedAt),
          patientId: body.patientId,
        },
      }));

    const segment = await prisma.callTranscriptSegment.create({
      data: {
        transcriptId: transcript.id,
        speaker: body.speaker,
        text: body.text,
        startedAt: new Date(body.startedAt),
        endedAt: body.endedAt ? new Date(body.endedAt) : undefined,
        confidence: body.confidence,
        meta: body.meta as Prisma.InputJsonValue | undefined,
      },
    });

    return NextResponse.json({ ok: true, transcriptId: transcript.id, segmentId: segment.id });
  } catch (error: unknown) {
    if (error instanceof Response) return error;
    return NextResponse.json({ ok: false, error: 'failed' }, { status: 500 });
  }
}
