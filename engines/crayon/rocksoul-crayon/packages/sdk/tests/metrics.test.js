import test from 'node:test';
import assert from 'node:assert/strict';
import { RuntimeMetrics } from '../dist/index.js';

test('runtime metrics expose only bounded numeric diagnostic state', () => {
  const metrics = new RuntimeMetrics();
  metrics.increment('execution.count');
  metrics.increment('execution.count', 2);
  metrics.set('queue.depth', 4);
  metrics.increment('secret', Number.NaN);
  assert.deepEqual(metrics.snapshot(), { 'execution.count': 3, 'queue.depth': 4 });
  metrics.reset();
  assert.deepEqual(metrics.snapshot(), {});
});
