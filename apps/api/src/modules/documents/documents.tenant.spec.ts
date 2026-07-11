import { describe, it, expect, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import type { DocumentsRepository } from './documents.repository';
import type { StorageService } from './storage.service';
import type { AuditService } from '../audit/audit.service';

/**
 * Tenant-isolation guarantees for DocumentsService: presigned download URLs and
 * deletes must reject documents that belong to another practice, so a caller
 * cannot mint a signed URL for another clinic's radiographs/consent forms by id.
 */
function makeService(
  doc: {
    id: string;
    practiceId: string;
    status: string;
    storageKey: string;
    fileName: string;
  } | null,
) {
  const repo = {
    findById: vi.fn(async () => doc),
    softDelete: vi.fn(async () => doc),
  } as unknown as DocumentsRepository;
  const storage = {
    getPresignedDownloadUrl: vi.fn(async () => 'https://signed.example/download'),
    deleteObject: vi.fn(async () => {}),
  } as unknown as StorageService;
  const audit = { record: vi.fn(async () => {}) } as unknown as AuditService;
  return { service: new DocumentsService(storage, repo, audit), repo, storage };
}

const DOC = {
  id: 'doc-1',
  practiceId: 'practice-A',
  status: 'active',
  storageKey: 'practice-A/patient-1/doc-1/scan.png',
  fileName: 'scan.png',
};

describe('DocumentsService tenant isolation', () => {
  it('getDownloadUrl issues a signed URL for the owning practice', async () => {
    const { service } = makeService(DOC);
    await expect(service.getDownloadUrl('practice-A', 'doc-1')).resolves.toEqual({
      url: 'https://signed.example/download',
      fileName: 'scan.png',
    });
  });

  it('getDownloadUrl 404s for a different practice (no cross-tenant presigned URL)', async () => {
    const { service, storage } = makeService(DOC);
    await expect(service.getDownloadUrl('practice-B', 'doc-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(storage.getPresignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('remove refuses a cross-tenant document', async () => {
    const { service, repo } = makeService(DOC);
    await expect(service.remove('practice-B', 'doc-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.softDelete).not.toHaveBeenCalled();
  });
});
