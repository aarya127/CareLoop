import { describe, it, expect, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import type { AppointmentsRepository } from './appointments.repository';

/**
 * Builds an AvailabilityService backed by a stub repository so we can exercise
 * the pure slot-generation + conflict-detection logic (`_computeSlots`) with no
 * database or Redis. Only the fields the algorithm reads are provided.
 */
function makeService(over: {
  schedules?: Array<{ startMin: number; endMin: number }>;
  appointments?: Array<{ start: Date; end: Date }>;
  blocks?: Array<{ start: Date; end: Date }>;
  holds?: Array<{ start: Date; end: Date }>;
  timeZone?: string;
}): AvailabilityService {
  const repo = {
    findPracticeTimeZone: vi.fn(async () => over.timeZone ?? 'UTC'),
    findSchedule: vi.fn(async () => over.schedules ?? []),
    findAppointmentsForDay: vi.fn(async () => over.appointments ?? []),
    findBlocks: vi.fn(async () => over.blocks ?? []),
    findHolds: vi.fn(async () => over.holds ?? []),
  } as unknown as AppointmentsRepository;

  return new AvailabilityService(repo);
}

// `_computeSlots` is private; call it directly for a focused unit test.
function computeSlots(
  svc: AvailabilityService,
  date: string,
  duration: number,
  providerId = 'prov-1',
  practiceId = 'practice-A',
) {
  return (svc as any)._computeSlots(practiceId, providerId, date, duration) as Promise<
    Array<{ start: string; end: string; available: boolean }>
  >;
}

const DATE = '2026-03-10';

describe('AvailabilityService._computeSlots', () => {
  it('returns no slots when the provider has no schedule that day', async () => {
    const svc = makeService({ schedules: [] });
    expect(await computeSlots(svc, DATE, 30)).toEqual([]);
  });

  it('generates back-to-back slots across the schedule window', async () => {
    // 09:00–10:00 window, 30-minute slots → exactly two slots.
    const svc = makeService({ schedules: [{ startMin: 540, endMin: 600 }] });
    const slots = await computeSlots(svc, DATE, 30);

    expect(slots).toHaveLength(2);
    expect(slots[0]).toEqual({
      start: '2026-03-10T09:00:00.000Z',
      end: '2026-03-10T09:30:00.000Z',
      available: true,
    });
    expect(slots[1].start).toBe('2026-03-10T09:30:00.000Z');
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it('does not emit a partial slot that overruns the window', async () => {
    // 60-minute window, 45-minute duration → only one slot fits (0–45).
    const svc = makeService({ schedules: [{ startMin: 540, endMin: 600 }] });
    const slots = await computeSlots(svc, DATE, 45);
    expect(slots).toHaveLength(1);
    expect(slots[0].end).toBe('2026-03-10T09:45:00.000Z');
  });

  it('marks a slot unavailable when an appointment overlaps it', async () => {
    const svc = makeService({
      schedules: [{ startMin: 540, endMin: 600 }],
      appointments: [
        {
          start: new Date('2026-03-10T09:00:00.000Z'),
          end: new Date('2026-03-10T09:30:00.000Z'),
        },
      ],
    });
    const slots = await computeSlots(svc, DATE, 30);

    expect(slots[0].available).toBe(false); // overlaps the appointment
    expect(slots[1].available).toBe(true); // 09:30–10:00 is free
  });

  it('treats holds and availability blocks as busy, just like appointments', async () => {
    const svc = makeService({
      schedules: [{ startMin: 540, endMin: 600 }],
      blocks: [
        {
          start: new Date('2026-03-10T09:00:00.000Z'),
          end: new Date('2026-03-10T09:30:00.000Z'),
        },
      ],
      holds: [
        {
          start: new Date('2026-03-10T09:30:00.000Z'),
          end: new Date('2026-03-10T10:00:00.000Z'),
        },
      ],
    });
    const slots = await computeSlots(svc, DATE, 30);

    expect(slots).toHaveLength(2);
    expect(slots.every((s) => !s.available)).toBe(true);
  });

  it.each([0, -30, Number.NaN, 4, 481, 12.5])(
    'rejects pathological duration %s instead of entering an unbounded loop',
    async (duration) => {
      const svc = makeService({ schedules: [{ startMin: 0, endMin: 1440 }] });
      await expect(computeSlots(svc, DATE, duration)).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it.each(['not-a-date', '2026-02-29', '2026-13-01', '2026-01-00'])(
    'rejects malformed or impossible date %s before querying',
    async (date) => {
      const svc = makeService({ schedules: [{ startMin: 540, endMin: 600 }] });
      await expect(computeSlots(svc, date, 30)).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it('merges overlapping schedule rows so slots are not duplicated', async () => {
    const svc = makeService({
      schedules: [
        { startMin: 540, endMin: 600 },
        { startMin: 570, endMin: 630 },
        { startMin: 540, endMin: 600 },
      ],
    });
    const slots = await computeSlots(svc, DATE, 30);
    expect(slots.map((slot) => slot.start)).toEqual([
      '2026-03-10T09:00:00.000Z',
      '2026-03-10T09:30:00.000Z',
      '2026-03-10T10:00:00.000Z',
    ]);
  });

  it('converts practice-local schedules with the DST offset in effect that day', async () => {
    const svc = makeService({
      schedules: [{ startMin: 540, endMin: 600 }],
      timeZone: 'America/Toronto',
    });

    const winter = await computeSlots(svc, '2026-01-12', 60);
    const summer = await computeSlots(svc, '2026-07-13', 60);

    expect(winter[0].start).toBe('2026-01-12T14:00:00.000Z');
    expect(summer[0].start).toBe('2026-07-13T13:00:00.000Z');
  });
});
