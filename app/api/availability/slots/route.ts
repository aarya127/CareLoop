import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const {
      practiceId,
      providerId,
      roomId,
      durationMinutes = '30',
      fromISO,
      toISO,
      numSlots = '10',
    } = Object.fromEntries(req.nextUrl.searchParams);

    if (!practiceId) {
      return NextResponse.json({ error: 'practiceId is required' }, { status: 400 });
    }

    if (!fromISO || !toISO) {
      return NextResponse.json({ error: 'fromISO and toISO are required' }, { status: 400 });
    }

    const duration = parseInt(durationMinutes, 10) || 30;
    const slotsToReturn = parseInt(numSlots, 10) || 10;

    const from = new Date(fromISO);
    const to = new Date(toISO);

    const providerSchedules = providerId
      ? await prisma.providerSchedule.findMany({
          where: { practiceId, providerId, isActive: true },
        })
      : await prisma.providerSchedule.findMany({
          where: { practiceId, isActive: true },
        });

    if (providerSchedules.length === 0) {
      return NextResponse.json({ error: 'No schedules found' }, { status: 404 });
    }

    const busyAppointments = await prisma.appointment.findMany({
      where: {
        practiceId,
        ...(providerId ? { providerId } : {}),
        start: { lte: to },
        end: { gte: from },
        status: { in: ['confirmed', 'in_progress'] },
      },
      select: { start: true, end: true },
    });

    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        practiceId,
        start: { lte: to },
        end: { gte: from },
        isActive: true,
      },
      select: { start: true, end: true },
    });

    const holds = await prisma.appointmentHold.findMany({
      where: {
        practiceId,
        start: { lte: to },
        end: { gte: from },
        expiresAt: { gt: new Date() },
      },
      select: { start: true, end: true },
    });

    const busyTimes = [...busyAppointments, ...blocks, ...holds].sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );

    const slots: Array<{ start: string; end: string }> = [];

    let cursor = new Date(from);

    while (slots.length < slotsToReturn && cursor < to) {
      const dayOfWeek = cursor.getUTCDay();
      const schedule = providerSchedules.find((s) => s.dayOfWeek === dayOfWeek);
      if (!schedule) {
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        cursor.setUTCHours(0, 0, 0, 0);
        continue;
      }

      const dayStart = new Date(cursor);
      dayStart.setUTCHours(0, 0, 0, 0);
      dayStart.setUTCMinutes(schedule.startMin);

      const dayEnd = new Date(cursor);
      dayEnd.setUTCHours(0, 0, 0, 0);
      dayEnd.setUTCMinutes(schedule.endMin);

      let slotStart = cursor > dayStart ? new Date(cursor) : dayStart;

      while (slotStart < dayEnd && slots.length < slotsToReturn) {
        const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);
        if (slotEnd > dayEnd) break;

        const conflict = busyTimes.some(
          (busy) => !(slotEnd <= busy.start || slotStart >= busy.end)
        );

        if (!conflict && slotEnd <= to) {
          slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
        }

        slotStart = new Date(slotStart.getTime() + duration * 60 * 1000);
      }

      cursor.setUTCDate(cursor.getUTCDate() + 1);
      cursor.setUTCHours(0, 0, 0, 0);
    }

    return NextResponse.json({ slots, totalSlots: slots.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
