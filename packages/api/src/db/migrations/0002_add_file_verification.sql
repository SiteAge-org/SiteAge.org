-- Migration: 0002_add_file_verification
-- Add 'well_known' verification method support
-- SQLite doesn't support ALTER CHECK, so we recreate the table

CREATE TABLE verifications_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id INTEGER NOT NULL REFERENCES domains(id),
  email TEXT NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('dns_txt', 'meta_tag', 'well_known')),
  token TEXT NOT NULL,
  magic_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  last_attempt_at TEXT,
  verified_at TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO verifications_new SELECT * FROM verifications;

DROP TABLE verifications;

ALTER TABLE verifications_new RENAME TO verifications;

CREATE INDEX idx_verifications_domain_id ON verifications(domain_id);
CREATE INDEX idx_verifications_token ON verifications(token);
CREATE INDEX idx_verifications_magic_key ON verifications(magic_key);
