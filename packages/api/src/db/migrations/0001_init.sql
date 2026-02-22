-- Migration: 0001_init
-- Create all tables for SiteAge

CREATE TABLE IF NOT EXISTS domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL UNIQUE,
  birth_at TEXT,
  death_at TEXT,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK(status IN ('active', 'unreachable', 'dead', 'unknown')),
  verification_status TEXT NOT NULL DEFAULT 'detected' CHECK(verification_status IN ('detected', 'pending', 'verified')),
  verified_birth_at TEXT,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  badge_embedded INTEGER NOT NULL DEFAULT 0,
  last_checked_at TEXT,
  last_alive_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_domains_status ON domains(status);
CREATE INDEX idx_domains_verification_status ON domains(verification_status);
CREATE INDEX idx_domains_last_checked_at ON domains(last_checked_at);
CREATE INDEX idx_domains_consecutive_failures ON domains(consecutive_failures);

CREATE TABLE IF NOT EXISTS verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id INTEGER NOT NULL REFERENCES domains(id),
  email TEXT NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('dns_txt', 'meta_tag')),
  token TEXT NOT NULL,
  magic_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  last_attempt_at TEXT,
  verified_at TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_verifications_domain_id ON verifications(domain_id);
CREATE INDEX idx_verifications_token ON verifications(token);
CREATE INDEX idx_verifications_magic_key ON verifications(magic_key);

CREATE TABLE IF NOT EXISTS evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id INTEGER NOT NULL REFERENCES domains(id),
  type TEXT NOT NULL CHECK(type IN ('whois', 'git_history', 'dns_record', 'other')),
  claimed_at TEXT NOT NULL,
  description TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);

CREATE INDEX idx_evidence_domain_id ON evidence(domain_id);
CREATE INDEX idx_evidence_status ON evidence(status);

CREATE TABLE IF NOT EXISTS health_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id INTEGER NOT NULL REFERENCES domains(id),
  status_code INTEGER,
  response_time_ms INTEGER,
  check_type TEXT NOT NULL CHECK(check_type IN ('priority', 'random', 'manual')),
  badge_detected INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_health_checks_domain_id ON health_checks(domain_id);

CREATE TABLE IF NOT EXISTS cdx_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL,
  earliest_timestamp TEXT,
  snapshot_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_cdx_queries_domain ON cdx_queries(domain);

CREATE TABLE IF NOT EXISTS stats_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total_domains INTEGER NOT NULL DEFAULT 0,
  percentile_data TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
