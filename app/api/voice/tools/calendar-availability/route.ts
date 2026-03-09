import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/server";

const schema = z.object({
  providerId: z.string().optional(),
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  try {
    const user = requireUser(req);
    const body = schema.parse(await req.json());

    const whereClause = {
      userId: user.id,
      status: { in: ["scheduled", "confirmed", "in_progress"] },
      start: { gte: new Date(body.from) },
      end: { lte: new Date(body.to) },
      ...(body.providerId ? { providerId: body.providerId } : {}),
    };

    const busy = await prisma.appointment.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        providerId: true,
        start: true,
        end: true,
        status: true,
      },
      orderBy: { start: "asc" },
    });

    return NextResponse.json({ ok: true, busySlots: busy });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
