import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ReminderHistoryQueryDto } from './dto';

describe('ReminderHistoryQueryDto', () => {
  it('transforms bounded pagination', async () => {
    const dto = plainToInstance(ReminderHistoryQueryDto, { limit: '25', offset: '50' });
    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto).toMatchObject({ limit: 25, offset: 50 });
  });

  it('rejects invalid filters before they reach Prisma', async () => {
    const dto = plainToInstance(ReminderHistoryQueryDto, {
      channel: 'push',
      status: 'unknown',
      from: 'not-a-date',
      limit: '1000',
    });
    const errors = await validate(dto);
    expect(errors.map((error) => error.property).sort()).toEqual([
      'channel',
      'from',
      'limit',
      'status',
    ]);
  });
});
