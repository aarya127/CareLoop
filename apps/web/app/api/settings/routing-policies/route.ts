import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/server';

const policySchema = z.array(
  z.object({
    practiceId: z.string().default('default-practice'),
    patientType: z.string().min(1),
    mode: z.enum(['ai_only', 'manual_only', 'ai_then_manual']),
  }),
);

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const policies = await prisma.routingPolicy.findMany({
      where: { practiceId: user.practiceId },
      orderBy: { patientType: 'asc' },
    });
    return NextResponse.json({ ok: true, policies });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser(req);
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
    const message = error instanceof Error ? error.message : 'failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
