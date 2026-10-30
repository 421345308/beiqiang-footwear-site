-- Run as the database owner. Never expose this schema through Supabase Data API.
BEGIN;
CREATE SCHEMA IF NOT EXISTS beiqiang_private;
REVOKE ALL ON SCHEMA beiqiang_private FROM PUBLIC;
CREATE TABLE IF NOT EXISTS beiqiang_private.business_records (
  namespace text NOT NULL,
  record_key text NOT NULL,
  value jsonb NOT NULL,
  kind text GENERATED ALWAYS AS (split_part(record_key, '/', 1)) STORED,
  object_id text GENERATED ALWAYS AS (split_part(record_key, '/', 2)) STORED,
  version bigint GENERATED ALWAYS AS (CASE WHEN split_part(record_key, '/', 1) IN ('controls','documents','tasks','runs','status_snapshots','object_locks','handling') AND record_key ~ '^[^/]+/[^/]+/[0-9]{1,15}\.json$' THEN replace(split_part(record_key, '/', 3), '.json', '')::bigint END) STORED,
  checksum text NOT NULL,
  stored_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(namespace, record_key),
  CHECK(namespace IN ('beiqiang-owner-workbench-v1', 'beiqiang-operations-v1'))
);
CREATE INDEX IF NOT EXISTS business_records_prefix ON beiqiang_private.business_records(namespace, record_key text_pattern_ops);
CREATE INDEX IF NOT EXISTS business_records_object ON beiqiang_private.business_records(namespace, kind, object_id, version DESC);

CREATE TABLE IF NOT EXISTS beiqiang_private.controls_current (
  namespace text NOT NULL, object_id text NOT NULL, version bigint NOT NULL,
  record_key text NOT NULL, value jsonb NOT NULL,
  PRIMARY KEY(namespace, object_id),
  FOREIGN KEY(namespace, record_key) REFERENCES beiqiang_private.business_records(namespace, record_key)
);
CREATE TABLE IF NOT EXISTS beiqiang_private.documents_current (LIKE beiqiang_private.controls_current INCLUDING ALL);
CREATE TABLE IF NOT EXISTS beiqiang_private.tasks_current (LIKE beiqiang_private.controls_current INCLUDING ALL);
CREATE TABLE IF NOT EXISTS beiqiang_private.runs_current (LIKE beiqiang_private.controls_current INCLUDING ALL);
CREATE TABLE IF NOT EXISTS beiqiang_private.status_snapshots_current (LIKE beiqiang_private.controls_current INCLUDING ALL);
CREATE TABLE IF NOT EXISTS beiqiang_private.object_locks_current (LIKE beiqiang_private.controls_current INCLUDING ALL);
CREATE TABLE IF NOT EXISTS beiqiang_private.inquiry_handling_current (LIKE beiqiang_private.controls_current INCLUDING ALL);
DO $$ DECLARE current_table text; BEGIN
  FOREACH current_table IN ARRAY ARRAY['documents_current','tasks_current','runs_current','status_snapshots_current','object_locks_current','inquiry_handling_current'] LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname=current_table||'_record_fk' AND conrelid=('beiqiang_private.'||current_table)::regclass) THEN
      EXECUTE format('ALTER TABLE beiqiang_private.%I ADD CONSTRAINT %I FOREIGN KEY(namespace,record_key) REFERENCES beiqiang_private.business_records(namespace,record_key)',current_table,current_table||'_record_fk');
    END IF;
  END LOOP;
END $$;
ALTER TABLE beiqiang_private.runs_current ADD COLUMN IF NOT EXISTS status text GENERATED ALWAYS AS (value->>'status') STORED;
ALTER TABLE beiqiang_private.runs_current ADD COLUMN IF NOT EXISTS task_id text GENERATED ALWAYS AS (value->>'task_id') STORED;
ALTER TABLE beiqiang_private.runs_current ADD COLUMN IF NOT EXISTS inquiry_reference text GENERATED ALWAYS AS (value->>'inquiry_reference') STORED;
ALTER TABLE beiqiang_private.tasks_current ADD COLUMN IF NOT EXISTS status text GENERATED ALWAYS AS (value->>'status') STORED;
ALTER TABLE beiqiang_private.inquiry_handling_current ADD COLUMN IF NOT EXISTS handling_status text GENERATED ALWAYS AS (value->>'handling_status') STORED;
CREATE INDEX IF NOT EXISTS runs_current_queue ON beiqiang_private.runs_current(namespace, status, (value->>'created_at'));
CREATE INDEX IF NOT EXISTS runs_current_inquiry ON beiqiang_private.runs_current(namespace, inquiry_reference);
CREATE INDEX IF NOT EXISTS runs_current_task ON beiqiang_private.runs_current(namespace, task_id);
CREATE INDEX IF NOT EXISTS handling_current_status ON beiqiang_private.inquiry_handling_current(namespace, handling_status);

CREATE TABLE IF NOT EXISTS beiqiang_private.migration_batches (
  id text PRIMARY KEY, schema_version integer NOT NULL DEFAULT 1,
  state text NOT NULL CHECK(state IN ('prepared', 'verified', 'active')),
  source_backend text NOT NULL DEFAULT 'private_blob', target_backend text NOT NULL DEFAULT 'postgres',
  manifest jsonb NOT NULL, manifest_sha256 text NOT NULL, record_count bigint NOT NULL,
  prepared_at timestamptz NOT NULL DEFAULT clock_timestamp(), verified_at timestamptz, activated_at timestamptz
);
-- A dedicated server login can be granted this role. No passwords in migrations.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='beiqiang_backend') THEN CREATE ROLE beiqiang_backend NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION; END IF;
END $$;
GRANT USAGE ON SCHEMA beiqiang_private TO beiqiang_backend;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA beiqiang_private TO beiqiang_backend;
REVOKE ALL ON ALL TABLES IN SCHEMA beiqiang_private FROM PUBLIC;
COMMIT;
