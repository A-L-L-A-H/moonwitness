import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSchedulerServer } from '../dist/server.js';

test('two scheduler instances claim one concurrent execution', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'rocksoul-scheduler-race-')); const databaseUrl = `file:${join(dir, 'scheduler.db')}`;
  const first = await buildSchedulerServer({ databaseUrl }); const second = await buildSchedulerServer({ databaseUrl });
  try { const created = await first.inject({ method: 'POST', url: '/jobs', payload: { name: 'race', executor: 'internal', target: 'self-test', scheduleType: 'manual', payload: { delayMs: 250 } } }); const id = JSON.parse(created.body).data.id; await Promise.all([first.inject({ method: 'POST', url: `/jobs/${id}/run` }), second.inject({ method: 'POST', url: `/jobs/${id}/run` })]); await new Promise(resolve => setTimeout(resolve, 700)); const runs = JSON.parse((await first.inject({ method: 'GET', url: `/jobs/${id}/runs` })).body).data; assert.equal(runs.length, 1); }
  finally { await first.close(); await second.close(); try { rmSync(dir, { recursive: true, force: true }); } catch {} }
});
