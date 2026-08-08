import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/server';
import { Prisma } from '@prisma/client';
import { routeError } from '@/lib/http/route-error';

const schema = z.object({
  callSid: z.string().min(3).max(200),
  orchestrator: z.enum(['vapi', 'retell']),
  speaker: z.enum(['patient', 'ai', 'staff']),
  text: z.string().min(1).max(20_000),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  confidence: z.number().min(0).max(1).optional(),
  meta: z
    .record(z.unknown())
    .refine((value) => JSON.stringify(value).length <= 10_000, 'meta is too large')
    .optional(),
  patientId: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = schema.parse(await req.json());
    if (body.endedAt && new Date(body.endedAt) < new Date(body.startedAt)) {
      return NextResponse.json({ ok: false, error: 'invalid_segment_range' }, { status: 400 });
    }

    if (body.patientId) {
      const patient = await prisma.patient.findFirst({
        where: { id: body.patientId, practiceId: user.practiceId },
        select: { id: true },
      });
      if (!patient) {
        return NextResponse.json({ ok: false, error: 'patient_not_found' }, { status: 404 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Serialize creation by provider call id so concurrent first segments do
      // not race on the globally unique callSid.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${body.callSid}))`;
      const existing = await tx.callTranscript.findUnique({
        where: { callSid: body.callSid },
      });
      if (existing && existing.practiceId !== user.practiceId) return null;

      const transcript =
        existing ??
        (await tx.callTranscript.create({
          data: {
            practiceId: user.practiceId,
            callSid: body.callSid,
            orchestrator: body.orchestrator,
            startedAt: new Date(body.startedAt),
            patientId: body.patientId,
          },
        }));

      const segment = await tx.callTranscriptSegment.create({
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
      return { transcriptId: transcript.id, segmentId: segment.id };
    });

    if (!result) {
      return NextResponse.json({ ok: false, error: 'transcript_not_found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    return routeError(error);
  }
}
