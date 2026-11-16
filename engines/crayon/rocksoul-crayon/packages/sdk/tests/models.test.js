import test from 'node:test';
import assert from 'node:assert/strict';
import { createModelClient } from '../dist/index.js';

test('model client is an adapter-only typed CRUD facade with encoded paths', async () => {
  const calls = []; const client = createModelClient({ request: async (path, options) => { calls.push({ path, options }); return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 }; } });
  const page = await client.list('project space', { limit: 2, search: 'alpha', order: 'name', direction: 'asc' }); await client.read('users', 'ada/1'); await client.metadata('users'); await client.create('users', { name: 'Ada' }); await client.update('users', 'ada', { name: 'Grace' }, { expectedVersion: '2026-09-08T00:00:00.000Z' }); await client.remove('users', 'ada');
  assert.equal(page.totalPages, 0); assert.equal(calls[0].path, '/api/v1/models/project%20space'); assert.deepEqual(calls[0].options.query, { limit: 2, search: 'alpha', order: 'name', direction: 'asc' }); assert.equal(calls[1].path, '/api/v1/models/users/ada%2F1'); assert.equal(calls[2].path, '/api/v1/models/users/metadata'); assert.equal(calls[3].options.method, 'POST'); assert.equal(calls[4].options.method, 'PATCH'); assert.equal(calls[4].options.body.expectedVersion, '2026-09-08T00:00:00.000Z'); assert.equal(calls[5].options.method, 'DELETE');
});
