import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppClient } from '../dist/index.js';

test('application facade exposes semantic resource namespaces over one adapter', async () => {
  const calls = [];
  const models = {
    list: async (model, query) => { calls.push(['list', model, query]); return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 }; },
    read: async (model, id) => { calls.push(['read', model, id]); return { id }; },
    create: async (model, input) => { calls.push(['create', model, input]); return { id: 'new', ...input }; },
    update: async (model, id, input) => { calls.push(['update', model, id, input]); return { id, ...input }; },
    remove: async (model, id) => { calls.push(['remove', model, id]); return { id, deleted: true }; },
    metadata: async () => ({}),
    menu: async () => [],
  };
  const app = createAppClient({ models });
  await app.projects.list({ search: 'rocksoul' });
  await app.tasks.get('task-1');
  await app.projects.update('project-1', { name: 'Rocksoul' });
  await app.users.delete('user-1');
  assert.deepEqual(calls, [
    ['list', 'projects', { search: 'rocksoul' }],
    ['read', 'tasks', 'task-1'],
    ['update', 'projects', 'project-1', { name: 'Rocksoul' }],
    ['remove', 'users', 'user-1'],
  ]);
});

test('application facade fails explicitly when an execution adapter is absent', async () => {
  const app = createAppClient({});
  assert.throws(() => app.execute('ai.chat', {}), /execution runtime is not configured/);
  assert.throws(() => app.projects.list(), /resource adapter is not configured/);
  assert.throws(() => app.projects.watch('project-1', () => {}), /live resource subscription is not available/);
});

test('application facade keeps the canonical calendar resource key and tolerates an absent native provider', async () => {
  const calls = [];
  const app = createAppClient({ models: {
    list: async (model) => { calls.push(model); return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 }; },
  } });
  await app.calendar.list();
  assert.deepEqual(calls, ['calendar_events']);
});

test('application facade resolves a runtime lazily after authentication changes', () => {
  let runtime;
  const app = createAppClient({
    runtimeProvider: () => runtime,
  });
  assert.deepEqual(app.capabilities.list(), []);
  runtime = { capabilities: { list: () => [{ id: 'mail.send' }] } };
  assert.equal(app.runtime, runtime);
  assert.deepEqual(app.capabilities.list(), [{ id: 'mail.send' }]);
});

test('application facade exposes session, event, and execution controls', async () => {
  const events = [];
  let cancelled;
  const runtime = {
    session: { state: 'READY', sessionId: 'session-1', lastAcknowledgedSequence: 3 },
    onEvent: listener => { events.push(listener); return () => {}; },
    watch: (id, listener) => { listener({ type: 'RUNNING', executionId: id }); return () => {}; },
    cancel: async id => { cancelled = id; },
    capabilities: { list: () => [] },
  };
  const app = createAppClient({ runtime });
  assert.equal(app.session.sessionId, 'session-1');
  const unsubscribe = app.events.on(() => {});
  assert.equal(typeof unsubscribe, 'function');
  let observed;
  app.executions.watch('execution-1', event => { observed = event; });
  await app.executions.cancel('execution-1');
  assert.deepEqual(observed, { type: 'RUNNING', executionId: 'execution-1' });
  assert.equal(cancelled, 'execution-1');
});

test('application capability facade resolves without granting authorization', () => {
  const capability = { id: 'projects.read', supported: true };
  const runtime = { capabilities: { list: () => [capability], get: id => id === capability.id ? capability : undefined } };
  const app = createAppClient({ runtime });
  assert.equal(app.capabilities.resolve('projects.read'), capability);
  assert.equal(app.capabilities.resolve('admin.secret'), undefined);
});

test('application batch preserves addressable partial results in parallel and sequential modes', async () => {
  const app = createAppClient({});
  const operations = {
    project: Promise.resolve({ id: 'p-1' }),
    broken: Promise.reject(new Error('expected failure')),
  };
  const parallel = await app.batch(operations);
  assert.equal(parallel.project.status, 'success');
  assert.equal(parallel.project.value.id, 'p-1');
  assert.equal(parallel.broken.status, 'failed');
  const sequential = await app.batch({ first: Promise.resolve(1), second: Promise.resolve(2) }, { mode: 'sequential' });
  assert.equal(sequential.first.value, 1);
  assert.equal(sequential.second.value, 2);
});

test('semantic mutations generate idempotency keys and preserve explicit overrides', async () => {
  const calls = [];
  const runtime = {
    capabilities: { list: () => [] },
    run: async (...args) => { calls.push(args); return { id: 'execution', result: async () => ({}) }; },
  };
  const app = createAppClient({ runtime });
  await app.mutate('projects.update', { id: 'p-1' });
  await app.mutate('projects.update', { id: 'p-1' }, { idempotencyKey: 'fixed-key' });
  assert.match(calls[0][2].idempotencyKey, /^[0-9a-f-]{36}$/);
  assert.equal(calls[1][2].idempotencyKey, 'fixed-key');
});

test('mail and chat mutation facades always send idempotency keys', async () => {
  const calls = [];
  const runtime = {
    capabilities: { list: () => [] },
    run: async (...args) => { calls.push(args); return { id: 'execution', result: async () => ({}) }; },
  };
  const app = createAppClient({ runtime });
  await app.mail.send({ to: 'recipient@example.com', text: 'hello' });
  await app.chat.send({ conversationId: 'conversation-1', content: 'hello' });
  assert.equal(calls[0][0], 'mail.send');
  assert.equal(calls[1][0], 'chat.send');
  assert.match(calls[0][2].idempotencyKey, /^[0-9a-f-]{36}$/);
  assert.match(calls[1][2].idempotencyKey, /^[0-9a-f-]{36}$/);
});

test('resource handles share normalized state and deduplicate notifications', async () => {
  let reads = 0;
  const app = createAppClient({ models: {
    read: async (_model, id) => { reads += 1; await new Promise(resolve => setTimeout(resolve, 5)); return { id, name: 'Project' }; },
  } });
  const handle = app.projects.use('p-1');
  const states = [];
  const off = handle.subscribe(state => states.push(state));
  assert.equal(handle.state.status, 'idle');
  await Promise.all([handle.refresh(), handle.refresh()]);
  assert.equal(reads, 1);
  assert.equal(handle.state.data.name, 'Project');
  assert.equal(handle.state.status, 'ready');
  assert.equal(states.at(-1).version, 1);
  off();
  const second = app.projects.use('p-1');
  assert.equal(second.state.data.id, 'p-1');
  second.evict();
  assert.equal(second.state.status, 'idle');
});
