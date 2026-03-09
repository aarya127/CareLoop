import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/server";

const policySchema = z.array(
  z.object({
    practiceId: z.string().default("default-practice"),
    patientType: z.string().min(1),
    mode: z.enum(["ai_only", "manual_only", "ai_then_manual"]),
  }),
);

export async function GET(req: NextRequest) {
  try {
    requireUser(req);
    const practiceId = new URL(req.url).searchParams.get("practiceId") ?? "default-practice";
    const policies = await prisma.routingPolicy.findMany({
      where: { practiceId },
      orderBy: { patientType: "asc" },
    });
    return NextResponse.json({ ok: true, policies });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    requireUser(req);
    const body = policySchema.parse(await req.json());

    const upserts = body.map((entry) =>
      prisma.routingPolicy.upsert({
        where: {
          practiceId_patientType: {
            practiceId: entry.practiceId,
            patientType: entry.patientType,
          },
        },
        update: { mode: entry.mode },
        create: {
          practiceId: entry.practiceId,
          patientType: entry.patientType,
          mode: entry.mode,
        },
      }),
    );

    const policies = await prisma.$transaction(upserts);
    return NextResponse.json({ ok: true, policies });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
