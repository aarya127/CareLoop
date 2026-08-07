import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AppointmentsRepository } from './appointments.repository';
import { getRedisClient } from '../../config/redis';
import type { TimeSlot } from './dto';

const CACHE_TTL_SECONDS = 60;
const MIN_DURATION_MINUTES = 5;
const MAX_DURATION_MINUTES = 480;
const MAX_SLOTS_PER_DAY = 500;

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

function parseCalendarDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

/** Convert a wall-clock minute in an IANA zone into its UTC instant. */
export function zonedMinuteToUtc(
  date: CalendarDate,
  minuteOfDay: number,
  timeZone: string,
): number | null {
  const desiredDate = new Date(Date.UTC(date.year, date.month - 1, date.day, 0, minuteOfDay, 0, 0));
  const desired = {
    year: desiredDate.getUTCFullYear(),
    month: desiredDate.getUTCMonth() + 1,
    day: desiredDate.getUTCDate(),
    hour: desiredDate.getUTCHours(),
    minute: desiredDate.getUTCMinutes(),
  };
  const desiredAsUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
  );

  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-US-u-hc-h23', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
  } catch {
    return null;
  }

  let guess = desiredAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const values: Record<string, number> = {};
    for (const part of formatter.formatToParts(new Date(guess))) {
      if (part.type !== 'literal') values[part.type] = Number(part.value);
    }
    const representedAsUtc = Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
    );
    const correction = desiredAsUtc - representedAsUtc;
    if (correction === 0) return guess;
    guess += correction;
  }
  // The local time does not exist (for example, during the spring DST gap).
  return null;
}

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(private readonly repo: AppointmentsRepository) {}

  /**
   * Return available time slots for a provider on a given date.
   * Results are cached in Redis for 60 s to protect the DB on hot paths.
   */
  async getSlots(params: {
    practiceId: string;
    providerId: string;
    date: string; // YYYY-MM-DD
    duration: number; // minutes
  }): Promise<TimeSlot[]> {
    const { practiceId, providerId, date, duration } = params;
    this.validateInput(date, duration);
    const cacheKey = `avail:${practiceId}:${providerId}:${date}:${duration}`;

    const redis = getRedisClient();
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as TimeSlot[];
    } catch {
      // cache miss — proceed without
    }

    const start = performance.now();
    const slots = await this._computeSlots(practiceId, providerId, date, duration);
    const elapsed = Math.round(performance.now() - start);
    this.logger.log(
      `Slot computation for ${providerId} on ${date} (${duration} min): ${elapsed} ms, ${slots.length} slots`,
    );

    try {
      await redis.set(cacheKey, JSON.stringify(slots), 'EX', CACHE_TTL_SECONDS);
    } catch {
      // non-fatal
    }

    return slots;
  }

  /** Invalidate the cache for all durations on a given provider/date. */
  async invalidateCache(practiceId: string, providerId: string, date: string): Promise<void> {
    const redis = getRedisClient();
    try {
      const keys = await redis.keys(`avail:${practiceId}:${providerId}:${date}:*`);
      if (keys.length > 0) await redis.del(...keys);
    } catch {
      // non-fatal
    }
  }

  // ── Core slot generation ─────────────────────────────────────────────────

  private async _computeSlots(
    practiceId: string,
    providerId: string,
    date: string,
    duration: number,
  ): Promise<TimeSlot[]> {
    this.validateInput(date, duration);
    const calendarDate = parseCalendarDate(date)!;
    const { year, month, day } = calendarDate;

    const timeZone = await this.repo.findPracticeTimeZone(practiceId);
    if (!timeZone) throw new NotFoundException('Practice not found');

    // Resolve the practice-local calendar day into exclusive UTC boundaries.
    const dayStartMs = zonedMinuteToUtc(calendarDate, 0, timeZone);
    const dayEndMs = zonedMinuteToUtc(calendarDate, 24 * 60, timeZone);
    if (dayStartMs == null || dayEndMs == null) {
      throw new BadRequestException('Practice time zone is invalid');
    }
    const dayStart = new Date(dayStartMs);
    const dayEnd = new Date(dayEndMs);
    const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

    const [schedules, appointments, blocks, holds] = await Promise.all([
      this.repo.findSchedule(practiceId, providerId, dayOfWeek, dayStart, dayEnd),
      this.repo.findAppointmentsForDay(practiceId, providerId, dayStart, dayEnd),
      this.repo.findBlocks(practiceId, providerId, dayStart, dayEnd),
      this.repo.findHolds(practiceId, providerId, dayStart, dayEnd),
    ]);

    if (schedules.length === 0) return [];

    // Busy intervals as [startMs, endMs]
    const busy: Array<[number, number]> = [
      ...appointments.map((a) => [a.start.getTime(), a.end.getTime()] as [number, number]),
      ...blocks.map((b) => [b.start.getTime(), b.end.getTime()] as [number, number]),
      ...holds.map((h) => [h.start.getTime(), h.end.getTime()] as [number, number]),
    ];

    const durationMs = duration * 60_000;
    const slots: TimeSlot[] = [];

    // Ignore corrupt schedule rows and merge overlaps so duplicate schedules do
    // not produce duplicate slots or unbounded output.
    const windows = schedules
      .filter(
        (schedule) =>
          Number.isInteger(schedule.startMin) &&
          Number.isInteger(schedule.endMin) &&
          schedule.startMin >= 0 &&
          schedule.endMin <= 24 * 60 &&
          schedule.startMin < schedule.endMin,
      )
      .map((schedule) => [schedule.startMin, schedule.endMin] as [number, number])
      .sort((a, b) => a[0] - b[0]);
    const mergedWindows: Array<[number, number]> = [];
    for (const window of windows) {
      const previous = mergedWindows.at(-1);
      if (previous && window[0] <= previous[1]) previous[1] = Math.max(previous[1], window[1]);
      else mergedWindows.push([...window]);
    }

    for (const [startMin, endMin] of mergedWindows) {
      const windowStart = zonedMinuteToUtc(calendarDate, startMin, timeZone);
      const windowEnd = zonedMinuteToUtc(calendarDate, endMin, timeZone);
      if (windowStart == null || windowEnd == null || windowStart >= windowEnd) continue;

      let cursor = windowStart;
      while (cursor + durationMs <= windowEnd && slots.length < MAX_SLOTS_PER_DAY) {
        const slotEnd = cursor + durationMs;
        const isAvailable = !busy.some(([bStart, bEnd]) => cursor < bEnd && slotEnd > bStart);
        slots.push({
          start: new Date(cursor).toISOString(),
          end: new Date(slotEnd).toISOString(),
          available: isAvailable,
        });
        cursor += durationMs;
      }
    }

    // Sort by start time (multiple schedule windows can interleave)
    slots.sort((a, b) => a.start.localeCompare(b.start));
    return slots;
  }

  private validateInput(date: string, duration: number): void {
    if (!parseCalendarDate(date)) throw new BadRequestException('date must be a real YYYY-MM-DD');
    if (
      !Number.isInteger(duration) ||
      duration < MIN_DURATION_MINUTES ||
      duration > MAX_DURATION_MINUTES
    ) {
      throw new BadRequestException(
        `duration must be an integer from ${MIN_DURATION_MINUTES} to ${MAX_DURATION_MINUTES} minutes`,
      );
    }
  }
}
