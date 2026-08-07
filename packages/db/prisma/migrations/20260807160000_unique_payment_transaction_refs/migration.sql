-- Provider transaction references are replay identifiers. PostgreSQL permits
-- multiple NULLs in a unique index, so cash/manual payments without a reference
-- remain valid while duplicated external charges are rejected per practice.
CREATE UNIQUE INDEX "PaymentRecord_practiceId_transactionRef_key"
  ON "PaymentRecord"("practiceId", "transactionRef");
