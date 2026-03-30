CREATE EXTENSION IF NOT EXISTS vector;

-- Optional: convert embedding storage to native vector in PostgreSQL when running SQL migrations manually.
ALTER TABLE "CallTranscript"
ADD COLUMN IF NOT EXISTS transcript_embedding vector(1536);

CREATE INDEX IF NOT EXISTS call_transcript_embedding_idx
ON "CallTranscript"
USING ivfflat (transcript_embedding vector_cosine_ops)
WITH (lists = 100);
