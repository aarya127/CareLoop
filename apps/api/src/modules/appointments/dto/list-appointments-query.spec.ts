import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ListAppointmentsQueryDto } from './index';

describe('ListAppointmentsQueryDto', () => {
  it('transforms and accepts bounded pagination and ISO dates', async () => {
    const dto = plainToInstance(ListAppointmentsQueryDto, {
      from: '2026-08-01T00:00:00.000Z',
      limit: '50',
      offset: '10',
    });

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto).toMatchObject({ limit: 50, offset: 10 });
  });

  it('rejects invalid dates and pagination outside the allowed range', async () => {
    const dto = plainToInstance(ListAppointmentsQueryDto, {
      from: 'not-a-date',
      limit: '10000',
      offset: '-1',
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property).sort()).toEqual(['from', 'limit', 'offset']);
  });
});
