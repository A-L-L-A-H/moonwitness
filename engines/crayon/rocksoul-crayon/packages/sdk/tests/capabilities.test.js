import test from 'node:test';
import assert from 'node:assert/strict';
import { CapabilityError, CapabilityRegistry } from '../dist/capabilities.js';

const context = (scopes = []) => ({
  auth: { principal: { id: 'actor-1' }, scopes: new Set(scopes), roles: new Set() },
  environment: 'test',
});

const descriptor = (overrides = {}) => ({
  id: 'project.read',
  version: '1.0.0',
  sideEffects: 'read',
  requiredScopes: ['project:read'],
  executionMode: 'sync',
  supportsCancellation: false,
  supportsIdempotency: false,
  inputValidator: value => typeof value === 'string',
  isSupported: () => true,
  isAvailable: () => true,
  isAuthorized: ctx => ctx.auth.scopes.has('project:read'),
  ...overrides,
});

test('capability resolution preserves independent semantic states', () => {
  const registry = new CapabilityRegistry();
  registry.register(descriptor());
  assert.equal(registry.resolve('unknown.read', 'x', context()).status, 'NOT_FOUND');
  assert.equal(registry.resolve('project.read', 'x', context()).status, 'UNAUTHORIZED');
  assert.equal(registry.resolve('project.read', 'x', context(['project:read'])).status, 'EXECUTABLE');
  assert.equal(registry.resolve('project.read', 1, context(['project:read'])).status, 'INVALID_INPUT');
});

test('unsupported and unavailable are not authorization failures', () => {
  const unsupported = new CapabilityRegistry();
  unsupported.register(descriptor({ isSupported: () => false }));
  assert.equal(unsupported.resolve('project.read', 'x', context()).status, 'UNSUPPORTED');

  const unavailable = new CapabilityRegistry();
  unavailable.register(descriptor({ isAvailable: () => false }));
  assert.equal(unavailable.resolve('project.read', 'x', context(['project:read'])).status, 'UNAVAILABLE');
});

test('registry rejects duplicate versions and preserves explicit version selection', () => {
  const registry = new CapabilityRegistry();
  registry.register(descriptor());
  assert.throws(() => registry.register(descriptor()), error => error instanceof CapabilityError && error.code === 'CAPABILITY_DUPLICATE_VERSION');
  registry.register(descriptor({ version: '2.0.0' }));
  assert.equal(registry.get('project.read'), undefined);
  assert.equal(registry.resolve('project.read', 'x', context(['project:read'])).status, 'NOT_FOUND');
  assert.equal(registry.resolve('project.read', 'x', context(['project:read']), '2.0.0').status, 'EXECUTABLE');
});

test('concurrent resolution is deterministic and does not mutate registry', async () => {
  const registry = new CapabilityRegistry();
  registry.register(descriptor());
  const results = await Promise.all(Array.from({ length: 100 }, () => registry.resolve('project.read', 'x', context(['project:read']))));
  assert.equal(new Set(results.map(result => result.status)).size, 1);
  assert.equal(registry.list().length, 1);
});
