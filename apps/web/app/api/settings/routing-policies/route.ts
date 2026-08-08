import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireRole, requireUser } from '@/lib/auth/server';
import { routeError } from '@/lib/http/route-error';

const MANAGEMENT_ROLES = ['admin', 'manager'] as const;

const policySchema = z
  .array(
    z.object({
      patientType: z.string().trim().min(1).max(100),
      mode: z.enum(['ai_only', 'manual_only', 'ai_then_manual']),
    }),
  )
  .min(1)
  .max(50)
  .refine((entries) => new Set(entries.map((entry) => entry.patientType)).size === entries.length, {
    message: 'patientType values must be unique',
  });

export async function GET(req: NextRequest) {
  try {
    const user = requireRole(await requireUser(req), MANAGEMENT_ROLES);
    const policies = await prisma.routingPolicy.findMany({
      where: { practiceId: user.practiceId },
      orderBy: { patientType: 'asc' },
    });
    return NextResponse.json({ ok: true, policies });
  } catch (error: unknown) {
    return routeError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = requireRole(await requireUser(req), MANAGEMENT_ROLES);
    const body = policySchema.parse(await req.json());
    // Force every policy to the caller's practice — ignore any practiceId in the body.
    const practiceId = user.practiceId;

    const upserts = body.map((entry) =>
      prisma.routingPolicy.upsert({
        where: {
          practiceId_patientType: {
            practiceId,
            patientType: entry.patientType,
          },
        },
        update: { mode: entry.mode },
        create: {
          practiceId,
          patientType: entry.patientType,
          mode: entry.mode,
        },
      }),
    );

    const policies = await prisma.$transaction(upserts);
    return NextResponse.json({ ok: true, policies });
  } catch (error: unknown) {
    return routeError(error);
  }
}
