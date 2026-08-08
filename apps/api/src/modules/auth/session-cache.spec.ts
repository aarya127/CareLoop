import { describe, expect, it } from 'vitest';
import { sessionCacheTtlSeconds } from './session.service';

describe('sessionCacheTtlSeconds', () => {
  const now = new Date('2026-08-07T12:00:00.000Z');

  it('caps healthy sessions at the cache maximum', () => {
    expect(
      sessionCacheTtlSeconds(
        new Date('2026-08-07T14:00:00.000Z'),
        new Date('2026-08-07T12:30:00.000Z'),
        now,
      ),
    ).toBe(60);
  });

  it('never caches beyond the earliest session expiry', () => {
    expect(
      sessionCacheTtlSeconds(
        new Date('2026-08-07T12:00:12.000Z'),
        new Date('2026-08-07T12:30:00.000Z'),
        now,
      ),
    ).toBe(12);
  });

  it('does not cache an expired or sub-second session', () => {
    expect(
      sessionCacheTtlSeconds(
        new Date('2026-08-07T12:00:00.500Z'),
        new Date('2026-08-07T12:30:00.000Z'),
        now,
      ),
    ).toBe(0);
  });
});
