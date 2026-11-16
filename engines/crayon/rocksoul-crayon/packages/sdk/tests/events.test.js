import test from 'node:test';
import assert from 'node:assert/strict';
import { EventDeduplicator, applicationCursor } from '../dist/index.js';

const event = (eventId, cursor = applicationCursor('cursor-1')) => ({
  eventId, eventType: 'resource.updated', sessionId: 'session-1', requestId: 'request-1',
  sequence: 4, cursor, timestamp: 1, priority: 2, payload: { id: 'project-1' },
});

test('application cursor is opaque and never confused with a wire sequence', () => {
  const cursor = applicationCursor('opaque-server-cursor');
  assert.equal(cursor, 'opaque-server-cursor');
  assert.throws(() => applicationCursor('   '));
});

test('event deduplication accepts facts once and preserves independent cursors', () => {
  const deduplicator = new EventDeduplicator();
  assert.equal(deduplicator.accept(event('event-1')), true);
  assert.equal(deduplicator.accept(event('event-1', applicationCursor('cursor-2'))), false);
  assert.equal(deduplicator.accept(event('event-2')), true);
  assert.equal(deduplicator.size, 2);
});
