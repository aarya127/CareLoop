-- PostgreSQL Full-Text Search setup for CareLoop
-- Run once after migrations: psql $DATABASE_URL -f prisma/sql/fts_setup.sql
-- This is intentionally kept as a raw SQL file because Prisma does not support
-- tsvector column type or GIN indexes natively.

-- ============================================================================
-- PATIENT SEARCH
-- Covers: firstName, lastName, phoneE164
-- ============================================================================

ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce("firstName", '')), 'A') ||
      setweight(to_tsvector('english', coalesce("lastName", '')),  'A') ||
      setweight(to_tsvector('simple',  coalesce("phoneE164", '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS patient_search_vector_idx
  ON "Patient" USING GIN (search_vector);

-- ============================================================================
-- APPOINTMENT SEARCH
-- Covers: title, notes
-- ============================================================================

ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
      setweight(to_tsvector('english', coalesce("notes", '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS appointment_search_vector_idx
  ON "Appointment" USING GIN (search_vector);

-- ============================================================================
-- TREATMENT RECORD SEARCH
-- Covers: procedureCode, notes
-- ============================================================================

ALTER TABLE "TreatmentRecord"
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('simple',  coalesce("procedureCode", '')), 'A') ||
      setweight(to_tsvector('english', coalesce("notes", '')),         'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS treatment_search_vector_idx
  ON "TreatmentRecord" USING GIN (search_vector);

-- ============================================================================
-- DOCUMENT SEARCH
-- Covers: fileName, category
-- ============================================================================

ALTER TABLE "Document"
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('simple',  coalesce("fileName", '')),   'A') ||
      setweight(to_tsvector('english', coalesce("category", '')),   'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS document_search_vector_idx
  ON "Document" USING GIN (search_vector);
