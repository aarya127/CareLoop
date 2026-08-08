import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';
import { deleteEvent, listEvents, insertEvent } from '@/lib/google/calendar';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { SESSION_COOKIE } from '@/lib/auth/cookies';
import { getServerApiUrl } from '@/lib/config/api-server';
import { routeError } from '@/lib/http/route-error';

const getSchema = z.object({
  calendarId: z.string().min(1).max(1024).default('primary'),
  timeMin: z.string().datetime(),
  timeMax: z.string().datetime(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const url = new URL(req.url);
    const parsed = getSchema.parse({
      calendarId: url.searchParams.get('calendarId') || 'primary',
      timeMin: url.searchParams.get('timeMin'),
      timeMax: url.searchParams.get('timeMax'),
    });
    const timeMin = new Date(parsed.timeMin);
    const timeMax = new Date(parsed.timeMax);
    if (timeMax <= timeMin || timeMax.getTime() - timeMin.getTime() > 366 * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ ok: false, error: 'invalid_calendar_range' }, { status: 400 });
    }
    const items = await listEvents(user.id, parsed.calendarId, parsed.timeMin, parsed.timeMax);
    return NextResponse.json({ ok: true, events: items });
  } catch (error: unknown) {
    return routeError(error);
  }
}

const postSchema = z.object({
  calendarId: z.string().min(1).max(1024).default('primary'),
  title: z.string().trim().min(1).max(200),
  notes: z.string().max(5000).optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  timeZone: z.string().max(100).default('America/Toronto'),
  patientId: z.string().max(100).optional(),
  procedureCode: z.string().max(100).optional(),
  providerId: z.string().min(1).max(100),
  roomId: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = postSchema.parse(await req.json());
    if (new Date(body.end) <= new Date(body.start)) {
      return NextResponse.json({ ok: false, error: 'invalid_event_range' }, { status: 400 });
    }
    const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionToken) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    // Create the authoritative local appointment first. This enforces tenant
    // references, provider conflict locking, validation, audit, and cache busting.
    const appointmentResponse = await fetch(`${getServerApiUrl()}/appointments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${sessionToken}`,
        'idempotency-key': `calendar:${body.calendarId}:${body.providerId}:${body.start}`,
      },
      body: JSON.stringify({
        userId: user.id,
        providerId: body.providerId,
        patientId: body.patientId,
        roomId: body.roomId,
        title: body.title,
        notes: body.notes,
        start: body.start,
        end: body.end,
        timeZone: body.timeZone,
        procedureCode: body.procedureCode,
        source: 'google_calendar',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const appointment = (await appointmentResponse.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!appointmentResponse.ok || typeof appointment.id !== 'string') {
      return NextResponse.json(
        { ok: false, error: appointment.message ?? 'appointment_create_failed' },
        { status: appointmentResponse.status },
      );
    }

    const appt = {
      id: appointment.id,
      userId: user.id,
      calendarId: body.calendarId,
      title: body.title,
      notes: body.notes,
      start: body.start,
      end: body.end,
      timeZone: body.timeZone,
      patientId: body.patientId,
      procedureCode: body.procedureCode,
      providerId: body.providerId,
      roomId: body.roomId,
    };
    const event = await insertEvent(user.id, appt);
    if (!event.id) throw new Error('Google Calendar did not return an event id');
    const linked = await prisma.appointment.updateMany({
      where: { id: appt.id, practiceId: user.practiceId },
      data: { googleEventId: event.id, calendarId: body.calendarId },
    });
    if (linked.count !== 1) {
      await deleteEvent(user.id, body.calendarId, event.id).catch(() => undefined);
      throw new Error('Unable to link Google event to appointment');
    }
    return NextResponse.json({ ok: true, appointmentId: appt.id, googleEventId: event.id, event });
  } catch (error: unknown) {
    return routeError(error);
  }
}
