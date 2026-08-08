import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { IntakeService } from './intake.service';
import { hashDraftToken } from './intake-token.service';
import type { IntakeRepository } from './intake.repository';
import type { AuditService } from '../audit/audit.service';
import type { IdempotencyService } from '../../common/services/idempotency.service';
import type { IntakeTokenService } from './intake-token.service';

function makeService(draft: Record<string, unknown> | null) {
  const repository = {
    findDraftByCapability: vi.fn(async () => draft),
    findDraftByPractice: vi.fn(async () => draft),
    updateDraft: vi.fn(),
  } as unknown as IntakeRepository;
  const service = new IntakeService(
    repository,
    { record: vi.fn() } as unknown as AuditService,
    {} as IdempotencyService,
    {} as IntakeTokenService,
  );
  return { service, repository };
}

describe('IntakeService capability isolation', () => {
  it('looks up a public draft by the hash of its capability token', async () => {
    const { service, repository } = makeService({
      id: 'draft-1',
      practiceId: 'practice-A',
      tokenHash: 'stored-secret-hash',
      status: 'draft',
      data: {},
    });

    const result = await service.findDraft('draft-1', 'raw-secret-token');

    expect(repository.findDraftByCapability).toHaveBeenCalledWith(
      'draft-1',
      hashDraftToken('raw-secret-token'),
    );
    expect(result).not.toHaveProperty('tokenHash');
  });

  it('returns not-found and never mutates when the capability is invalid', async () => {
    const { service, repository } = makeService(null);

    await expect(
      service.updateDraft('draft-1', 'wrong-token', { notes: 'tampered' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.updateDraft).not.toHaveBeenCalled();
  });

  it('scopes authenticated staff reads to their practice', async () => {
    const { service, repository } = makeService(null);

    await expect(service.findById('practice-A', 'draft-from-B')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.findDraftByPractice).toHaveBeenCalledWith('draft-from-B', 'practice-A');
  });
});
