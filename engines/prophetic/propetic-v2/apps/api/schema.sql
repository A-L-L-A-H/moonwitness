PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS prophets (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  quranic_name TEXT NOT NULL,
  rid_root TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK(json_valid(payload_json))
) STRICT;

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK(json_valid(payload_json))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_prophets_rid_root ON prophets(rid_root);
CREATE INDEX IF NOT EXISTS idx_prophets_display_name ON prophets(display_name);
CREATE INDEX IF NOT EXISTS idx_documents_kind ON documents(kind);
