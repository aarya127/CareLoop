import { Injectable, Logger } from '@nestjs/common';
import { AppointmentsRepository } from './appointments.repository';
import { getRedisClient } from '../../config/redis';
import type { TimeSlot } from './dto';

const CACHE_TTL_SECONDS = 60;

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
    const { providerId, date, duration } = params;
    const cacheKey = `avail:${providerId}:${date}:${duration}`;

    const redis = getRedisClient();
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as TimeSlot[];
    } catch {
      // cache miss — proceed without
    }

    const start = performance.now();
    const slots = await this._computeSlots(providerId, date, duration);
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
  async invalidateCache(providerId: string, date: string): Promise<void> {
    const redis = getRedisClient();
    try {
      const keys = await redis.keys(`avail:${providerId}:${date}:*`);
      if (keys.length > 0) await redis.del(...keys);
    } catch {
      // non-fatal
    }
  }

  // ── Core slot generation ─────────────────────────────────────────────────

  private async _computeSlots(
    providerId: string,
    date: string,
    duration: number,
  ): Promise<TimeSlot[]> {
    const [year, month, day] = date.split('-').map(Number);

    // day-of-week in local calendar date (0 = Sun)
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    // Day boundaries in UTC (treating date as calendar-local midnight UTC)
    const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));

    const [schedules, appointments, blocks, holds] = await Promise.all([
      this.repo.findSchedule(providerId, dayOfWeek),
      this.repo.findAppointmentsForDay(providerId, dayStart, dayEnd),
      this.repo.findBlocks(providerId, dayStart, dayEnd),
      this.repo.findHolds(providerId, dayStart, dayEnd),
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

    for (const schedule of schedules) {
      // startMin / endMin are minutes-from-midnight in the provider's local day
      const windowStart = Date.UTC(year, month - 1, day, 0, schedule.startMin, 0);
      const windowEnd = Date.UTC(year, month - 1, day, 0, schedule.endMin, 0);

      let cursor = windowStart;
      while (cursor + durationMs <= windowEnd) {
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
}
