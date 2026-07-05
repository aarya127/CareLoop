-- Additive: persist gender + emergency contact on Patient (previously only in intake JSON).
ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "gender" TEXT,
  ADD COLUMN IF NOT EXISTS "emergencyContactName" TEXT,
  ADD COLUMN IF NOT EXISTS "emergencyContactRelationship" TEXT,
  ADD COLUMN IF NOT EXISTS "emergencyContactPhone" TEXT;
