-- Migration: 0003_expand_evidence_types
-- Add third-party evidence types: product_hunt, hacker_news, web_archive, press_coverage
-- SQLite doesn't support ALTER CHECK, so we recreate the table

CREATE TABLE evidence_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id INTEGER NOT NULL REFERENCES domains(id),
  type TEXT NOT NULL CHECK(type IN ('whois', 'git_history', 'dns_record', 'product_hunt', 'hacker_news', 'web_archive', 'press_coverage', 'other')),
  claimed_at TEXT NOT NULL,
  description TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);

INSERT INTO evidence_new SELECT * FROM evidence;

DROP TABLE evidence;

ALTER TABLE evidence_new RENAME TO evidence;

CREATE INDEX idx_evidence_domain_id ON evidence(domain_id);
CREATE INDEX idx_evidence_status ON evidence(status);
