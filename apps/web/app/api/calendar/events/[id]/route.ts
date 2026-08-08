import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';
import { updateEvent, deleteEvent } from '@/lib/google/calendar';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { SESSION_COOKIE } from '@/lib/auth/cookies';
import { SERVER_API_URL } from '@/lib/config/api-server';
import { routeError } from '@/lib/http/route-error';

const patchSchema = z.object({
  calendarId: z.string().min(1).max(1024).default('primary'),
  title: z.string().trim().min(1).max(200).optional(),
  notes: z.string().max(5000).optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  timeZone: z.string().max(100).default('America/Toronto'),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = await requireUser(req);
    const body = patchSchema.parse(await req.json());
    const appointment = await prisma.appointment.findFirst({
      where: { googleEventId: id, calendarId: body.calendarId, practiceId: user.practiceId },
      select: { id: true, start: true, end: true },
    });
    if (!appointment) {
      return NextResponse.json({ ok: false, error: 'appointment_not_found' }, { status: 404 });
    }
    const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionToken) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const start = body.start ?? appointment.start.toISOString();
    const end = body.end ?? appointment.end.toISOString();
    if (new Date(end) <= new Date(start)) {
      return NextResponse.json({ ok: false, error: 'invalid_event_range' }, { status: 400 });
    }

    if (body.start || body.end) {
      const rescheduleResponse = await fetch(
        `${SERVER_API_URL}/appointments/${encodeURIComponent(appointment.id)}/reschedule`,
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ start, end, reason: 'Updated from CareLoop calendar' }),
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!rescheduleResponse.ok) {
        const result = (await rescheduleResponse.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        return NextResponse.json(
          { ok: false, error: result.message ?? 'appointment_reschedule_failed' },
          { status: rescheduleResponse.status },
        );
      }
    }

    if (body.title !== undefined || body.notes !== undefined) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { title: body.title, notes: body.notes },
      });
    }

    const updated = await updateEvent(user.id, body.calendarId, id, {
      title: body.title,
      notes: body.notes,
      start: body.start ? start : undefined,
      end: body.end ? end : undefined,
      timeZone: body.timeZone,
    });
    return NextResponse.json({ ok: true, event: updated });
  } catch (error: unknown) {
    return routeError(error);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = await requireUser(req);
    const url = new URL(req.url);
    const calendarId = url.searchParams.get('calendarId') || 'primary';
    if (calendarId.length > 1024) {
      return NextResponse.json({ ok: false, error: 'invalid_calendar_id' }, { status: 400 });
    }
    const appointment = await prisma.appointment.findFirst({
      where: { googleEventId: id, calendarId, practiceId: user.practiceId },
      select: { id: true },
    });
    if (!appointment) {
      return NextResponse.json({ ok: false, error: 'appointment_not_found' }, { status: 404 });
    }
    const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionToken) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    // Preserve the appointment as a cancelled clinical/audit record. Hard
    // deletion previously erased history and bypassed the appointment service.
    const cancelResponse = await fetch(
      `${SERVER_API_URL}/appointments/${encodeURIComponent(appointment.id)}/cancel`,
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ reason: 'Deleted from CareLoop calendar' }),
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!cancelResponse.ok) {
      const result = (await cancelResponse.json().catch(() => ({}))) as Record<string, unknown>;
      return NextResponse.json(
        { ok: false, error: result.message ?? 'appointment_cancel_failed' },
        { status: cancelResponse.status },
      );
    }

    await deleteEvent(user.id, calendarId, id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return routeError(error);
  }
}
