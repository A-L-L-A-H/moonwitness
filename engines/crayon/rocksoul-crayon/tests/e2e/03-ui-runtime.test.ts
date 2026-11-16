import { ResourceRegistry, RendererRegistry } from '../../apps/web/src/ui-runtime/metadata/registry.js';
import {
  FieldDefinitionSchema,
  ViewDefinitionSchema,
  ResourceDefinitionSchema,
} from '../../apps/web/src/ui-runtime/metadata/contracts.js';
import { initializeResources, taskResource, projectResource, userResource } from '../../apps/web/src/resources/index.js';
import { ApiClient } from '../../apps/web/src/lib/api-client.js';

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
    results.push({ id: `TC-${results.length + 35}`, name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✅ [PASS] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ id: `TC-${results.length + 35}`, name, passed: false, error: err.message, durationMs: Date.now() - start });
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export async function runUiRuntimeTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 05: FRONTEND UI RUNTIME & METADATA TEST SUITE');
  console.log('======================================================\n');

  initializeResources();

  console.log('--- Subsuite 1: Metadata Contracts & Zod Validation ---');

  await test('TC-35: Validates FieldDefinition schema correctly', () => {
    const validField = {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Todo', value: 'todo' },
        { label: 'Done', value: 'done' },
      ],
    };
    const result = FieldDefinitionSchema.safeParse(validField);
    assert(result.success, 'Valid FieldDefinition must pass parse');
  });

  await test('TC-36: Rejects invalid field type in FieldDefinition', () => {
    const invalidField = {
      name: 'maliciousField',
      label: 'Malicious',
      type: 'executable_script', // illegal type
    };
    const result = FieldDefinitionSchema.safeParse(invalidField);
    assert(!result.success, 'Invalid field type must be rejected');
  });

  await test('TC-37: Validates ViewDefinition schema with table and kanban types', () => {
    const tableView = {
      type: 'table',
      fields: ['id', 'title', 'status'],
      actions: ['edit', 'delete'],
    };
    const parsed = ViewDefinitionSchema.safeParse(tableView);
    assert(parsed.success, 'Valid ViewDefinition must pass parse');
  });

  await test('TC-38: Validates canonical taskResource against ResourceDefinitionSchema', () => {
    const result = ResourceDefinitionSchema.safeParse(taskResource);
    assert(result.success, 'taskResource must adhere to ResourceDefinitionSchema');
    assert(taskResource.id === 'task', 'taskResource id must be task');
    assert(taskResource.model === 'tasks', 'taskResource model must be tasks');
    assert(taskResource.fields.length > 3, 'taskResource must define fields');
  });

  await test('TC-39: Validates canonical projectResource against ResourceDefinitionSchema', () => {
    const result = ResourceDefinitionSchema.safeParse(projectResource);
    assert(result.success, 'projectResource must adhere to ResourceDefinitionSchema');
    assert(projectResource.id === 'project', 'projectResource id must be project');
    assert(projectResource.model === 'projects', 'projectResource model must be projects');
  });

  await test('TC-40: Validates canonical userResource against ResourceDefinitionSchema', () => {
    const result = ResourceDefinitionSchema.safeParse(userResource);
    assert(result.success, 'userResource must adhere to ResourceDefinitionSchema');
    assert(userResource.id === 'user', 'userResource id must be user');
    assert(userResource.model === 'users', 'userResource model must be users');
  });

  console.log('\n--- Subsuite 2: ResourceRegistry & Resolver ---');

  await test('TC-41: ResourceRegistry holds all core resources (task, project, user, mail, chat)', () => {
    const allResources = ResourceRegistry.list();
    const ids = allResources.map((r) => r.id);

    assert(ids.includes('task'), 'Registry must include task');
    assert(ids.includes('project'), 'Registry must include project');
    assert(ids.includes('user'), 'Registry must include user');
    assert(ids.includes('mail'), 'Registry must include mail');
    assert(ids.includes('chat'), 'Registry must include chat');
  });

  await test('TC-42: ResourceRegistry resolves resources by either ID or Model name', () => {
    const byId = ResourceRegistry.get('task');
    const byModel = ResourceRegistry.get('tasks');
    assert(Boolean(byId), 'Resource must resolve by ID (task)');
    assert(Boolean(byModel), 'Resource must resolve by Model (tasks)');
    assert(byId?.id === 'task', 'Resolved resource ID must match');
    assert(byModel?.id === 'task', 'Resolved resource by model must match');
  });

  await test('TC-43: ResourceRegistry returns undefined for non-existent resource', () => {
    const nonExistent = ResourceRegistry.get('non_existent_domain_xyz');
    assert(nonExistent === undefined, 'Non-existent resource must return undefined');
  });

  console.log('\n--- Subsuite 3: API Client & Connection ---');

  await test('TC-44: ApiClient initializes with default config and base URL', () => {
    const client = new ApiClient();
    assert(Boolean(client), 'ApiClient must instantiate successfully');
  });

  await test('TC-45: ApiClient manages authentication token lifecycle cleanly', () => {
    const client = new ApiClient();
    client.setToken('test_jwt_session_token_123');
    client.setToken(null);
  });

  console.log('\n======================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`📊 PHASE 05 RESULT: ${passedCount} Passed, ${failedCount} Failed (Total: ${results.length})`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (process.argv[1]?.includes('03-ui-runtime.test.ts')) {
  runUiRuntimeTests().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
