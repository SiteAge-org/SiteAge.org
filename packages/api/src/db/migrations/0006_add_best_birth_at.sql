ALTER TABLE domains ADD COLUMN best_birth_at TEXT;

-- Migrate existing CDX birth_at to best_birth_at
UPDATE domains SET best_birth_at = birth_at WHERE birth_at IS NOT NULL;

-- Migrate historical CDX records to source_queries
INSERT INTO source_queries (domain, source, earliest_date, raw_data, queried_at, created_at)
SELECT domain, 'cdx', earliest_timestamp,
  json_object('earliest_timestamp', earliest_timestamp, 'snapshot_count', snapshot_count),
  created_at, created_at
FROM cdx_queries;
