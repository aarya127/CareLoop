-- PostgreSQL Full-Text Search: generated tsvector columns + GIN indexes
-- Idempotent (IF NOT EXISTS / IF NOT COLUMN) — safe to re-run.

-- Patient: firstName, lastName, phoneE164
ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce("firstName", '')), 'A') ||
      setweight(to_tsvector('english', coalesce("lastName",  '')), 'A') ||
      setweight(to_tsvector('simple',  coalesce("phoneE164", '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS patient_search_vector_idx
  ON "Patient" USING GIN (search_vector);

-- Appointment: title, notes
ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
      setweight(to_tsvector('english', coalesce("notes", '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS appointment_search_vector_idx
  ON "Appointment" USING GIN (search_vector);

-- TreatmentRecord: procedureCode, notes
ALTER TABLE "TreatmentRecord"
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('simple',  coalesce("procedureCode", '')), 'A') ||
      setweight(to_tsvector('english', coalesce("notes", '')),         'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS treatment_search_vector_idx
  ON "TreatmentRecord" USING GIN (search_vector);

-- Document: fileName, category
ALTER TABLE "Document"
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('simple',  coalesce("fileName", '')), 'A') ||
      setweight(to_tsvector('english', coalesce("category", '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS document_search_vector_idx
  ON "Document" USING GIN (search_vector);
