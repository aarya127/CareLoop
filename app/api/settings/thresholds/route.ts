import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/server";

const schema = z.object({
  practiceId: z.string().default("default-practice"),
  sentimentMin: z.number().int().min(1).max(10),
  escalateOnTreatmentDecline: z.boolean(),
  notifyChannel: z.object({
    type: z.enum(["in_app", "email", "sms"]),
    target: z.string().optional(),
  }),
});

export async function GET(req: NextRequest) {
  try {
    requireUser(req);
    const practiceId = new URL(req.url).searchParams.get("practiceId") ?? "default-practice";
    const config = await prisma.alertThreshold.findUnique({ where: { practiceId } });
    return NextResponse.json({ ok: true, config });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    requireUser(req);
    const body = schema.parse(await req.json());
    const config = await prisma.alertThreshold.upsert({
      where: { practiceId: body.practiceId },
      update: {
        sentimentMin: body.sentimentMin,
        escalateOnTreatmentDecline: body.escalateOnTreatmentDecline,
        notifyChannel: body.notifyChannel,
      },
      create: {
        practiceId: body.practiceId,
        sentimentMin: body.sentimentMin,
        escalateOnTreatmentDecline: body.escalateOnTreatmentDecline,
        notifyChannel: body.notifyChannel,
      },
    });

    return NextResponse.json({ ok: true, config });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
