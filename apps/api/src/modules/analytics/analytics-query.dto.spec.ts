import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { AnalyticsQueryDto } from './analytics-query.dto';

describe('AnalyticsQueryDto', () => {
  it('transforms a bounded range', async () => {
    const dto = plainToInstance(AnalyticsQueryDto, { rangeDays: '90' });
    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.rangeDays).toBe(90);
  });

  it('rejects unbounded analytics ranges', async () => {
    const dto = plainToInstance(AnalyticsQueryDto, { rangeDays: '10000' });
    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(['rangeDays']);
  });
});
