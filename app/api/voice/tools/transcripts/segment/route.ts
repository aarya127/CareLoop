import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/server";
import { Prisma } from "@prisma/client";

const schema = z.object({
  callSid: z.string().min(3),
  orchestrator: z.enum(["vapi", "retell"]),
  speaker: z.enum(["patient", "ai", "staff"]),
  text: z.string().min(1),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  confidence: z.number().min(0).max(1).optional(),
  meta: z.record(z.unknown()).optional(),
  patientId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    requireUser(req);
    const body = schema.parse(await req.json());

    const transcript = await prisma.callTranscript.upsert({
      where: { callSid: body.callSid },
      update: {},
      create: {
        callSid: body.callSid,
        orchestrator: body.orchestrator,
        startedAt: new Date(body.startedAt),
        patientId: body.patientId,
      },
    });

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
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
