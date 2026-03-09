import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/server";

const schema = z.object({
  patientId: z.string().optional(),
  providerId: z.string(),
  title: z.string().min(3),
  notes: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  roomId: z.string().optional(),
  procedureCode: z.string().optional(),
  calendarId: z.string().optional(),
  callSid: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = requireUser(req);
    const body = schema.parse(await req.json());

    const created = await prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: body.patientId,
        providerId: body.providerId,
        title: body.title,
        notes: body.notes,
        start: new Date(body.start),
        end: new Date(body.end),
        roomId: body.roomId,
        procedureCode: body.procedureCode,
        calendarId: body.calendarId,
        source: "ai_voice",
        createdBy: "ai_voice_agent",
        status: "scheduled",
        extended: body.callSid ? { callSid: body.callSid } : undefined,
      },
    });

    return NextResponse.json({ ok: true, appointment: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
