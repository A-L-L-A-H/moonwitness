import test from 'node:test';
import assert from 'node:assert/strict';
import { withRetry } from '../dist/index.js';

test('retry retries transport failures with bounded exponential delays', async () => {
  let attempts = 0;
  const delays = [];
  const value = await withRetry(async attempt => {
    attempts = attempt;
    if (attempt < 3) throw Object.assign(new Error('network'), { code: 'CONNECTION_FAILED' });
    return 'ok';
  }, { baseDelayMs: 2, sleep: async delay => delays.push(delay) });
  assert.equal(value, 'ok');
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [2, 4]);
});

test('retry never retries authorization failures', async () => {
  let attempts = 0;
  await assert.rejects(() => withRetry(async () => {
    attempts += 1;
    throw Object.assign(new Error('denied'), { code: 'AUTHORIZATION_DENIED' });
  }, { sleep: async () => {} }), /denied/);
  assert.equal(attempts, 1);
});
