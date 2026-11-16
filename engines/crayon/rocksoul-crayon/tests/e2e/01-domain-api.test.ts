import { setupTestEnvironment, getTestApp, TEST_FIXTURES } from './setup.js';
import { users, projects, tasks, chatConversations, chatMessages, mails, eq } from '../../packages/orm/dist/index.js';

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ id: `TC-${results.length + 1}`, name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✅ [PASS] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ id: `TC-${results.length + 1}`, name, passed: false, error: err.message, durationMs: Date.now() - start });
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export async function runDomainApiTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 03: EXISTING DOMAIN E2E TEST SUITE');
  console.log('======================================================\n');

  await setupTestEnvironment(true);
  const app = await getTestApp();

  let adminAuthToken = '';

  // 1. AUTHENTICATION FLOW
  console.log('--- Subsuite 1: Authentication & User Management ---');
  await test('TC-05: Register new user account via API', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        name: 'New Tester',
        email: 'new_tester@rocksoul.test',
        password: 'ValidPassword123!',
        role: 'user',
      },
    });
    assert(res.statusCode === 201, `Expected 201, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    assert(body.success === true, 'Response success was false');
    assert(body.data.email === 'new_tester@rocksoul.test', 'User email mismatch');
    assert(!body.data.passwordHash, 'passwordHash must never be exposed');

    // DB Verification
    const dbUser = await app.db.select().from(users).where(eq(users.email, 'new_tester@rocksoul.test')).limit(1);
    assert(dbUser.length === 1, 'User row not found in SQLite users table');
  });

  await test('TC-06: Reject duplicate email registration', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        name: 'Duplicate Tester',
        email: 'new_tester@rocksoul.test',
        password: 'ValidPassword123!',
      },
    });
    assert(res.statusCode === 400, `Expected 400, got ${res.statusCode}`);
  });

  await test('TC-07: Login with valid credentials and obtain session token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: TEST_FIXTURES.admin.email,
        password: TEST_FIXTURES.admin.password,
      },
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    assert(!!body.data.token, 'Session token missing in login response');
    assert(body.data.tokenType === 'Bearer', 'Token type must be Bearer');
    adminAuthToken = body.data.token;
  });

  await test('TC-08: Retrieve authenticated profile using Bearer token (/me)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${adminAuthToken}`,
      },
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    assert(body.data.user.email === TEST_FIXTURES.admin.email, 'Profile email mismatch');
    assert(body.data.user.role === 'admin', 'Profile role mismatch');
  });

  await test('TC-09: Reject login with invalid password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: TEST_FIXTURES.admin.email,
        password: 'WrongPassword!',
      },
    });
    assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
  });

  // 2. PROJECT FLOW
  console.log('\n--- Subsuite 2: Projects Domain ---');
  let createdProjectId = '';
  await test('TC-11: Create new project via API and verify SQLite row', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/models/projects',
      headers: {
        'x-api-key': TEST_FIXTURES.apiKey.raw,
      },
      payload: {
        id: TEST_FIXTURES.project.id,
        name: TEST_FIXTURES.project.name,
        code: TEST_FIXTURES.project.code,
        description: TEST_FIXTURES.project.description,
        status: 'planned',
        org_id: TEST_FIXTURES.org.id,
        owner_id: TEST_FIXTURES.admin.id,
        budget: 50000,
      },
    });
    assert(res.statusCode === 201 || res.statusCode === 200, `Expected 201/200, got ${res.statusCode}: ${res.body}`);
    const body = JSON.parse(res.body);
    createdProjectId = body.data.id || TEST_FIXTURES.project.id;

    // Physical DB Verification
    const dbProject = await app.db.select().from(projects).where(eq(projects.id, createdProjectId)).limit(1);
    assert(dbProject.length === 1, 'Project was not persisted to SQLite database');
    assert(dbProject[0].code === TEST_FIXTURES.project.code, 'Project code mismatch in SQLite');
  });

  await test('TC-12: Read project details via GET /api/v1/models/projects/:id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/models/projects/${createdProjectId}`,
      headers: {
        'x-api-key': TEST_FIXTURES.apiKey.raw,
      },
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    assert(body.data.name === TEST_FIXTURES.project.name, 'Project name mismatch');
  });

  await test('TC-13: Update project status and verify in SQLite', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/models/projects/${createdProjectId}`,
      headers: {
        'x-api-key': TEST_FIXTURES.apiKey.raw,
      },
      payload: {
        status: 'active',
        budget: 75000,
      },
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);

    // Verify physical SQLite update
    const dbProject = await app.db.select().from(projects).where(eq(projects.id, createdProjectId)).limit(1);
    assert(dbProject[0].status === 'active', 'Project status was not updated in SQLite');
    assert(dbProject[0].budget === 75000, 'Project budget was not updated in SQLite');
  });

  // 3. TASK FLOW
  console.log('\n--- Subsuite 3: Tasks Domain ---');
  let createdTaskId = '';
  await test('TC-14: Create linked task with project foreign key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/models/tasks',
      headers: {
        'x-api-key': TEST_FIXTURES.apiKey.raw,
      },
      payload: {
        id: TEST_FIXTURES.task.id,
        project_id: createdProjectId,
        title: TEST_FIXTURES.task.title,
        status: 'todo',
        category: TEST_FIXTURES.task.category,
        priority: TEST_FIXTURES.task.priority,
        assignee_id: TEST_FIXTURES.developer.id,
      },
    });
    assert(res.statusCode === 201 || res.statusCode === 200, `Expected 201/200, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    createdTaskId = body.data.id || TEST_FIXTURES.task.id;

    // Physical DB Verification
    const dbTask = await app.db.select().from(tasks).where(eq(tasks.id, createdTaskId)).limit(1);
    assert(dbTask.length === 1, 'Task row not found in SQLite tasks table');
    assert(dbTask[0].projectId === createdProjectId, 'Task projectId foreign key mismatch in DB');
  });

  await test('TC-15: Reject legacy task status and priority vocabulary', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/models/tasks/${createdTaskId}`,
      headers: {
        'x-api-key': TEST_FIXTURES.apiKey.raw,
      },
      payload: {
        status: 'in progress',
        priority: 'urgent',
      },
    });
    assert(res.statusCode === 400, `Expected 400, got ${res.statusCode}`);
  });

  await test('TC-15b: Update task with canonical status and priority', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/models/tasks/${createdTaskId}`,
      headers: { 'x-api-key': TEST_FIXTURES.apiKey.raw },
      payload: { status: 'in_progress', priority: 'critical' },
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);

    const dbTask = await app.db.select().from(tasks).where(eq(tasks.id, createdTaskId)).limit(1);
    assert(dbTask[0].status === 'in_progress', 'Task status was not updated in SQLite');
    assert(dbTask[0].priority === 'critical', 'Task priority was not updated in SQLite');
  });

  await test('TC-16: List tasks with search filter', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/models/tasks?search=Metadata',
      headers: {
        'x-api-key': TEST_FIXTURES.apiKey.raw,
      },
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    assert(body.data.items.length >= 1, 'Expected at least 1 matching task');
  });

  // 4. CHAT FLOW
  console.log('\n--- Subsuite 4: Chat Domain ---');
  let createdConvId = '';
  await test('TC-17: Create conversation and verify row in SQLite', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/models/chat_conversations',
      headers: {
        'x-api-key': TEST_FIXTURES.apiKey.raw,
      },
      payload: {
        id: TEST_FIXTURES.chat.id,
        name: TEST_FIXTURES.chat.name,
        type: TEST_FIXTURES.chat.type,
        created_by: TEST_FIXTURES.admin.id,
      },
    });
    assert(res.statusCode === 201 || res.statusCode === 200, `Expected 201/200, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    createdConvId = body.data.id || TEST_FIXTURES.chat.id;

    const dbConv = await app.db.select().from(chatConversations).where(eq(chatConversations.id, createdConvId)).limit(1);
    assert(dbConv.length === 1, 'Conversation row not found in SQLite');
  });

  await test('TC-18: Post chat message and verify relationship in SQLite', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/models/chat_messages',
      headers: {
        'x-api-key': TEST_FIXTURES.apiKey.raw,
      },
      payload: {
        id: 'msg_e2e_01',
        conversation_id: createdConvId,
        sender_id: TEST_FIXTURES.admin.id,
        content: 'Hello E2E Chat Verification!',
        type: 'text',
      },
    });
    assert(res.statusCode === 201 || res.statusCode === 200, `Expected 201/200, got ${res.statusCode}`);

    const dbMsg = await app.db.select().from(chatMessages).where(eq(chatMessages.id, 'msg_e2e_01')).limit(1);
    assert(dbMsg.length === 1, 'Message row not found in SQLite chat_messages table');
    assert(dbMsg[0].content === 'Hello E2E Chat Verification!', 'Message content mismatch in SQLite');
  });

  // 5. MAIL FLOW
  console.log('\n--- Subsuite 5: Mail Domain ---');
  let createdMailId = '';
  await test('TC-19: Compose & store mail and verify in SQLite', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/models/mails',
      headers: {
        'x-api-key': TEST_FIXTURES.apiKey.raw,
      },
      payload: {
        id: TEST_FIXTURES.mail.id,
        user_id: TEST_FIXTURES.admin.id,
        name: TEST_FIXTURES.mail.name,
        email: TEST_FIXTURES.mail.email,
        subject: TEST_FIXTURES.mail.subject,
        text: TEST_FIXTURES.mail.text,
        folder: 'inbox',
        read: 0,
        date: new Date().toISOString(),
      },
    });
    assert(res.statusCode === 201 || res.statusCode === 200, `Expected 201/200, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    createdMailId = body.data.id || TEST_FIXTURES.mail.id;

    const dbMail = await app.db.select().from(mails).where(eq(mails.id, createdMailId)).limit(1);
    assert(dbMail.length === 1, 'Mail row not found in SQLite mails table');
  });

  await test('TC-20: Update mail folder to "archive" and verify in SQLite', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/models/mails/${createdMailId}`,
      headers: {
        'x-api-key': TEST_FIXTURES.apiKey.raw,
      },
      payload: {
        folder: 'archive',
        read: 1,
      },
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);

    const dbMail = await app.db.select().from(mails).where(eq(mails.id, createdMailId)).limit(1);
    assert(dbMail[0].folder === 'archive', 'Mail folder was not updated in SQLite');
    // Drizzle boolean mode maps SQLite integer (0/1) to JS boolean
    assert(dbMail[0].read === true || (dbMail[0].read as unknown) === 1, 'Mail read status was not updated in SQLite');
  });

  await app.close();

  console.log('\n======================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`📊 PHASE 03 RESULT: ${passedCount} Passed, ${failedCount} Failed (Total: ${results.length})`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (process.argv[1]?.includes('01-domain-api.test.ts')) {
  runDomainApiTests().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
