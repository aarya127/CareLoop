import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/server";

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
    requireUser(req);
    const body = schema.parse(await req.json());

    const transcript = await prisma.callTranscript.update({
      where: { callSid: body.callSid },
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
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
