import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireRole, requireUser } from '@/lib/auth/server';
import { routeError } from '@/lib/http/route-error';

const MANAGEMENT_ROLES = ['admin', 'manager'] as const;

const schema = z.object({
  sentimentMin: z.number().int().min(1).max(10),
  escalateOnTreatmentDecline: z.boolean(),
  notifyChannel: z.discriminatedUnion('type', [
    z.object({ type: z.literal('in_app'), target: z.string().max(320).optional() }),
    z.object({ type: z.literal('email'), target: z.string().email().max(254) }),
    z.object({ type: z.literal('sms'), target: z.string().regex(/^\+[1-9]\d{7,14}$/) }),
  ]),
});

export async function GET(req: NextRequest) {
  try {
    const user = requireRole(await requireUser(req), MANAGEMENT_ROLES);
    const config = await prisma.alertThreshold.findUnique({
      where: { practiceId: user.practiceId },
    });
    return NextResponse.json({ ok: true, config });
  } catch (error: unknown) {
    return routeError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = requireRole(await requireUser(req), MANAGEMENT_ROLES);
    const body = schema.parse(await req.json());
    // Tenancy from the session, never the request body.
    const practiceId = user.practiceId;
    const config = await prisma.alertThreshold.upsert({
      where: { practiceId },
      update: {
        sentimentMin: body.sentimentMin,
        escalateOnTreatmentDecline: body.escalateOnTreatmentDecline,
        notifyChannel: body.notifyChannel,
      },
      create: {
        practiceId,
        sentimentMin: body.sentimentMin,
        escalateOnTreatmentDecline: body.escalateOnTreatmentDecline,
        notifyChannel: body.notifyChannel,
      },
    });

    return NextResponse.json({ ok: true, config });
  } catch (error: unknown) {
    return routeError(error);
  }
}
