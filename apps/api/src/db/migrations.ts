/**
 * Database migrations for authentication system
 */

export const authMigrations = [
  {
    id: "001_create_users_and_sessions",
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
        display_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `,
  },
  {
    id: "002_create_bff_oauth_tokens",
    up: `
      CREATE TABLE IF NOT EXISTS bff_oauth_tokens (
        session_id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        id_token TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_bff_oauth_tokens_expires_at ON bff_oauth_tokens(expires_at);
    `,
  },
] as const;

export type AuthMigration = (typeof authMigrations)[number];
