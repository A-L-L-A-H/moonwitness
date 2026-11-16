import { createDatabase } from './client.js';
import { seedBase } from '@rocksoul/orm-base';
import { seedProjects } from '@rocksoul/orm-project';
import { seedTasks } from '@rocksoul/orm-task';
import { seedCalendars } from '@rocksoul/orm-calendar';
import { seedChat } from '@rocksoul/orm-chat';
import { seedFaq } from '@rocksoul/orm-faq';
import { seedLanding } from '@rocksoul/orm-landing';
import { seedMail } from '@rocksoul/orm-mail';
import { seedServices } from '@rocksoul/orm-services';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureOperationalTables } from './operational-migrations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function ensureTables(client: any): Promise<void> {
  await client.execute(`CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, currency TEXT NOT NULL DEFAULT 'USD', is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, created_by TEXT, updated_by TEXT);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, org_id TEXT REFERENCES organizations(id), name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT, avatar TEXT, role TEXT NOT NULL DEFAULT 'user', plan TEXT DEFAULT 'Basic', billing TEXT, status TEXT DEFAULT 'Active', phone TEXT, website TEXT, location TEXT, bio TEXT, company TEXT, timezone TEXT, language TEXT, joined_date TEXT, is_active INTEGER NOT NULL DEFAULT 1, last_login_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, created_by TEXT, updated_by TEXT);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS organization_members (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL DEFAULT 'member', created_at TEXT NOT NULL, UNIQUE (organization_id, user_id));`);

  // Safe migration for existing tables
  const userColumns = ['password_hash TEXT', 'avatar TEXT', 'plan TEXT DEFAULT "Basic"', 'billing TEXT', 'status TEXT DEFAULT "Active"', 'phone TEXT', 'website TEXT', 'location TEXT', 'bio TEXT', 'company TEXT', 'timezone TEXT', 'language TEXT', 'joined_date TEXT', 'last_login_at TEXT'];
  for (const col of userColumns) {
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN ${col};`);
    } catch {}
  }

  await client.execute(`CREATE TABLE IF NOT EXISTS app_settings (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE, category TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, is_public INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, created_by TEXT, updated_by TEXT);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS api_keys (id TEXT PRIMARY KEY, name TEXT NOT NULL, key_hash TEXT NOT NULL UNIQUE, key_prefix TEXT NOT NULL, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE, scopes TEXT NOT NULL DEFAULT '["*"]', expires_at TEXT, last_used_at TEXT, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, created_by TEXT, updated_by TEXT);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS user_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, token_hash TEXT NOT NULL UNIQUE, ip_address TEXT, user_agent TEXT, expires_at TEXT NOT NULL, is_revoked INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS execution_records (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, session_id TEXT NOT NULL, capability_id TEXT NOT NULL, idempotency_key TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ACCEPTED', input_json TEXT NOT NULL, result_json TEXT, error_code TEXT, created_at TEXT NOT NULL, completed_at TEXT, UNIQUE(actor_id, capability_id, idempotency_key));`);
  await client.execute(`CREATE TABLE IF NOT EXISTS aep_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, resume_token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, replay_until TEXT NOT NULL, last_seen_at TEXT NOT NULL, is_revoked INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS system_logs (id TEXT PRIMARY KEY, level TEXT NOT NULL DEFAULT 'info', message TEXT NOT NULL, req_id TEXT, method TEXT, url TEXT, status_code INTEGER, response_time INTEGER, context TEXT, created_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, org_id TEXT REFERENCES organizations(id), name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, description TEXT, status TEXT NOT NULL DEFAULT 'planned', owner_id TEXT REFERENCES users(id), budget INTEGER DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, created_by TEXT, updated_by TEXT);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS project_tasks (id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'todo', priority TEXT NOT NULL DEFAULT 'medium', assignee_id TEXT REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, project_id TEXT REFERENCES projects(id) ON DELETE CASCADE, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'todo', category TEXT NOT NULL DEFAULT 'feature', priority TEXT NOT NULL DEFAULT 'medium', assignee_id TEXT REFERENCES users(id), due_date TEXT, description TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, created_by TEXT, updated_by TEXT);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS calendars (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, color TEXT NOT NULL, visible INTEGER NOT NULL DEFAULT 1, type TEXT NOT NULL DEFAULT 'personal', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS calendar_events (id TEXT PRIMARY KEY, calendar_id TEXT REFERENCES calendars(id) ON DELETE CASCADE, user_id TEXT REFERENCES users(id), title TEXT NOT NULL, description TEXT, date TEXT NOT NULL, time TEXT, duration TEXT, type TEXT NOT NULL DEFAULT 'meeting', attendees TEXT, location TEXT, color TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS chat_conversations (id TEXT PRIMARY KEY, type TEXT NOT NULL DEFAULT 'direct', name TEXT NOT NULL, avatar TEXT, unread_count INTEGER NOT NULL DEFAULT 0, is_pinned INTEGER NOT NULL DEFAULT 0, is_muted INTEGER NOT NULL DEFAULT 0, last_message_content TEXT, last_message_time TEXT, created_by TEXT REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS chat_participants (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT DEFAULT 'member', joined_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE, sender_id TEXT NOT NULL REFERENCES users(id), content TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'text', is_edited INTEGER NOT NULL DEFAULT 0, reply_to_id TEXT, reactions TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS faq_categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL, order_index INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS faqs (id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES faq_categories(id) ON DELETE CASCADE, question TEXT NOT NULL, answer TEXT NOT NULL, is_published INTEGER NOT NULL DEFAULT 1, order_index INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS landing_testimonials (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, image TEXT, quote TEXT NOT NULL, rating INTEGER NOT NULL DEFAULT 5, company TEXT, is_featured INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS landing_leads (id TEXT PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS landing_features (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, icon TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'main', order_index INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS mails (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL, text TEXT NOT NULL, folder TEXT NOT NULL DEFAULT 'inbox', read INTEGER NOT NULL DEFAULT 0, labels TEXT, date TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS pricing_plans (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, price TEXT NOT NULL, frequency TEXT NOT NULL DEFAULT '/month', features TEXT NOT NULL, popular INTEGER NOT NULL DEFAULT 0, current INTEGER NOT NULL DEFAULT 0, order_index INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS pricing_features (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, icon TEXT NOT NULL, order_index INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  await client.execute(`CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, kind TEXT NOT NULL DEFAULT 'info', title TEXT NOT NULL, message TEXT NOT NULL, href TEXT, read_at TEXT, created_at TEXT NOT NULL);`);
  await ensureOperationalTables(client);
}

/**
 * Orchestrator: Menjalankan seeder dari masing-masing paket modular secara terprogram
 */
export async function runSeed(dbUrl?: string): Promise<void> {
  const rootDir = resolve(__dirname, '../../../');
  let targetUrl = dbUrl || process.env.DATABASE_URL || `file:${resolve(rootDir, 'data/sqlite.db')}`;
  if (targetUrl.startsWith('file:.')) {
    targetUrl = `file:${resolve(process.cwd(), targetUrl.replace(/^file:[\\/.]*/, ''))}`;
  }

  const { client } = createDatabase(targetUrl);
  console.log('🌱 [Seed Orchestrator] Running modular seeders on:', targetUrl);

  await ensureTables(client);

  const context = { now: new Date().toISOString() };

  // 1. Base (Organizations, Users, Settings)
  await seedBase(client, context);

  // 2. Projects
  await seedProjects(client, context);

  // 3. Tasks (Relates to Projects & Users)
  await seedTasks(client, context);

  // 4. Calendars & Events
  await seedCalendars(client, context);

  // 5. Chat Conversations & Messages
  await seedChat(client, context);

  // 6. FAQ Categories & FAQs
  await seedFaq(client, context);

  // 7. Landing Testimonials, Leads, Features
  await seedLanding(client, context);

  // 8. Mailbox
  await seedMail(client, context);

  // 9. Pricing Plans & Features
  await seedServices(client, context);

  console.log('🎉 [Seed Orchestrator] All modular seeders executed successfully!');
  client.close();
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ [Seed Orchestrator] Error running seed:', err);
      process.exit(1);
    });
}
