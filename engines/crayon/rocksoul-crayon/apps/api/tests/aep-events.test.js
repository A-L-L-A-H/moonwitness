import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { aepEventHub } from '../dist/services/aep-events.js';

test('event hub delivers only matching resource and record facts', () => {
  const received = [];
  const cleanup = aepEventHub.subscribe({ resource: 'projects', recordId: 'project-1' }, event => received.push(event));
  const base = { eventId: randomUUID(), timestamp: Date.now(), payload: { id: 'project-1' } };
  aepEventHub.publish({ ...base, eventType: 'resource.updated', resource: 'projects', recordId: 'project-1' });
  aepEventHub.publish({ ...base, eventId: randomUUID(), eventType: 'resource.updated', resource: 'projects', recordId: 'project-2' });
  aepEventHub.publish({ ...base, eventId: randomUUID(), eventType: 'resource.updated', resource: 'tasks', recordId: 'project-1' });
  cleanup();
  aepEventHub.publish({ ...base, eventId: randomUUID(), eventType: 'resource.updated', resource: 'projects', recordId: 'project-1' });
  assert.equal(received.length, 1);
  assert.equal(received[0].recordId, 'project-1');
});

test('event hub cleanup removes a subscriber deterministically', () => {
  const before = aepEventHub.subscriberCount;
  const cleanup = aepEventHub.subscribe({}, () => {});
  assert.equal(aepEventHub.subscriberCount, before + 1);
  cleanup();
  cleanup();
  assert.equal(aepEventHub.subscriberCount, before);
});

test('event hub assigns opaque monotonic cursors and replays after a cursor', () => {
  const prefix = `cursor-${randomUUID()}`;
  aepEventHub.publish({ eventId: `${prefix}-1`, eventType: 'resource.updated', resource: 'projects', recordId: prefix, timestamp: Date.now(), payload: { id: prefix } });
  aepEventHub.publish({ eventId: `${prefix}-2`, eventType: 'resource.updated', resource: 'projects', recordId: prefix, timestamp: Date.now(), payload: { id: prefix } });
  const all = aepEventHub.since(undefined, { resource: 'projects', recordId: prefix });
  assert.equal(all.length, 2);
  assert.ok(all[0].cursor);
  assert.equal(aepEventHub.since(all[0].cursor, { resource: 'projects', recordId: prefix }).length, 1);
});

test('event hub reports a gap when a cursor predates bounded history', () => {
  for (let index = 0; index < 1_025; index += 1) aepEventHub.publish({ eventId: `gap-${randomUUID()}`, eventType: 'resource.updated', resource: 'projects', timestamp: Date.now(), payload: { index } });
  assert.equal(aepEventHub.replay('evt-1', { resource: 'projects' }).gap, true);
});

test('event hub hydrates durable sequence history and persists new events', async () => {
  const calls = [];
  const client = { execute: async request => {
    calls.push(request);
    if (typeof request === 'string') return { rows: [{ sequence: 7, event_id: 'durable-7', event_type: 'resource.updated', resource: 'projects', record_id: 'p-7', payload_json: JSON.stringify({ id: 'p-7' }), created_at: new Date().toISOString() }] };
    return { rows: [] };
  } };
  await aepEventHub.initialize(client);
  assert.equal(aepEventHub.since('evt-6', { resource: 'projects' }).length, 1);
  aepEventHub.publish({ eventId: 'durable-8', eventType: 'resource.updated', resource: 'projects', recordId: 'p-8', timestamp: Date.now(), payload: { id: 'p-8' } });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.ok(calls.some(request => typeof request !== 'string' && request.sql.includes('aep_event_log')));
});

test('event hub filters principal-bound replay without hiding legacy events', () => {
  const first = `principal-a-${randomUUID()}`;
  const second = `principal-b-${randomUUID()}`;
  aepEventHub.publish({ eventId: first, eventType: 'resource.updated', resource: 'projects', recordId: 'p-a', principalId: 'user-a', timestamp: Date.now(), payload: { id: 'p-a' } });
  aepEventHub.publish({ eventId: second, eventType: 'resource.updated', resource: 'projects', recordId: 'p-b', principalId: 'user-b', timestamp: Date.now(), payload: { id: 'p-b' } });
  const replay = aepEventHub.replay(undefined, { resource: 'projects', principalId: 'user-a' });
  assert.ok(replay.events.some(event => event.eventId === first));
  assert.ok(!replay.events.some(event => event.eventId === second));
});
