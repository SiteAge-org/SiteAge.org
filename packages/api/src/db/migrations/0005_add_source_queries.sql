CREATE TABLE IF NOT EXISTS source_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL,
  source TEXT NOT NULL,
  earliest_date TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  raw_data TEXT NOT NULL DEFAULT '{}',
  error TEXT,
  queried_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_source_queries_domain ON source_queries(domain);
CREATE INDEX idx_source_queries_domain_source ON source_queries(domain, source);
