CREATE TABLE IF NOT EXISTS igate_nodes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  category TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS igate_probe_events (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  ok INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  actor_sub TEXT NOT NULL,
  checked_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_igate_probe_checked ON igate_probe_events (checked_at);
