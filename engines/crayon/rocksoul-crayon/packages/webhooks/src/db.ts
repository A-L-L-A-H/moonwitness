import Database from 'better-sqlite3'; import { mkdirSync } from 'node:fs'; import { dirname } from 'node:path';
export class WebhookDb {
  readonly db: Database.Database;
  constructor(url: string) { const file = url.replace(/^file:/, ''); mkdirSync(dirname(file), { recursive: true }); this.db = new Database(file); for (const p of ['journal_mode = WAL','synchronous = NORMAL','foreign_keys = ON','busy_timeout = 5000']) this.db.pragma(p); this.migrate(); }
  private migrate() { this.db.exec(`CREATE TABLE IF NOT EXISTS webhook_endpoints (id TEXT PRIMARY KEY, owner_type TEXT NOT NULL, owner_id TEXT NOT NULL, name TEXT NOT NULL, url TEXT NOT NULL, signing_mode TEXT NOT NULL DEFAULT 'standard', secret TEXT, enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS webhook_subscriptions (id TEXT PRIMARY KEY, endpoint_id TEXT NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE, event_pattern TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(endpoint_id,event_pattern));
CREATE TABLE IF NOT EXISTS webhook_events (id TEXT PRIMARY KEY, event_type TEXT NOT NULL, payload_json TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS webhook_deliveries (id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES webhook_events(id), endpoint_id TEXT NOT NULL REFERENCES webhook_endpoints(id), status TEXT NOT NULL, next_attempt_at TEXT, attempt_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, completed_at TEXT, UNIQUE(event_id,endpoint_id));
CREATE TABLE IF NOT EXISTS webhook_attempts (id TEXT PRIMARY KEY, delivery_id TEXT NOT NULL REFERENCES webhook_deliveries(id) ON DELETE CASCADE, attempt INTEGER NOT NULL, request_timestamp TEXT NOT NULL, response_status INTEGER, duration_ms INTEGER, error_code TEXT, error_summary TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS webhook_ingress (id TEXT PRIMARY KEY, provider TEXT NOT NULL, external_event_id TEXT NOT NULL, binding_id TEXT NOT NULL, received_at TEXT NOT NULL, verified_at TEXT, payload_hash TEXT NOT NULL, execution_id TEXT, status TEXT NOT NULL, UNIQUE(provider,external_event_id,binding_id));
CREATE INDEX IF NOT EXISTS webhook_deliveries_due ON webhook_deliveries(status,next_attempt_at); CREATE INDEX IF NOT EXISTS webhook_subscriptions_pattern ON webhook_subscriptions(event_pattern);`); }
  close(){ this.db.close(); }
}
