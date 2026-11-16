CREATE TABLE IF NOT EXISTS mid_signing_keys (
  kid TEXT PRIMARY KEY,
  public_jwk_json TEXT NOT NULL,
  encrypted_private_jwk TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mid_clients (
  client_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  redirect_uris_json TEXT NOT NULL,
  allowed_scopes_json TEXT NOT NULL,
  client_type TEXT NOT NULL CHECK (client_type IN ('public', 'confidential')),
  client_secret_hash TEXT,
  first_party INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mid_auth_codes (
  code_hash TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  redirect_uri TEXT NOT NULL,
  scope TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  code_challenge_method TEXT NOT NULL,
  nonce TEXT,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mid_refresh_tokens (
  token_hash TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  scope TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  replaced_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mid_audit_logs (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_user_id INTEGER,
  client_id TEXT,
  detail_json TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mid_refresh_family ON mid_refresh_tokens (family_id);
CREATE INDEX IF NOT EXISTS idx_mid_audit_created ON mid_audit_logs (created_at);
