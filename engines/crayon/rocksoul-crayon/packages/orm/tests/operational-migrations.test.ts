import { createClient } from '@libsql/client';
import { strict as assert } from 'node:assert';
import { ensureOperationalTables } from '../src/operational-migrations.js';

const client = createClient({ url: 'file::memory:' });
await client.execute('PRAGMA foreign_keys = ON');
await client.execute('CREATE TABLE projects (id TEXT PRIMARY KEY)');
await client.execute('CREATE TABLE users (id TEXT PRIMARY KEY)');
await client.execute("CREATE TABLE tasks (id TEXT PRIMARY KEY, project_id TEXT, title TEXT NOT NULL, status TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'feature', priority TEXT NOT NULL, assignee_id TEXT, due_date TEXT, description TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, created_by TEXT, updated_by TEXT)");
await client.execute('CREATE TABLE project_tasks (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL, priority TEXT NOT NULL, assignee_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)');
await client.execute('CREATE TABLE notifications (id TEXT PRIMARY KEY, user_id TEXT, kind TEXT, title TEXT NOT NULL, message TEXT NOT NULL, href TEXT, read_at TEXT, created_at TEXT NOT NULL)');
await client.execute("INSERT INTO project_tasks VALUES ('legacy','project','Legacy','in progress','important',NULL,'2026-01-01','2026-01-01')");
await client.execute("INSERT INTO users VALUES ('operator')");
await client.execute("INSERT INTO notifications VALUES ('legacy-notification','operator','info','Legacy','Body',NULL,NULL,'2026-01-01')");
await ensureOperationalTables(client); await ensureOperationalTables(client);
const task = await client.execute("SELECT status, priority FROM tasks WHERE id = 'legacy'");
assert.deepEqual(task.rows[0], { status: 'in_progress', priority: 'high' });
assert.equal((await client.execute('SELECT count(*) AS count FROM tasks')).rows[0]?.count, 1);
assert.equal((await client.execute("SELECT count(*) AS count FROM notification_recipients WHERE notification_id = 'legacy-notification' AND user_id = 'operator'")).rows[0]?.count, 1);
for (const table of ['resource_references', 'research_cases', 'review_items', 'files', 'research_work_items', 'annotations', 'operational_activities']) {
  assert.equal((await client.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`)).rows.length, 1, `${table} must exist`);
}
assert.equal((await client.execute('PRAGMA integrity_check')).rows[0]?.integrity_check, 'ok');
assert.equal((await client.execute('PRAGMA foreign_key_check')).rows.length, 0);
client.close();
