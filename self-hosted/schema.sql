-- Applied in the configured private schema by storage.initialize().
CREATE TABLE IF NOT EXISTS storage_objects (
  namespace text NOT NULL,
  object_key text COLLATE "C" NOT NULL,
  kind text NOT NULL CHECK (kind IN ('json','text','binary')),
  body text,
  file_hash text CHECK (file_hash IS NULL OR file_hash ~ '^[a-f0-9]{64}$'),
  etag text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  size bigint NOT NULL CHECK (size >= 0),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(namespace,object_key),
  CHECK ((kind='binary' AND file_hash IS NOT NULL AND body IS NULL) OR (kind<>'binary' AND body IS NOT NULL AND file_hash IS NULL))
);
CREATE TABLE IF NOT EXISTS storage_upload_receipts (
  token_hash text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
