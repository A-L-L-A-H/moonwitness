import assert from 'node:assert/strict';
import {askAI, providerStatus} from '../src/ai-providers.mjs';

const status = providerStatus();
assert.equal(status.deterministic_available, true);

const fallback = await askAI('test', {provider:'deterministic'});
assert.equal(fallback.provider, 'deterministic');
assert.equal(fallback.status, 'DISABLED');

console.log('AI provider tests: 2/2 passed');
