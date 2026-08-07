-- Tenant-scope the audit trail. Platform-level events may remain NULL when no
-- tenant can be determined (for example, a login attempt for an unknown email).
ALTER TABLE "AuditLog" ADD COLUMN "practiceId" TEXT;

-- Backfill from the strongest relational source available. The metadata
-- fallback covers historical system events that already recorded practiceId.
UPDATE "AuditLog" AS audit
SET "practiceId" = COALESCE(
  actor."practiceId",
  target."practiceId",
  session_user."practiceId",
  metadata_practice."id"
)
FROM "AuditLog" AS source
LEFT JOIN "User" AS actor ON actor."id" = source."actorUserId"
LEFT JOIN "User" AS target ON target."id" = source."targetUserId"
LEFT JOIN "Session" AS session ON session."id" = source."sessionId"
LEFT JOIN "User" AS session_user ON session_user."id" = session."userId"
LEFT JOIN "Practice" AS metadata_practice
  ON metadata_practice."id" = NULLIF(source."metadata" ->> 'practiceId', '')
WHERE audit."id" = source."id"
  AND audit."practiceId" IS NULL;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_practiceId_fkey"
  FOREIGN KEY ("practiceId") REFERENCES "Practice"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AuditLog_practiceId_eventTime_idx"
  ON "AuditLog"("practiceId", "eventTime");
