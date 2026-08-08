import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { AuditLogQueryDto } from './audit-query.dto';

describe('AuditLogQueryDto', () => {
  it('accepts transformed bounded pagination', async () => {
    const dto = plainToInstance(AuditLogQueryDto, { limit: '100', offset: '25' });
    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto).toMatchObject({ limit: 100, offset: 25 });
  });

  it('rejects invalid dates, outcomes, and pagination', async () => {
    const dto = plainToInstance(AuditLogQueryDto, {
      outcome: 'maybe',
      from: 'not-a-date',
      limit: '0',
      offset: '-1',
    });
    const errors = await validate(dto);
    expect(errors.map((error) => error.property).sort()).toEqual([
      'from',
      'limit',
      'offset',
      'outcome',
    ]);
  });
});
