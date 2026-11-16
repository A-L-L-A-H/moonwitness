import assert from 'node:assert/strict';
import test from 'node:test';
import { createDatabase } from '@rocksoul/orm';
import {
  enqueueAepEvent,
  markAepEventAttempted,
  markAepEventPublished,
  readPendingAepEvents,
  dispatchAepOutboxOnce,
  pruneAepEventLog,
  claimAepOutboxBatch,
} from '../dist/services/aep-event-outbox.js';

test('outbox enqueue is parameterized and preserves event payload', async () => {
  const calls = [];
  const client = { execute: async query => { calls.push(query); return { rows: [] }; } };
  const event = { eventId: 'event-1', eventType: 'resource.updated', resource: 'projects', recordId: 'p-1', timestamp: Date.UTC(2026, 0, 1), payload: { id: 'p-1', name: 'Rocksoul' } };
  await enqueueAepEvent(client, event, 'user-1');
  assert.match(calls[0].sql, /^INSERT INTO aep_event_outbox/);
  assert.deepEqual(calls[0].args.slice(1, 6), ['event-1', 'resource.updated', 'projects', 'p-1', 'user-1']);
  assert.deepEqual(JSON.parse(calls[0].args[6]), event.payload);
});

test('outbox reads bounded pending events and round-trips JSON', async () => {
  let query;
  const client = { execute: async value => { query = value; return { rows: [{ id: 'outbox-1', event_id: 'event-1', event_type: 'chat.message', resource: 'chat_messages', record_id: null, principal_id: 'user-1', payload_json: '{"id":"m-1"}', created_at: '2026-01-01T00:00:00.000Z', attempts: 2 }] }; } };
  const rows = await readPendingAepEvents(client, 50_000);
  assert.equal(query.args[0], 1_000);
  assert.deepEqual(rows[0], { id: 'outbox-1', eventId: 'event-1', eventType: 'chat.message', resource: 'chat_messages', recordId: undefined, principalId: 'user-1', payload: { id: 'm-1' }, createdAt: '2026-01-01T00:00:00.000Z', attempts: 2 });
});

test('outbox publish and attempt updates are parameterized', async () => {
  const calls = [];
  const client = { execute: async query => { calls.push(query); return { rows: [] }; } };
  await markAepEventAttempted(client, 'outbox-1');
  await markAepEventPublished(client, 'outbox-1');
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(call => call.args.at(-1)), ['outbox-1', 'outbox-1']);
  assert.match(calls[1].sql, /published_at IS NULL/);
});

test('outbox dispatcher drains pending rows idempotently', async () => {
  const calls = [];
  const client = { execute: async query => {
    calls.push(query);
    if (typeof query !== 'string' && query.sql.includes('FROM aep_event_outbox')) return { rows: [{ id: 'o-1', event_id: 'e-1', event_type: 'resource.updated', resource: 'projects', record_id: 'p-1', principal_id: 'u-1', payload_json: '{"id":"p-1"}', created_at: '2026-01-01T00:00:00.000Z', attempts: 0 }] };
    return { rows: [] };
  } };
  assert.equal(await dispatchAepOutboxOnce(client, 1), 1);
  assert.ok(calls.some(query => typeof query !== 'string' && query.sql.includes('INSERT OR IGNORE INTO aep_event_log')));
  assert.ok(calls.some(query => typeof query !== 'string' && query.sql.includes('published_at IS NULL')));
});

test('event log retention uses bounded age and row limits', async () => {
  const calls = [];
  const client = { execute: async query => { calls.push(query); return { rows: [] }; } };
  await pruneAepEventLog(client, 1, 9_999_999);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].args.length, 1);
  assert.equal(calls[1].args[0], 1_000_000);
});

test('outbox claim is worker-scoped and bounded', async () => {
  const calls = [];
  const client = { execute: async query => {
    calls.push(query);
    if (typeof query !== 'string' && query.sql.includes('SELECT id, event_id')) return { rows: [] };
    return { rows: [] };
  } };
  const rows = await claimAepOutboxBatch(client, 'worker-a', 50_000, 1);
  assert.deepEqual(rows, []);
  assert.equal(calls[0].args[0], 'worker-a');
  assert.equal(calls[0].args.at(-1), 1_000);
  assert.match(calls[0].sql, /claimed_at IS NULL OR claimed_at < \?/);
});

test('two concurrent workers cannot claim the same durable row', async () => {
  const { client } = createDatabase('file::memory:?cache=shared');
  await client.execute(`CREATE TABLE aep_event_outbox (id TEXT PRIMARY KEY, event_id TEXT UNIQUE, event_type TEXT, resource TEXT, record_id TEXT, principal_id TEXT, payload_json TEXT, created_at TEXT, published_at TEXT, attempts INTEGER DEFAULT 0, claim_token TEXT, claimed_at TEXT)`);
  await client.execute({ sql: `INSERT INTO aep_event_outbox (id, event_id, event_type, resource, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`, args: ['o-1', 'e-1', 'resource.updated', 'projects', '{}', new Date().toISOString()] });
  const [first, second] = await Promise.all([
    claimAepOutboxBatch(client, 'worker-a', 1),
    claimAepOutboxBatch(client, 'worker-b', 1),
  ]);
  assert.equal(Number(first.length) + Number(second.length), 1);
  await client.close();
});

test('expired lease is recoverable by another worker', async () => {
  const { client } = createDatabase('file::memory:?cache=private');
  await client.execute(`CREATE TABLE aep_event_outbox (id TEXT PRIMARY KEY, event_id TEXT UNIQUE, event_type TEXT, resource TEXT, record_id TEXT, principal_id TEXT, payload_json TEXT, created_at TEXT, published_at TEXT, attempts INTEGER DEFAULT 0, claim_token TEXT, claimed_at TEXT)`);
  await client.execute({ sql: `INSERT INTO aep_event_outbox (id, event_id, event_type, resource, payload_json, created_at, claim_token, claimed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, args: ['o-2', 'e-2', 'resource.updated', 'projects', '{}', new Date().toISOString(), 'dead-worker', new Date(Date.now() - 60_000).toISOString()] });
  const recovered = await claimAepOutboxBatch(client, 'worker-recovery', 1, 1_000);
  assert.equal(recovered.length, 1);
  assert.equal(recovered[0].id, 'o-2');
  await client.close();
});

test('recovered worker dispatches a stranded row after restart', async () => {
  const { client } = createDatabase('file::memory:?cache=private');
  await client.execute(`CREATE TABLE aep_event_outbox (id TEXT PRIMARY KEY, event_id TEXT UNIQUE, event_type TEXT, resource TEXT, record_id TEXT, principal_id TEXT, payload_json TEXT, created_at TEXT, published_at TEXT, attempts INTEGER DEFAULT 0, claim_token TEXT, claimed_at TEXT)`);
  await client.execute(`CREATE TABLE aep_event_log (sequence INTEGER PRIMARY KEY AUTOINCREMENT, event_id TEXT UNIQUE, event_type TEXT, resource TEXT, record_id TEXT, principal_id TEXT, payload_json TEXT, created_at TEXT)`);
  await client.execute({ sql: `INSERT INTO aep_event_outbox (id, event_id, event_type, resource, payload_json, created_at, claim_token, claimed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, args: ['o-3', 'e-3', 'resource.updated', 'projects', '{"id":"p-3"}', new Date().toISOString(), 'dead-worker', new Date(Date.now() - 60_000).toISOString()] });
  assert.equal(await dispatchAepOutboxOnce(client, 1, 'restarted-worker'), 1);
  const log = await client.execute(`SELECT event_id FROM aep_event_log`);
  assert.equal(log.rows.length, 1);
  assert.equal(log.rows[0].event_id, 'e-3');
  await client.close();
});
