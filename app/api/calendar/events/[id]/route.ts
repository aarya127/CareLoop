import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';
import { updateEvent, deleteEvent } from '@/lib/google/calendar';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';

const patchSchema = z.object({
  calendarId: z.string().default('primary'),
  title: z.string().optional(),
  notes: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  timeZone: z.string().default('America/Toronto'),
  patientId: z.string().optional(),
  procedureCode: z.string().optional(),
  providerId: z.string().optional(),
  roomId: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  extended: z.record(z.any()).optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = requireUser(req);
    const body = patchSchema.parse(await req.json());
    const updated = await updateEvent(user.id, body.calendarId, id, body as any);
    // Best-effort local update
    try {
      await prisma.appointment.updateMany({
        where: { googleEventId: id, practiceId: user.practiceId },
        data: {
          title: body.title ?? undefined,
          notes: body.notes ?? undefined,
          start: body.start ? new Date(body.start) : undefined,
          end: body.end ? new Date(body.end) : undefined,
          procedureCode: body.procedureCode ?? undefined,
          roomId: body.roomId ?? undefined,
          status: body.status ?? undefined,
          extended: body.extended as any,
        },
      });
    } catch {}
    return NextResponse.json({ ok: true, event: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = requireUser(req);
    const url = new URL(req.url);
    const calendarId = url.searchParams.get('calendarId') || 'primary';
    await deleteEvent(user.id, calendarId, id);
    try {
      await prisma.appointment.deleteMany({ where: { googleEventId: id, practiceId: user.practiceId } });
    } catch {}
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 });
  }
}
