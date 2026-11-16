import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { createDatabase, ensureOperationalTables, runSeed, type Database, type DbConnection } from '@rocksoul/orm';
import { env } from '../config/env.js';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { startAepOutboxDispatcher } from '../services/aep-event-outbox.js';
import { aepEventHub } from '../services/aep-events.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
    dbClient: DbConnection['client'];
  }
}

async function dbPlugin(app: FastifyInstance): Promise<void> {
  // Pastikan folder data untuk file SQLite sudah ada
  if (env.DATABASE_URL.startsWith('file:')) {
    const filePath = env.DATABASE_URL.replace('file:', '');
    const dir = dirname(filePath);
    if (dir && dir !== '.' && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const { client, db } = createDatabase(env.DATABASE_URL);

  // ==========================================
  // 1. Core Models DDL (@rocksoul/orm-base)
  // ==========================================

  await client.execute(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      currency TEXT NOT NULL DEFAULT 'USD',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT,
      updated_by TEXT
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      org_id TEXT REFERENCES organizations(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      plan TEXT DEFAULT 'Basic',
      billing TEXT,
      status TEXT DEFAULT 'Active',
      phone TEXT,
      website TEXT,
      location TEXT,
      bio TEXT,
      company TEXT,
      timezone TEXT,
      language TEXT,
      joined_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT,
      updated_by TEXT
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS organization_members (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL,
      UNIQUE (organization_id, user_id)
    );
  `);

  // Safe ALTER TABLE migrations for existing databases
  const userColumnsToAdd = [
    'password_hash TEXT',
    'avatar TEXT',
    'plan TEXT DEFAULT "Basic"',
    'billing TEXT',
    'status TEXT DEFAULT "Active"',
    'phone TEXT',
    'website TEXT',
    'location TEXT',
    'bio TEXT',
    'company TEXT',
    'timezone TEXT',
    'language TEXT',
    'joined_date TEXT',
    'last_login_at TEXT',
  ];
  for (const colDef of userColumnsToAdd) {
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN ${colDef};`);
    } catch {}
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      is_public INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT,
      updated_by TEXT
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      key_prefix TEXT NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
      scopes TEXT NOT NULL DEFAULT '["*"]',
      expires_at TEXT,
      last_used_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT,
      updated_by TEXT
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      ip_address TEXT,
      user_agent TEXT,
      expires_at TEXT NOT NULL,
      is_revoked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      created_at TEXT NOT NULL
    );
  `);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens (user_id, created_at);`);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS execution_records (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL,
      capability_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACCEPTED',
      input_json TEXT NOT NULL,
      result_json TEXT,
      error_code TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      UNIQUE(actor_id, capability_id, idempotency_key)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS aep_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resume_token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      replay_until TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      is_revoked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id TEXT PRIMARY KEY,
      level TEXT NOT NULL DEFAULT 'info',
      message TEXT NOT NULL,
      req_id TEXT,
      method TEXT,
      url TEXT,
      status_code INTEGER,
      response_time INTEGER,
      context TEXT,
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      href TEXT,
      read_at TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // ==========================================
  // 2. Productivity Models DDL
  // ==========================================

  await client.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      org_id TEXT REFERENCES organizations(id),
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'planned',
      owner_id TEXT REFERENCES users(id),
      budget INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT,
      updated_by TEXT
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS project_tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      assignee_id TEXT REFERENCES users(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo',
      category TEXT NOT NULL DEFAULT 'feature',
      priority TEXT NOT NULL DEFAULT 'medium',
      assignee_id TEXT REFERENCES users(id),
      due_date TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT,
      updated_by TEXT
    );
  `);
  await ensureOperationalTables(client);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS calendars (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      visible INTEGER NOT NULL DEFAULT 1,
      type TEXT NOT NULL DEFAULT 'personal',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      calendar_id TEXT REFERENCES calendars(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      time TEXT,
      duration TEXT,
      type TEXT NOT NULL DEFAULT 'meeting',
      attendees TEXT,
      location TEXT,
      color TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // ==========================================
  // 3. Communication Models DDL
  // ==========================================

  await client.execute(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'direct',
      name TEXT NOT NULL,
      avatar TEXT,
      unread_count INTEGER NOT NULL DEFAULT 0,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_muted INTEGER NOT NULL DEFAULT 0,
      last_message_content TEXT,
      last_message_time TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS chat_participants (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member',
      joined_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      is_edited INTEGER NOT NULL DEFAULT 0,
      reply_to_id TEXT,
      reactions TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS mails (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      text TEXT NOT NULL,
      folder TEXT NOT NULL DEFAULT 'inbox',
      read INTEGER NOT NULL DEFAULT 0,
      labels TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // ==========================================
  // 4. Marketing & Content Models DDL
  // ==========================================

  await client.execute(`
    CREATE TABLE IF NOT EXISTS faq_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES faq_categories(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS landing_testimonials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      image TEXT,
      quote TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      company TEXT,
      is_featured INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS landing_leads (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS landing_features (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'main',
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // ==========================================
  // 5. Services & Pricing Models DDL
  // ==========================================

  await client.execute(`
    CREATE TABLE IF NOT EXISTS pricing_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price TEXT NOT NULL,
      frequency TEXT NOT NULL DEFAULT '/month',
      features TEXT NOT NULL,
      popular INTEGER NOT NULL DEFAULT 0,
      current INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS pricing_features (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Transactional outbox foundation for durable AEP application events.
  // Mutation paths must adopt the same transaction before the hub is switched
  // from process-local publication to outbox dispatch.
  await client.execute(`
    CREATE TABLE IF NOT EXISTS aep_event_outbox (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL UNIQUE,
      event_type TEXT NOT NULL,
      resource TEXT NOT NULL,
      record_id TEXT,
      principal_id TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      published_at TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      claim_token TEXT,
      claimed_at TEXT
    );
  `);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_aep_event_outbox_pending ON aep_event_outbox (published_at, created_at);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_aep_event_outbox_replay ON aep_event_outbox (created_at, event_id);`);
  await client.execute(`ALTER TABLE aep_event_outbox ADD COLUMN claim_token TEXT;`).catch(() => undefined);
  await client.execute(`ALTER TABLE aep_event_outbox ADD COLUMN claimed_at TEXT;`).catch(() => undefined);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS aep_event_log (
      sequence INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL UNIQUE,
      event_type TEXT NOT NULL,
      resource TEXT NOT NULL,
      record_id TEXT,
      principal_id TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_aep_event_log_resource ON aep_event_log (resource, sequence);`);
  await client.execute(`ALTER TABLE aep_event_log ADD COLUMN principal_id TEXT;`).catch(() => undefined);
  await aepEventHub.initialize(client);
  const stopAepOutboxDispatcher = startAepOutboxDispatcher(client);

  // Auto-seed initial data if tasks or users are empty
  try {
    const userCountRes = await client.execute('SELECT count(*) as count FROM users;');
    const userCount = Number(userCountRes.rows[0]?.count || 0);
    if (userCount <= 1) {
      app.log.info('Fresh database detected. Seeding relational data from apps/web...');
      await runSeed(env.DATABASE_URL);
    }
  } catch (err) {
    app.log.warn({ err }, 'Failed checking/running auto-seed');
  }

  app.decorate('db', db);
  app.decorate('dbClient', client);

  app.addHook('onClose', async () => {
    stopAepOutboxDispatcher();
    app.log.info('Closing database connection...');
    client.close();
  });
}

export const registerDb = fp(dbPlugin, {
  name: 'rocksoul-db',
});
