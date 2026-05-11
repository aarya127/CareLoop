import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StorageService } from './storage.service';
import { DocumentsRepository } from './documents.repository';
import { AuditService } from '../audit/audit.service';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../../config/storage';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly storage: StorageService,
    private readonly repo: DocumentsRepository,
    private readonly audit: AuditService,
  ) {}

  async findByPatientId(patientId: string, query: any): Promise<any[]> {
    const practiceId = String(query?.practiceId ?? 'demo-practice');
    return this.repo.findByPatientId(patientId, practiceId, query?.category);
  }

  /**
   * Step 1 of upload flow: validate, create a pending DB record, return a
   * pre-signed PUT URL the client can use to upload directly to storage.
   */
  async getUploadUrl(dto: {
    practiceId?: string;
    patientId?: string;
    uploadedBy?: string;
    category: string;
    fileName: string;
    mimeType: string;
    sizeBytes?: number;
    checksumSha256?: string;
  }): Promise<{ uploadUrl: string; documentId: string; storageKey: string }> {
    // ── MIME validation ─────────────────────────────────────────────────────
    if (!dto.mimeType || !ALLOWED_MIME_TYPES.has(dto.mimeType)) {
      throw new BadRequestException(
        `File type "${dto.mimeType}" is not allowed. ` +
          `Allowed types: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      );
    }

    // ── Size validation ─────────────────────────────────────────────────────
    if (dto.sizeBytes && dto.sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
      );
    }

    // ── File name sanitisation ───────────────────────────────────────────────
    const safeName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);

    const practiceId = String(dto.practiceId ?? 'demo-practice');
    const storageKey = `${practiceId}/${dto.patientId ?? 'unassigned'}/${randomUUID()}/${safeName}`;

    // ── Create pending DB record ─────────────────────────────────────────────
    const doc = await this.repo.createPending({
      practiceId,
      patientId: dto.patientId,
      uploadedBy: dto.uploadedBy,
      category: dto.category,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      storageKey,
      sizeBytes: dto.sizeBytes,
      checksumSha256: dto.checksumSha256,
    });

    // ── Generate presigned PUT URL ───────────────────────────────────────────
    const uploadUrl = await this.storage.getPresignedUploadUrl(storageKey, dto.mimeType);

    void this.audit.record({
      eventType: 'document_upload_initiated',
      outcome: 'success',
      actorUserId: dto.uploadedBy,
      metadata: { documentId: doc.id, patientId: dto.patientId, category: dto.category },
    });

    return { uploadUrl, documentId: doc.id, storageKey };
  }

  /**
   * Step 2 of upload flow: client confirms the PUT succeeded. We mark the
   * document active and optionally record the final checksum.
   */
  async confirmUpload(
    documentId: string,
    dto: { checksumSha256?: string; actorUserId?: string },
  ): Promise<any> {
    const doc = await this.repo.findById(documentId);
    if (!doc) throw new NotFoundException(`Document ${documentId} not found`);
    if (doc.status === 'deleted') throw new ForbiddenException('Document has been deleted');

    const active = await this.repo.activate(documentId, dto.checksumSha256);

    void this.audit.record({
      eventType: 'document_uploaded',
      outcome: 'success',
      actorUserId: dto.actorUserId,
      metadata: {
        documentId,
        patientId: doc.patientId,
        category: doc.category,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
      },
    });

    return active;
  }

  /**
   * Legacy: kept for backward compat. Acts as getUploadUrl.
   */
  async create(dto: any): Promise<any> {
    return this.getUploadUrl(dto);
  }

  /**
   * Generate a pre-signed GET URL (15 min) for secure download/view.
   */
  async getDownloadUrl(documentId: string): Promise<{ url: string; fileName: string }> {
    const doc = await this.repo.findById(documentId);
    if (!doc) throw new NotFoundException(`Document ${documentId} not found`);
    if (doc.status !== 'active') throw new ForbiddenException('Document is not available');

    const url = await this.storage.getPresignedDownloadUrl(doc.storageKey, doc.fileName);
    return { url, fileName: doc.fileName };
  }

  /**
   * Soft-delete the DB record then remove the object from storage.
   * Audit log is written regardless of storage delete outcome.
   */
  async remove(documentId: string, actorUserId?: string): Promise<void> {
    const doc = await this.repo.findById(documentId);
    if (!doc) throw new NotFoundException(`Document ${documentId} not found`);
    if (doc.status === 'deleted') return; // idempotent

    await this.repo.softDelete(documentId);

    void this.audit.record({
      eventType: 'document_deleted',
      outcome: 'success',
      actorUserId,
      metadata: { documentId, patientId: doc.patientId, storageKey: doc.storageKey },
    });

    // Best-effort: delete from storage (don't fail the request if storage is unavailable)
    try {
      await this.storage.deleteObject(doc.storageKey);
    } catch {
      void this.audit.record({
        eventType: 'document_storage_delete_failed',
        outcome: 'failure',
        metadata: { documentId, storageKey: doc.storageKey },
      });
    }
  }
}
