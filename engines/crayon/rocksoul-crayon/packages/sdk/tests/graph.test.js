import test from 'node:test';
import assert from 'node:assert/strict';
import { runExecutionGraph } from '../dist/index.js';

test('execution graph runs dependency waves and preserves node correlation', async () => {
  const result = await runExecutionGraph('graph-1', [
    { id: 'project', run: async () => ({ id: 'p-1' }) },
    { id: 'tasks', dependsOn: ['project'], run: async values => [{ projectId: values.project.id }] },
    { id: 'analysis', dependsOn: ['project', 'tasks'], run: async values => `${values.project.id}:${values.tasks.length}` },
  ]);
  assert.equal(result.graphId, 'graph-1');
  assert.equal(result.nodes.analysis.status, 'success');
  assert.equal(result.nodes.analysis.value, 'p-1:1');
});

test('execution graph skips dependents after node failure and rejects cycles', async () => {
  const result = await runExecutionGraph('graph-2', [
    { id: 'failed', run: async () => { throw new Error('boom'); } },
    { id: 'dependent', dependsOn: ['failed'], run: async () => 1 },
  ]);
  assert.equal(result.nodes.failed.status, 'failed');
  assert.equal(result.nodes.dependent.status, 'skipped');
  await assert.rejects(() => runExecutionGraph('cycle', [
    { id: 'a', dependsOn: ['b'], run: async () => 1 },
    { id: 'b', dependsOn: ['a'], run: async () => 1 },
  ]), /cycle/);
});
