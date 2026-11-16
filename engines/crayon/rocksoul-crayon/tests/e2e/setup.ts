import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, unlinkSync } from 'node:fs';
import { createDatabase, ensureTables, hashApiKey, hashPassword, apiKeys, users, organizations, projects, tasks, chatConversations, chatMessages, mails, eq } from '../../packages/orm/dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '../../');

export const TEST_DB_PATH = resolve(ROOT_DIR, 'data/test.db');
export const TEST_DB_URL = `file:${TEST_DB_PATH}`;
export const TEST_AI_DB_PATH = resolve(ROOT_DIR, 'data/test_ai.db');
export const TEST_AI_DB_URL = `file:${TEST_AI_DB_PATH}`;

// Ensure test environment variables are set before any server import
process.env.DATABASE_URL = TEST_DB_URL;
process.env.NODE_ENV = 'test';
process.env.PORT = '3099';
process.env.LOG_LEVEL = 'warn';

// Predefined deterministic credentials
export const TEST_FIXTURES = {
  admin: {
    id: 'usr_test_admin',
    name: 'E2E Admin User',
    email: 'e2e_admin@rocksoul.test',
    password: 'Password123!',
    role: 'admin' as const,
  },
  manager: {
    id: 'usr_test_manager',
    name: 'E2E Project Manager',
    email: 'e2e_manager@rocksoul.test',
    password: 'Password123!',
    role: 'manager' as const,
  },
  developer: {
    id: 'usr_test_developer',
    name: 'E2E Developer',
    email: 'e2e_developer@rocksoul.test',
    password: 'Password123!',
    role: 'user' as const,
  },
  org: {
    id: 'org_test_rocksoul',
    name: 'Rocksoul E2E Test Org',
    code: 'ROCKSOUL_TEST',
  },
  apiKey: {
    raw: 'rock_test_e2e_master_key_99999',
    prefix: 'rock_test',
    id: 'key_test_e2e_master',
  },
  project: {
    id: 'proj_e2e_alpha',
    name: 'Alpha E2E Test Project',
    code: 'ALPHA_TEST',
    description: 'Isolated test project for E2E verification',
    status: 'active',
  },
  task: {
    id: 'task_e2e_01',
    title: 'Implement Metadata UI Integration',
    status: 'todo',
    category: 'feature',
    priority: 'high',
  },
  chat: {
    id: 'chat_e2e_thread_01',
    name: 'E2E Test Discussion',
    type: 'group',
  },
  mail: {
    id: 'mail_e2e_01',
    name: 'Test Inbound Mail',
    email: 'e2e_inbound@rocksoul.test',
    subject: 'Verification Notification',
    text: 'Automated test mail content',
    folder: 'inbox',
  },
};

/**
 * Initializes the isolated test database: creates tables and deterministic fixtures
 */
export async function setupTestEnvironment(cleanBefore = false) {
  if (cleanBefore && existsSync(TEST_DB_PATH)) {
    try {
      unlinkSync(TEST_DB_PATH);
    } catch {}
  }
  if (cleanBefore && existsSync(TEST_AI_DB_PATH)) {
    try {
    unlinkSync(TEST_AI_DB_PATH);
    } catch {}
  }

  const { client, db } = createDatabase(TEST_DB_URL);

  // 1. Ensure all 22 tables exist
  await ensureTables(client);

  // 2. Insert Organization
  const now = new Date().toISOString();
  await db
    .insert(organizations)
    .values({
      id: TEST_FIXTURES.org.id,
      name: TEST_FIXTURES.org.name,
      code: TEST_FIXTURES.org.code,
      currency: 'USD',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();

  // 3. Insert Users with hashed passwords
  for (const u of [TEST_FIXTURES.admin, TEST_FIXTURES.manager, TEST_FIXTURES.developer]) {
    const passwordHash = await hashPassword(u.password);
    await db
      .insert(users)
      .values({
        id: u.id,
        orgId: TEST_FIXTURES.org.id,
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  // 4. Insert Master Test API Key
  const hashedKey = hashApiKey(TEST_FIXTURES.apiKey.raw);
  await db
    .insert(apiKeys)
    .values({
      id: TEST_FIXTURES.apiKey.id,
      name: 'Master E2E Verification Key',
      keyPrefix: TEST_FIXTURES.apiKey.prefix,
      keyHash: hashedKey,
      userId: TEST_FIXTURES.admin.id,
      orgId: TEST_FIXTURES.org.id,
      scopes: JSON.stringify(['*']),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();

  client.close();
  return { dbUrl: TEST_DB_URL, fixtures: TEST_FIXTURES };
}

/**
 * Boots the Fastify app against the isolated test database
 */
export async function getTestApp() {
  // Dynamically import buildApp after environment variables are set
  const { buildApp } = await import('../../apps/api/src/app.js');
  const app = await buildApp({ logger: false });
  await app.ready();
  return app;
}

if (process.argv[1]?.includes('setup.ts')) {
  console.log('Initializing isolated test database...');
  setupTestEnvironment(true)
    .then((res) => {
      console.log(`✅ Test environment initialized successfully: ${res.dbUrl}`);
      console.log(`   Admin: ${res.fixtures.admin.email}`);
      console.log(`   API Key: ${res.fixtures.apiKey.raw}`);
    })
    .catch((err) => {
      console.error('❌ Failed to setup test environment:', err);
      process.exit(1);
    });
}
