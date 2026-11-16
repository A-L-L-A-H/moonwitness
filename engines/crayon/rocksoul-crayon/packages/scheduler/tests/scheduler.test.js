import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSchedulerServer } from '../dist/server.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('health, manual execution, history, validation, pause and resume', async () => {
  const app = await buildSchedulerServer();
  try {
    assert.equal((await app.inject({ method: 'GET', url: '/health' })).statusCode, 200);
    const created = await app.inject({ method: 'POST', url: '/jobs', payload: { name: 'test', executor: 'internal', target: 'self-test', scheduleType: 'manual', payload: {} } });
    assert.equal(created.statusCode, 201);
    const id = JSON.parse(created.body).data.id;
    assert.equal((await app.inject({ method: 'POST', url: `/jobs/${id}/pause` })).statusCode, 200);
    assert.equal((await app.inject({ method: 'POST', url: `/jobs/${id}/resume` })).statusCode, 200);
    assert.equal((await app.inject({ method: 'POST', url: `/jobs/${id}/run` })).statusCode, 202);
    await new Promise(resolve => setTimeout(resolve, 100));
    const runs = await app.inject({ method: 'GET', url: `/jobs/${id}/runs` });
    assert.equal(JSON.parse(runs.body).data[0].status, 'success');
    assert.equal((await app.inject({ method: 'POST', url: '/jobs', payload: { name: 'bad', executor: 'nope', target: 'x', scheduleType: 'manual' } })).statusCode, 400);
    assert.equal((await app.inject({ method: 'POST', url: '/jobs', payload: { name: 'bad-cron', executor: 'internal', target: 'self-test', scheduleType: 'cron', cronExpression: 'invalid' } })).statusCode, 400);
    const retry = await app.inject({ method: 'POST', url: '/jobs', payload: { name: 'retry', executor: 'internal', target: 'unsupported', scheduleType: 'manual', maxRetries: 2 } });
    const retryId = JSON.parse(retry.body).data.id;
    await app.inject({ method: 'POST', url: `/jobs/${retryId}/run` });
    await new Promise(resolve => setTimeout(resolve, 6000));
    assert.equal(JSON.parse((await app.inject({ method: 'GET', url: `/jobs/${retryId}/runs` })).body).data.length, 3);
    assert.equal((await app.inject({ method: 'GET', url: '/stats' })).statusCode, 200);
    assert.equal((await app.inject({ method: 'DELETE', url: `/jobs/${retryId}` })).statusCode, 200);
  } finally { await app.close(); }
});

test('job configuration persists across server reinitialization', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'rocksoul-scheduler-'));
  const databaseUrl = `file:${join(dir, 'scheduler.db')}`;
  let app = await buildSchedulerServer({ databaseUrl });
  const created = await app.inject({ method: 'POST', url: '/jobs', payload: { name: 'persistent', executor: 'internal', target: 'self-test', scheduleType: 'manual' } });
  const id = JSON.parse(created.body).data.id;
  await app.close();
  app = await buildSchedulerServer({ databaseUrl });
  try { const restored = await app.inject({ method: 'GET', url: `/jobs/${id}` }); assert.equal(restored.statusCode, 200); assert.equal(JSON.parse(restored.body).data.name, 'persistent'); }
  finally { await app.close(); try { rmSync(dir, { recursive: true, force: true }); } catch { /* Windows may release SQLite handles asynchronously. */ } }
});

test('disabled jobs do not execute and timeout is persisted', async () => {
  const app = await buildSchedulerServer();
  try {
    const disabled = await app.inject({ method: 'POST', url: '/jobs', payload: { name: 'disabled', executor: 'internal', target: 'self-test', scheduleType: 'manual', enabled: false } });
    const disabledId = JSON.parse(disabled.body).data.id;
    await app.inject({ method: 'POST', url: `/jobs/${disabledId}/run` });
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.equal(JSON.parse((await app.inject({ method: 'GET', url: `/jobs/${disabledId}/runs` })).body).data.length, 0);
    const timeout = await app.inject({ method: 'POST', url: '/jobs', payload: { name: 'timeout', executor: 'internal', target: 'self-test', scheduleType: 'manual', timeoutMs: 100, payload: { delayMs: 500 } } });
    const timeoutId = JSON.parse(timeout.body).data.id;
    await app.inject({ method: 'POST', url: `/jobs/${timeoutId}/run` });
    await new Promise(resolve => setTimeout(resolve, 500));
    assert.equal(JSON.parse((await app.inject({ method: 'GET', url: `/jobs/${timeoutId}/runs` })).body).data[0].status, 'timeout');
  } finally { await app.close(); }
});
