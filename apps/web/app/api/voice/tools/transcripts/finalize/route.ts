import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/server';
import { routeError } from '@/lib/http/route-error';

const schema = z.object({
  callSid: z.string().min(3).max(200),
  endedAt: z.string().datetime(),
  fullTranscript: z.string().max(100_000).optional(),
  handoffOccurred: z.boolean().optional(),
  appointmentId: z.string().max(100).optional(),
  treatmentAcceptance: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = schema.parse(await req.json());

    // Only finalize a transcript that belongs to the caller's practice.
    const existing = await prisma.callTranscript.findFirst({
      where: { callSid: body.callSid, practiceId: user.practiceId },
      select: { id: true, patientId: true, appointmentId: true, startedAt: true, endedAt: true },
    });
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'transcript_not_found' }, { status: 404 });
    }
    const endedAt = new Date(body.endedAt);
    if (endedAt < existing.startedAt) {
      return NextResponse.json({ ok: false, error: 'invalid_transcript_range' }, { status: 400 });
    }
    if (existing.endedAt && existing.endedAt.getTime() !== endedAt.getTime()) {
      return NextResponse.json(
        { ok: false, error: 'transcript_already_finalized' },
        { status: 409 },
      );
    }
    if (
      existing.appointmentId &&
      body.appointmentId &&
      existing.appointmentId !== body.appointmentId
    ) {
      return NextResponse.json(
        { ok: false, error: 'appointment_already_assigned' },
        { status: 409 },
      );
    }

    if (body.appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: body.appointmentId,
          practiceId: user.practiceId,
          ...(existing.patientId ? { patientId: existing.patientId } : {}),
        },
        select: { id: true },
      });
      if (!appointment) {
        return NextResponse.json({ ok: false, error: 'appointment_not_found' }, { status: 404 });
      }
    }

    const transcript = await prisma.callTranscript.update({
      where: { id: existing.id },
      data: {
        endedAt,
        fullTranscript: body.fullTranscript,
        handoffOccurred: body.handoffOccurred,
        appointmentId: body.appointmentId,
        treatmentAcceptance: body.treatmentAcceptance,
      },
    });

    return NextResponse.json({ ok: true, transcript });
  } catch (error: unknown) {
    return routeError(error);
  }
}
