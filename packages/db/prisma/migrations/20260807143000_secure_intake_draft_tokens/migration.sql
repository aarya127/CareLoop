-- Existing id-only draft URLs were bearer credentials and must be invalidated.
-- Preserve the old values only as unusable hashes so the migration is safe for
-- in-flight rows without exposing them through the new API.
ALTER TABLE "IntakeDraft" RENAME COLUMN "token" TO "tokenHash";
ALTER INDEX "IntakeDraft_token_key" RENAME TO "IntakeDraft_tokenHash_key";
DROP INDEX IF EXISTS "IntakeDraft_token_idx";

ALTER TABLE "IntakeDraft"
  ADD COLUMN "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "IntakeDraft" ALTER COLUMN "expiresAt" DROP DEFAULT;

CREATE INDEX "IntakeDraft_expiresAt_idx" ON "IntakeDraft"("expiresAt");
