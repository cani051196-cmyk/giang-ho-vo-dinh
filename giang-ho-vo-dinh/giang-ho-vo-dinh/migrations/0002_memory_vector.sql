CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS memory_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id text NOT NULL,
  owner_id text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  importance text NOT NULL,
  confidence integer NOT NULL DEFAULT 100,
  world_time bigint NOT NULL,
  location_id text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memory_records_owner_idx ON memory_records(owner_id);
CREATE INDEX IF NOT EXISTS memory_records_subject_idx ON memory_records(subject);
CREATE INDEX IF NOT EXISTS memory_records_embedding_hnsw ON memory_records USING hnsw (embedding vector_cosine_ops);
