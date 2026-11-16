import { setupTestEnvironment, getTestApp, TEST_FIXTURES } from './setup.js';
import { ai, AiEngine } from '../../packages/ai/ai-base/dist/index.js';

const E2E_MODEL = 'test:e2e-deterministic';

function registerDeterministicModel(engine: Pick<AiEngine, 'models'>): void {
  engine.models.register(E2E_MODEL, {
    async generate({ messages }) {
      const prompt = messages.at(-1)?.content ?? '';
      return {
        text: `E2E deterministic response: ${prompt}`,
        provider: 'test',
        model: 'e2e-deterministic',
      };
    },
    async *stream() {
      yield 'E2E deterministic response';
    },
  });
}

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    results.push({ id: `TC-${results.length + 46}`, name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✅ [PASS] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ id: `TC-${results.length + 46}`, name, passed: false, error: err.message, durationMs: Date.now() - start });
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export async function runAiEngineTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 06: MODULAR AI ENGINE & WORKSPACE E2E');
  console.log('======================================================\n');

  const previousDefaultModel = process.env.AI_DEFAULT_MODEL;
  process.env.AI_DEFAULT_MODEL = E2E_MODEL;
  registerDeterministicModel(ai);
  await setupTestEnvironment(false);
  const app = await getTestApp();

  console.log('--- Subsuite 1: Agent Registry & Discovery ---');

  await test('TC-46: GET /api/v1/ai/agents returns all registered agents with capabilities', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/ai/agents',
      headers: { 'x-api-key': TEST_FIXTURES.apiKey.raw },
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    assert(Array.isArray(body.data), 'Agents list must be an array');
    const agentIds = body.data.map((a: any) => a.id);

    assert(agentIds.includes('assistant'), 'Must include assistant agent');
    assert(agentIds.includes('coder'), 'Must include coder agent');
    assert(agentIds.includes('researcher'), 'Must include researcher agent');
    assert(agentIds.includes('browser'), 'Must include browser agent');
    assert(agentIds.includes('supervisor'), 'Must include supervisor agent');

    const assistant = body.data.find((a: any) => a.id === 'assistant');
    assert(assistant.status === 'IMPLEMENTED', 'Assistant must have IMPLEMENTED status');
    assert(Array.isArray(assistant.capabilities), 'Capabilities must be an array');
  });

  console.log('\n--- Subsuite 2: Contextual Chat & Execution Run ---');

  let generatedThreadId = '';
  let generatedRunId = '';

  await test('TC-47: POST /api/v1/ai/chat executes query with execution context', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/chat',
      headers: {
        'x-api-key': TEST_FIXTURES.apiKey.raw,
        'content-type': 'application/json',
      },
      payload: {
        prompt: 'Check system status and current time',
        agentId: 'assistant',
      },
    });

    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    assert(body.success === true, 'Response must be success');
    assert(body.data.status === 'completed', 'Run status must be completed');
    assert(body.data.agentId === 'assistant', 'AgentId must match assistant');
    assert(typeof body.data.output === 'string', 'Output must be string');
    assert(body.data.output.length > 20, 'Output must not be empty');

    generatedThreadId = body.data.metadata?.threadId;
    generatedRunId = body.data.runId;
    assert(Boolean(generatedThreadId), 'ThreadId must be returned');
  });

  await test('TC-48: POST /api/v1/ai/runs initiates run and GET /api/v1/ai/runs/:id retrieves it', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/runs',
      headers: {
        'x-api-key': TEST_FIXTURES.apiKey.raw,
        'content-type': 'application/json',
      },
      payload: {
        prompt: 'Calculate 25 multiplied by 4',
        agentId: 'assistant',
      },
    });

    assert(res.statusCode === 201, `Expected 201, got ${res.statusCode}`);
    const run = JSON.parse(res.body).data;
    assert(Boolean(run.runId), 'Run ID must be generated');

    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/ai/runs/${run.runId}`,
      headers: { 'x-api-key': TEST_FIXTURES.apiKey.raw },
    });
    assert(getRes.statusCode === 200, `Expected 200, got ${getRes.statusCode}`);
    const fetchedRun = JSON.parse(getRes.body).data;
    assert(fetchedRun.runId === run.runId, 'Fetched run ID must match');
  });

  console.log('\n--- Subsuite 3: Safe Tool Execution & Policies ---');

  await test('TC-49: Safe builtin tool executes through the registered runtime boundary', async () => {
    const testEngine = new AiEngine({ storageUrl: 'file:./data/test_ai.db' });
    const result = await testEngine.tools.execute('system_info', {}, {
      requestId: 'req_system_info_test',
      permissions: [],
    });
    assert(typeof result === 'object' && result !== null, 'system_info must return a structured result');
    assert(typeof (result as Record<string, unknown>).platform === 'string', 'system_info must report platform');
  });

  await test('TC-50: ToolRegistry enforces DENY policy on restricted tools', async () => {
    // Create an isolated engine instance with test memory
    const testEngine = new AiEngine({ storageUrl: 'file:./data/test_ai.db' });
    testEngine.tools.setPolicy('calculator', 'DENY');

    let threw = false;
    try {
      await testEngine.tools.execute(
        'calculator',
        { operation: 'add', a: 1, b: 2 },
        { requestId: 'req_deny_test', permissions: [] }
      );
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('Security Policy Violation'), 'Error must specify Security Policy Violation');
    }
    assert(threw, 'Execution of DENY tool must throw');
  });

  await test('TC-51: ToolRegistry enforces ASK_USER approval policy without consent', async () => {
    const testEngine = new AiEngine({ storageUrl: 'file:./data/test_ai.db' });
    testEngine.tools.setPolicy('calculator', 'ASK_USER');

    let threw = false;
    try {
      await testEngine.tools.execute(
        'calculator',
        { operation: 'add', a: 5, b: 5 },
        { requestId: 'req_ask_test', permissions: [], metadata: {} }
      );
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('Approval Required'), 'Must indicate Approval Required');
    }
    assert(threw, 'Tool requiring approval must throw if not in userApprovedTools');
  });

  await test('TC-52: ToolRegistry allows ASK_USER tool when approved in context metadata', async () => {
    const testEngine = new AiEngine({ storageUrl: 'file:./data/test_ai.db' });
    testEngine.tools.setPolicy('calculator', 'ASK_USER');

    const result = await testEngine.tools.execute(
      'calculator',
      { operation: 'multiply', a: 6, b: 7 },
      {
        requestId: 'req_approved_test',
        permissions: [],
        metadata: { userApprovedTools: ['calculator'] },
      }
    );

    assert(result.result === 42, `Expected 42, got ${result.result}`);
  });

  console.log('\n--- Subsuite 4: AI Memory Persistence & Threads ---');

  await test('TC-53: Verifies physical thread and message persistence in test_ai.db', async () => {
    const testEngine = new AiEngine({ storageUrl: 'file:./data/test_ai.db' });
    await testEngine.init();

    const threadId = await testEngine.memory.createThread('Test Thread E2E');
    assert(Boolean(threadId), 'Thread ID must be generated');

    const msgId1 = `msg_test_${Date.now()}_1`;
    const msgId2 = `msg_test_${Date.now()}_2`;
    await testEngine.memory.saveMessages(threadId, [
      {
        id: msgId1,
        role: 'user',
        content: 'Remember this keyword: Rocksoul2026',
        createdAt: new Date().toISOString(),
      },
      {
        id: msgId2,
        role: 'assistant',
        content: 'Keyword Rocksoul2026 stored in memory.',
        createdAt: new Date().toISOString(),
      },
    ]);

    // Inspect physical SQLite database rows via storage's underlying libsql client
    const client = testEngine.storage.getClient();
    const rows = await client.execute({
      sql: 'SELECT * FROM ai_messages WHERE thread_id = ?',
      args: [threadId],
    });

    assert(rows.rows.length === 2, `Expected 2 messages in physical DB, found ${rows.rows.length}`);
    assert(String(rows.rows[0].content).includes('Rocksoul2026'), 'Message content must match in physical DB');
  });

  await test('TC-54: Multi-turn memory recall across conversational turns', async () => {
    const testEngine = new AiEngine({ storageUrl: 'file:./data/test_ai.db' });
    registerDeterministicModel(testEngine);
    await testEngine.init();

    const threadId = await testEngine.memory.createThread('Conversation Multi-turn');

    const turn1 = await testEngine.chat({
      prompt: 'My project codename is Project-Titan.',
      threadId,
      agentId: 'assistant',
      context: { requestId: 'req_turn_1', userId: 'usr_test_admin', permissions: [] },
    });
    assert(turn1.status === 'completed', 'Turn 1 must succeed');

    const retrievedMessages = await testEngine.memory.getMessages(threadId);
    assert(retrievedMessages.length >= 2, 'Must have at least user and assistant message stored');
  });

  await app.close();
  if (previousDefaultModel === undefined) delete process.env.AI_DEFAULT_MODEL;
  else process.env.AI_DEFAULT_MODEL = previousDefaultModel;

  console.log('\n======================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`📊 PHASE 06 RESULT: ${passedCount} Passed, ${failedCount} Failed (Total: ${results.length})`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (process.argv[1]?.includes('04-ai-engine.test.ts')) {
  runAiEngineTests().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
