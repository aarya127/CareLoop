-- Reconcile pre-existing schema drift: schema.prisma declared these columns and
-- tables but no migration ever created them, so they were missing from the
-- database (causing 500s on /billing, /treatments, worker FailedJob writes, etc.).
--
-- Purely ADDITIVE and idempotent (IF NOT EXISTS). Intentionally does NOT:
--   • drop the FTS `search_vector` columns/indexes (added out-of-band by
--     prisma/sql/fts_setup.sql),
--   • drop the lazily-created legacy `PatientMedicalHistory` JSON table,
--   • convert Document.category from TEXT to the DocumentCategory enum
--     (kept as TEXT; validation is enforced at the application layer).

-- Invoice
ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
  ADD COLUMN IF NOT EXISTS "lineItems" JSONB,
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "payerType" TEXT NOT NULL DEFAULT 'patient',
  ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- PaymentRecord
ALTER TABLE "PaymentRecord"
  ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
  ADD COLUMN IF NOT EXISTS "payerType" TEXT NOT NULL DEFAULT 'patient';

-- Reminder
ALTER TABLE "Reminder"
  ADD COLUMN IF NOT EXISTS "failReason" TEXT,
  ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0;

-- TreatmentRecord
ALTER TABLE "TreatmentRecord"
  ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- Document
ALTER TABLE "Document"
  ADD COLUMN IF NOT EXISTS "checksumSha256" TEXT;

CREATE INDEX IF NOT EXISTS "Document_practiceId_category_uploadedAt_idx"
  ON "Document"("practiceId", "category", "uploadedAt");

-- WebhookLog
CREATE TABLE IF NOT EXISTS "WebhookLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'received',
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "WebhookLog_idempotencyKey_key" ON "WebhookLog"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "WebhookLog_provider_event_createdAt_idx" ON "WebhookLog"("provider", "event", "createdAt");

-- FailedJob
CREATE TABLE IF NOT EXISTS "FailedJob" (
    "id" TEXT NOT NULL,
    "queue" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "failReason" TEXT NOT NULL,
    "attemptsMade" INTEGER NOT NULL DEFAULT 0,
    "practiceId" TEXT,
    "failedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retriedAt" TIMESTAMP(3),

    CONSTRAINT "FailedJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FailedJob_queue_failedAt_idx" ON "FailedJob"("queue", "failedAt");
CREATE INDEX IF NOT EXISTS "FailedJob_practiceId_failedAt_idx" ON "FailedJob"("practiceId", "failedAt");
