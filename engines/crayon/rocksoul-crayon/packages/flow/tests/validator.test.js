import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDefinition } from '../dist/index.js';

test('rejects cycles and unknown nodes', () => {
  const issues = validateDefinition({ nodes: [
    { id: 'a', type: 'manual-trigger', position: { x: 0, y: 0 }, data: {} },
    { id: 'b', type: 'not-real', position: { x: 1, y: 1 }, data: {} },
  ], edges: [{ id: 'a-b', source: 'a', target: 'b' }, { id: 'b-a', source: 'b', target: 'a' }] });
  assert.ok(issues.some(issue => issue.code === 'UNKNOWN_NODE'));
  assert.ok(issues.some(issue => issue.code === 'CYCLE'));
});

test('requires explicit condition branch handles', () => {
  const issues = validateDefinition({ nodes: [
    { id: 't', type: 'manual-trigger', position: { x: 0, y: 0 }, data: {} },
    { id: 'c', type: 'condition', position: { x: 1, y: 1 }, data: {} },
    { id: 'x', type: 'transform', position: { x: 2, y: 2 }, data: {} },
  ], edges: [{ id: 't-c', source: 't', target: 'c' }, { id: 'c-x', source: 'c', target: 'x' }] });
  assert.ok(issues.some(issue => issue.code === 'CONDITION_HANDLE'));
});
