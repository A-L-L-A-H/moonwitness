import { setupTestEnvironment, getTestApp, TEST_FIXTURES } from './setup.js';

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

export async function runMetadataTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 04: METADATA & SECURITY TEST SUITE');
  console.log('======================================================\n');

  await setupTestEnvironment(false);
  const app = await getTestApp();

  // 1. MODEL REGISTRY
  console.log('--- Subsuite 1: Model Registry & Metadata Introspection ---');

  await test('TC-21: Model registry lists all registered models', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/models',
      headers: { 'x-api-key': TEST_FIXTURES.apiKey.raw },
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    assert(Array.isArray(body.data), 'Registry data must be an array');
    assert(body.data.length > 5, 'Expected at least 5 registered models');
    const modelNames = body.data.map((m: any) => m.name);
    assert(modelNames.includes('users'), 'users model must be registered');
    assert(modelNames.includes('projects'), 'projects model must be registered');
    assert(modelNames.includes('tasks'), 'tasks model must be registered');
  });

  await test('TC-22: Auto-generated navigation menu is hierarchical and non-empty', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/models/menu',
      headers: { 'x-api-key': TEST_FIXTURES.apiKey.raw },
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    assert(typeof body.data === 'object', 'Menu data must be an object');
    const groups = Object.keys(body.data);
    assert(groups.length > 0, 'Menu must have at least one group');
  });

  await test('TC-23: Task model metadata returns UI schema with columns, search fields', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/models/tasks/metadata',
      headers: { 'x-api-key': TEST_FIXTURES.apiKey.raw },
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    const meta = body.data;
    assert(meta.name === 'tasks', 'Metadata name must be tasks');
    assert(meta.primaryKey === 'id', 'Metadata primaryKey must be id');
    assert(Array.isArray(meta.searchableFields), 'searchableFields must be an array');
    assert(Array.isArray(meta.ui?.table?.columns), 'UI table columns must be an array');
    assert(meta.ui.table.columns.length > 0, 'UI table must have at least one column');
  });

  await test('TC-24: Unknown model metadata returns 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/models/nonexistent_model/metadata',
      headers: { 'x-api-key': TEST_FIXTURES.apiKey.raw },
    });
    assert(res.statusCode === 404, `Expected 404, got ${res.statusCode}`);
  });

  // 2. SECURITY: AUTHENTICATION ENFORCEMENT
  console.log('\n--- Subsuite 2: Authentication & Authorization Security ---');

  await test('TC-25: Unauthenticated request to /api/v1/models is rejected with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/models',
    });
    assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
  });

  await test('TC-26: Unauthenticated request to /api/v1/ai/agents is rejected with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/ai/agents',
    });
    assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
  });

  await test('TC-27: Invalid Bearer token is rejected with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: 'Bearer invalid_fake_token_000000' },
    });
    assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
  });

  await test('TC-28: Invalid API key is rejected with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/models/tasks',
      headers: { 'x-api-key': 'rock_fake_invalid_key_00000' },
    });
    assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
  });

  // 3. INPUT VALIDATION & ERROR HANDLING
  console.log('\n--- Subsuite 3: Input Validation & Error Handling ---');

  await test('TC-29: Empty/invalid registration request returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: { name: 'A', email: 'notanemail' }, // missing password, invalid email
    });
    assert(res.statusCode === 400, `Expected 400, got ${res.statusCode}`);
  });

  await test('TC-30: Invalid JSON AI chat body returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/chat',
      headers: {
        'x-api-key': TEST_FIXTURES.apiKey.raw,
        'content-type': 'application/json',
      },
      payload: { prompt: '' }, // empty prompt should fail Zod min(1)
    });
    assert(res.statusCode === 400, `Expected 400, got ${res.statusCode}`);
  });

  await test('TC-31: GET non-existent model record returns 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/models/tasks/nonexistent_id_xyz',
      headers: { 'x-api-key': TEST_FIXTURES.apiKey.raw },
    });
    assert(res.statusCode === 404, `Expected 404, got ${res.statusCode}`);
  });

  // 4. METADATA SECURITY: Prevent executable code injection via field values
  console.log('\n--- Subsuite 4: Metadata & Payload Injection Security ---');

  await test('TC-32: XSS-style script tag in task title is stored as plain text (not executed)', async () => {
    const maliciousTitle = '<script>alert("XSS")</script>';
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/models/tasks',
      headers: { 'x-api-key': TEST_FIXTURES.apiKey.raw },
      payload: {
        title: maliciousTitle,
        status: 'todo',
        category: 'feature',
        priority: 'low',
      },
    });
    // The API should accept it (sanitization happens at render layer)
    // but the stored value must be the raw string, not executed code
    assert(res.statusCode === 201, `Expected 201, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    assert(body.data.title === maliciousTitle, 'Stored value must preserve raw input, not execute it');
  });

  await test('TC-33: SQL injection-style characters in search are handled safely', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/models/tasks?search=%27%20OR%201%3D1%20--',
      headers: { 'x-api-key': TEST_FIXTURES.apiKey.raw },
    });
    // Should return empty or filtered results, not crash or expose all data
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    assert(Array.isArray(body.data.items), 'SQL injection via search must return safe paginated result');
  });

  await test('TC-34: Path traversal in model name is blocked', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/models/../../../etc/passwd/metadata',
      headers: { 'x-api-key': TEST_FIXTURES.apiKey.raw },
    });
    // Must not return 200 with system file exposure
    assert(res.statusCode === 404 || res.statusCode === 400, `Expected 404/400, got ${res.statusCode}`);
  });

  await app.close();

  console.log('\n======================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`📊 PHASE 04 RESULT: ${passedCount} Passed, ${failedCount} Failed (Total: ${results.length})`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (process.argv[1]?.includes('02-metadata-security.test.ts')) {
  runMetadataTests().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
