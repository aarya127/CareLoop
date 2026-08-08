import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/server';
import { routeError } from '@/lib/http/route-error';

const schema = z.object({
  providerId: z.string().max(100).optional(),
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = schema.parse(await req.json());
    const from = new Date(body.from);
    const to = new Date(body.to);
    const maxRangeMs = 60 * 24 * 60 * 60 * 1000;
    if (to <= from || to.getTime() - from.getTime() > maxRangeMs) {
      return NextResponse.json({ ok: false, error: 'invalid_date_range' }, { status: 400 });
    }

    const whereClause = {
      practiceId: user.practiceId,
      status: { in: ['scheduled', 'confirmed', 'in_progress'] },
      // Any overlap with the requested interval, including appointments that
      // begin before `from` or end after `to`.
      start: { lt: to },
      end: { gt: from },
      ...(body.providerId ? { providerId: body.providerId } : {}),
    };

    const busy = await prisma.appointment.findMany({
      where: whereClause,
      select: {
        id: true,
        providerId: true,
        start: true,
        end: true,
        status: true,
      },
      orderBy: { start: 'asc' },
      take: 501,
    });
    if (busy.length > 500) {
      return NextResponse.json(
        { ok: false, error: 'availability_result_too_large' },
        { status: 422 },
      );
    }

    return NextResponse.json({ ok: true, busySlots: busy });
  } catch (error: unknown) {
    return routeError(error);
  }
}
