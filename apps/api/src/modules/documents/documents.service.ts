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

const ALLOWED_DOCUMENT_CATEGORIES = new Set([
  'consent',
  'insurance_card',
  'lab_report',
  'referral',
  'other',
  // EMR clinical imaging/document categories
  'radiograph',
  'clinical_photo',
  'treatment_plan',
]);

@Injectable()
export class DocumentsService {
  constructor(
    private readonly storage: StorageService,
    private readonly repo: DocumentsRepository,
    private readonly audit: AuditService,
  ) {}

  /**
   * Load a document and confirm it belongs to the caller's practice. Cross-tenant
   * (or missing) ids are surfaced as 404 so an attacker cannot distinguish
   * "exists in another practice" from "does not exist".
   */
  private async getOwnedDoc(practiceId: string, documentId: string): Promise<any> {
    const doc = await this.repo.findById(documentId);
    if (!doc || doc.practiceId !== practiceId) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }
    return doc;
  }

  async findByPatientId(practiceId: string, patientId: string, query: any): Promise<any[]> {
    const category = query?.category;
    if (category && !ALLOWED_DOCUMENT_CATEGORIES.has(category)) {
      throw new BadRequestException(`Invalid document category: ${category}`);
    }
    return this.repo.findByPatientId(patientId, practiceId, category);
  }

  /**
   * Step 1 of upload flow: validate, create a pending DB record, return a
   * pre-signed PUT URL the client can use to upload directly to storage.
   */
  async getUploadUrl(
    practiceId: string,
    dto: {
      patientId?: string;
      uploadedBy?: string;
      category: string;
      fileName: string;
      mimeType: string;
      sizeBytes?: number;
      checksumSha256?: string;
    },
  ): Promise<{ uploadUrl: string; documentId: string; storageKey: string }> {
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

    if (!dto.category || !ALLOWED_DOCUMENT_CATEGORIES.has(dto.category)) {
      throw new BadRequestException(`Invalid document category: ${dto.category}`);
    }

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
    practiceId: string,
    documentId: string,
    dto: { checksumSha256?: string; actorUserId?: string },
  ): Promise<any> {
    const doc = await this.getOwnedDoc(practiceId, documentId);
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
   * Generate a pre-signed GET URL (15 min) for secure download/view.
   */
  async getDownloadUrl(
    practiceId: string,
    documentId: string,
  ): Promise<{ url: string; fileName: string }> {
    const doc = await this.getOwnedDoc(practiceId, documentId);
    if (doc.status !== 'active') throw new ForbiddenException('Document is not available');

    const url = await this.storage.getPresignedDownloadUrl(doc.storageKey, doc.fileName);
    return { url, fileName: doc.fileName };
  }

  /**
   * Soft-delete the DB record then remove the object from storage.
   * Audit log is written regardless of storage delete outcome.
   */
  async remove(practiceId: string, documentId: string, actorUserId?: string): Promise<void> {
    const doc = await this.getOwnedDoc(practiceId, documentId);
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
