import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
    sizeBytes?: number;
    mimeType?: string;
    checksumSha256?: string;
    patientId?: string;
    category?: string;
  } | null,
) {
  const repo = {
    findById: vi.fn(async () => doc),
    softDelete: vi.fn(async () => doc),
    patientExists: vi.fn(async () => true),
    createPending: vi.fn(async (data) => ({ id: 'doc-new', ...data })),
    activate: vi.fn(async () => ({ ...doc, status: 'active' })),
  } as unknown as DocumentsRepository;
  const storage = {
    getPresignedDownloadUrl: vi.fn(async () => 'https://signed.example/download'),
    deleteObject: vi.fn(async () => {}),
    getPresignedUploadUrl: vi.fn(async () => 'https://signed.example/upload'),
    verifyObject: vi.fn(async () => true),
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

  it('rejects an upload attached to a patient outside the practice', async () => {
    const { service, repo, storage } = makeService(null);
    vi.mocked(repo.patientExists).mockResolvedValueOnce(false);

    await expect(
      service.getUploadUrl('practice-A', {
        patientId: 'patient-B',
        uploadedBy: 'user-A',
        category: 'radiograph',
        fileName: 'scan.png',
        mimeType: 'image/png',
        sizeBytes: 100,
        checksumSha256: 'a'.repeat(64),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.createPending).not.toHaveBeenCalled();
    expect(storage.getPresignedUploadUrl).not.toHaveBeenCalled();
  });

  it('does not activate an object that fails server-side verification', async () => {
    const uploading = {
      ...DOC,
      status: 'uploading',
      sizeBytes: 100,
      mimeType: 'image/png',
      checksumSha256: 'a'.repeat(64),
      patientId: 'patient-A',
      category: 'radiograph',
    };
    const { service, repo, storage } = makeService(uploading);
    vi.mocked(storage.verifyObject).mockResolvedValueOnce(false);

    await expect(
      service.confirmUpload('practice-A', 'doc-1', {
        checksumSha256: 'a'.repeat(64),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.activate).not.toHaveBeenCalled();
  });
});
