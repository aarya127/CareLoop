import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UpdateDraftDto } from './index';

describe('UpdateDraftDto', () => {
  it('validates nested intake fields and strips unknown data', async () => {
    const dto = plainToInstance(UpdateDraftDto, {
      demographics: { firstName: 'Ada', injected: 'discard me' },
      unknownSection: { arbitrary: true },
    });

    await expect(validate(dto, { whitelist: true })).resolves.toEqual([]);
    expect(dto).not.toHaveProperty('unknownSection');
    expect(dto.demographics).not.toHaveProperty('injected');
  });

  it('rejects oversized and malformed public intake data', async () => {
    const dto = plainToInstance(UpdateDraftDto, {
      demographics: { email: 'not-an-email', firstName: 'x'.repeat(101) },
      insurance: { memberId: 'x'.repeat(201) },
      notes: 'x'.repeat(5001),
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property).sort()).toEqual([
      'demographics',
      'insurance',
      'notes',
    ]);
  });
});
