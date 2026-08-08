import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireRole, requireUser } from '@/lib/auth/server';
import { routeError } from '@/lib/http/route-error';
import { CARELOOP_VOICE_SYSTEM_PROMPT } from '@/lib/services/voice-agent';

const createSchema = z.object({
  systemPrompt: z.string().min(40).max(20_000),
});

const activateSchema = z.object({
  version: z.number().int().min(1),
});

const MANAGEMENT_ROLES = ['admin', 'manager'] as const;

export async function GET(req: NextRequest) {
  try {
    const user = requireRole(await requireUser(req), MANAGEMENT_ROLES);
    const practiceId = user.practiceId;

    const activePrompt = await prisma.aIPromptVersion.findFirst({
      where: { practiceId, isActive: true },
      orderBy: { version: 'desc' },
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
    return routeError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireRole(await requireUser(req), MANAGEMENT_ROLES);
    const body = createSchema.parse(await req.json());
    const practiceId = user.practiceId;

    const created = await prisma.$transaction(async (tx) => {
      // Serialize version allocation per practice so concurrent requests cannot
      // choose the same next version.
      await tx.practice.update({ where: { id: practiceId }, data: { updatedAt: new Date() } });
      const latest = await tx.aIPromptVersion.findFirst({
        where: { practiceId },
        orderBy: { version: 'desc' },
      });
      return tx.aIPromptVersion.create({
        data: {
          practiceId,
          version: (latest?.version ?? 0) + 1,
          systemPrompt: body.systemPrompt,
          createdBy: user.id,
        },
      });
    });

    return NextResponse.json({ ok: true, prompt: created });
  } catch (error: unknown) {
    return routeError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = requireRole(await requireUser(req), MANAGEMENT_ROLES);
    const body = activateSchema.parse(await req.json());
    const practiceId = user.practiceId;

    const active = await prisma.$transaction(async (tx) => {
      await tx.practice.update({ where: { id: practiceId }, data: { updatedAt: new Date() } });
      const target = await tx.aIPromptVersion.findFirst({
        where: { practiceId, version: body.version },
        select: { id: true },
      });
      if (!target) return null;

      await tx.aIPromptVersion.updateMany({
        where: { practiceId, isActive: true },
        data: { isActive: false },
      });
      return tx.aIPromptVersion.update({
        where: { id: target.id },
        data: { isActive: true },
      });
    });

    if (!active) {
      return NextResponse.json({ ok: false, error: 'prompt_version_not_found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, activePrompt: active });
  } catch (error: unknown) {
    return routeError(error);
  }
}
