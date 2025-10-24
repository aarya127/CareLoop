import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/server';
import { listEvents, insertEvent } from '@/lib/google/calendar';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const getSchema = z.object({
  calendarId: z.string().default('primary'),
  timeMin: z.string(),
  timeMax: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const user = requireUser(req);
    const url = new URL(req.url);
    const parsed = getSchema.parse({
      calendarId: url.searchParams.get('calendarId') || 'primary',
      timeMin: url.searchParams.get('timeMin'),
      timeMax: url.searchParams.get('timeMax'),
    });
    const items = await listEvents(user.id, parsed.calendarId, parsed.timeMin, parsed.timeMax);
    return NextResponse.json({ ok: true, events: items });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 });
  }
}

const postSchema = z.object({
  calendarId: z.string().default('primary'),
  title: z.string(),
  notes: z.string().optional(),
  start: z.string(),
  end: z.string(),
  timeZone: z.string().default('America/Toronto'),
  patientId: z.string().optional(),
  procedureCode: z.string().optional(),
  providerId: z.string().optional(),
  roomId: z.string().optional(),
  extended: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = requireUser(req);
    const body = postSchema.parse(await req.json());
    const appt = {
      id: crypto.randomUUID(),
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
      extended: body.extended,
    };
    const event = await insertEvent(user.id, appt);
    // Best-effort local persistence
    try {
      await prisma.appointment.create({
        data: {
          id: appt.id,
          userId: user.id,
          providerId: body.providerId || 'unknown',
          roomId: body.roomId,
          title: body.title,
          notes: body.notes,
          start: new Date(body.start),
          end: new Date(body.end),
          patientId: body.patientId,
          procedureCode: body.procedureCode,
          googleEventId: event.id || undefined,
          calendarId: body.calendarId,
          extended: body.extended as any,
        },
      });
    } catch {}
    return NextResponse.json({ ok: true, appointmentId: appt.id, googleEventId: event.id, event });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 });
  }
}
