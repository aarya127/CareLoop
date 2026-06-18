# Skill Name: document-handling

## Description
Upload and retrieve patient documents (X-rays, consents, insurance cards, lab reports) using
presigned S3 URLs, and confirm/finalize uploads. Wraps the `documents` module.

## Domain
Document handling / file storage.

## Dependencies
- **API:** `documents` controller — base `/documents` (`apps/api/src/modules/documents/documents.controller.ts`)
- **Services:** `StorageService` (S3 presign), `DocumentsRepository`
- **Tables:** `Document` (`storageKey` never exposed directly; `status: uploading|active|deleted`)
- **Infra:** S3 / MinIO (`STORAGE_*` env), Postgres

---

## 2. Capability Overview
Implements the **three-step presigned upload** pattern so file bytes never pass through the
API: (1) request an upload URL, (2) PUT bytes straight to S3, (3) confirm. It can also list a
patient's documents, mint a time-limited download URL, and soft-delete. Decisions: choose the
`category`, verify checksum/size, and gate downloads behind auth.

## 3. Step-by-Step Execution Logic
**Upload (`POST /documents/upload-url` → S3 PUT → `POST /documents/:id/confirm`):**
1. Receive `{ practiceId, patientId, category, fileName, mimeType, sizeBytes?, checksumSha256? }`.
2. Validate `category` is an allowed `DocumentCategory` enum value (schema is migrating `category` to an enum — confirm the current allowed set before sending).
3. POST `/documents/upload-url` → returns `{ documentId, uploadUrl, storageKey }`; a `Document` row is created with `status=uploading`.
4. **PUT the raw bytes to `uploadUrl`** (direct to S3, not the API). Honor the `Content-Type`.
5. POST `/documents/:id/confirm` → flips `status` to `active`.
6. Return `documentId`.

**Download (`GET /documents/:id/download-url`):** returns a short-lived presigned GET URL — hand that to the client; never read `storageKey` directly.

**List (`GET /documents/patient/:patientId`).** **Delete (`DELETE /documents/:id`)** → soft delete (`status=deleted`).

## 4. Inputs & Outputs
### Inputs
Required: `practiceId`, `patientId`, `category` (enum), `fileName`, `mimeType`.
Optional: `sizeBytes`, `checksumSha256` (hex, client-supplied), `uploadedBy`.
### Outputs
```json
// POST /documents/upload-url → 201
{ "documentId": "doc_…", "uploadUrl": "https://s3…?X-Amz-…", "storageKey": "practice/…/uuid" }
```
```json
// GET /documents/:id/download-url → 200
{ "url": "https://s3…?X-Amz-… (expires)" }
```

## 5. Tools / APIs Used
- `POST /documents/upload-url`, `POST /documents/:id/confirm`, `GET /documents/:id/download-url`
- `GET /documents/patient/:patientId`, `DELETE /documents/:id`, `POST /documents`
- Internal: `StorageService` (presign GET/PUT), AWS SDK S3

## 6. Edge Cases & Failure Handling
- **Confirm never called** → document stuck in `uploading`; the worker `document-cleanup.processor` reaps stale rows. Always call confirm after a successful PUT.
- **PUT fails / partial upload** → do not confirm; retry the PUT against a fresh upload URL (URLs expire).
- **Checksum mismatch** → if `checksumSha256` was supplied, treat a mismatch as a failed upload; re-upload.
- **Invalid category** → the enum migration means a plain string may be rejected; query the allowed values first.
- **PHI:** download URLs are sensitive and time-limited — never log them or cache them beyond their TTL.

## 7. Example Usage
- **Request:** upload an X-ray for patient `pat_1`: get URL → PUT image → confirm.
- **Output:** `{ documentId: "doc_9" }`, later a download URL on demand.
- **Agent reasoning:** "Bytes go straight to S3 via the presigned URL; the API only tracks metadata and gates access, so I must complete all three steps for the doc to become `active`."

## 8. Optional Resources Folder
Optional `resources/categories.md`: the live `DocumentCategory` enum values (kept in sync with `schema.prisma`).
