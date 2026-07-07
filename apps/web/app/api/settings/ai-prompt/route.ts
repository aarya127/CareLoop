import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/server";
import { CARELOOP_VOICE_SYSTEM_PROMPT } from "@/lib/services/voice-agent";

const createSchema = z.object({
  practiceId: z.string().default("default-practice"),
  systemPrompt: z.string().min(40),
});

const activateSchema = z.object({
  practiceId: z.string().default("default-practice"),
  version: z.number().int().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const practiceId = user.practiceId;

    const activePrompt = await prisma.aIPromptVersion.findFirst({
      where: { practiceId, isActive: true },
      orderBy: { version: "desc" },
    });

    return NextResponse.json({
      ok: true,
      activePrompt: activePrompt ?? {
        practiceId,
        version: 1,
        systemPrompt: CARELOOP_VOICE_SYSTEM_PROMPT,
        isActive: true,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = createSchema.parse(await req.json());
    const practiceId = user.practiceId;

    const latest = await prisma.aIPromptVersion.findFirst({
      where: { practiceId },
      orderBy: { version: "desc" },
    });

    const created = await prisma.aIPromptVersion.create({
      data: {
        practiceId,
        version: (latest?.version ?? 0) + 1,
        systemPrompt: body.systemPrompt,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ ok: true, prompt: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = activateSchema.parse(await req.json());
    const practiceId = user.practiceId;

    await prisma.$transaction([
      prisma.aIPromptVersion.updateMany({
        where: { practiceId, isActive: true },
        data: { isActive: false },
      }),
      prisma.aIPromptVersion.updateMany({
        where: { practiceId, version: body.version },
        data: { isActive: true },
      }),
    ]);

    const active = await prisma.aIPromptVersion.findFirst({
      where: { practiceId, isActive: true },
      orderBy: { version: "desc" },
    });

    return NextResponse.json({ ok: true, activePrompt: active });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
