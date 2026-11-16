import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file::memory:';

const [{ buildApp }, { hashApiKey, passwordResetTokens }] = await Promise.all([
  import('../dist/app.js'),
  import('@rocksoul/orm'),
]);

const json = response => response.json();
const request = (app, method, url, payload, token) => app.inject({
  method,
  url,
  payload,
  headers: token ? { authorization: `Bearer ${token}` } : {},
});

test('password reset is non-enumerating, one-time, and revokes sessions', async t => {
  const app = await buildApp({ logger: false });
  t.after(async () => { await app.close(); });
  const nonce = randomUUID();
  const email = `reset-${nonce}@example.invalid`;
  const oldPassword = `Old-${nonce}`;
  const newPassword = `New-${nonce}`;

  let response = await request(app, 'POST', '/api/v1/auth/register', { name: 'Reset User', email, password: oldPassword });
  assert.equal(response.statusCode, 201);
  response = await request(app, 'POST', '/api/v1/auth/login', { email, password: oldPassword });
  assert.equal(response.statusCode, 200);
  const oldToken = json(response).data.token;

  const existing = await request(app, 'POST', '/api/v1/auth/password-reset/request', { email });
  const unknown = await request(app, 'POST', '/api/v1/auth/password-reset/request', { email: `missing-${nonce}@example.invalid` });
  assert.equal(existing.statusCode, 200);
  assert.equal(unknown.statusCode, 200);
  assert.deepEqual(Object.keys(json(existing).data).sort(), Object.keys(json(unknown).data).sort());
  const resetToken = json(existing).data.resetToken;
  assert.equal(typeof resetToken, 'string');

  response = await request(app, 'POST', '/api/v1/auth/password-reset/consume', { token: resetToken, newPassword });
  assert.equal(response.statusCode, 200);
  response = await request(app, 'POST', '/api/v1/auth/password-reset/consume', { token: resetToken, newPassword: `Again-${nonce}` });
  assert.equal(response.statusCode, 401, 'a reset token cannot be replayed');
  response = await request(app, 'POST', '/api/v1/auth/login', { email, password: oldPassword });
  assert.equal(response.statusCode, 401);
  response = await request(app, 'POST', '/api/v1/auth/login', { email, password: newPassword });
  assert.equal(response.statusCode, 200);
  response = await request(app, 'GET', '/api/v1/auth/me', undefined, oldToken);
  assert.equal(response.statusCode, 401, 'reset revokes the previous session');
});

test('password changes and session management enforce bearer ownership', async t => {
  const app = await buildApp({ logger: false });
  t.after(async () => { await app.close(); });
  const nonce = randomUUID();
  const email = `sessions-${nonce}@example.invalid`;
  const password = `Current-${nonce}`;
  const nextPassword = `Next-${nonce}`;

  let response = await request(app, 'POST', '/api/v1/auth/register', { name: 'Session User', email, password });
  assert.equal(response.statusCode, 201);
  response = await request(app, 'POST', '/api/v1/auth/login', { email, password });
  const firstToken = json(response).data.token;
  response = await request(app, 'POST', '/api/v1/auth/login', { email, password });
  const secondToken = json(response).data.token;

  response = await request(app, 'GET', '/api/v1/auth/sessions', undefined, firstToken);
  assert.equal(response.statusCode, 200);
  assert.equal(json(response).data.length, 2);
  const other = json(response).data.find(session => !session.isCurrent);
  assert.ok(other);

  response = await request(app, 'DELETE', `/api/v1/auth/sessions/${other.id}`, undefined, firstToken);
  assert.equal(response.statusCode, 200);
  response = await request(app, 'GET', '/api/v1/auth/me', undefined, secondToken);
  assert.equal(response.statusCode, 401, 'revoking one session invalidates only that token');

  response = await request(app, 'POST', '/api/v1/auth/password/change', { currentPassword: password, newPassword: nextPassword }, firstToken);
  assert.equal(response.statusCode, 200);
  response = await request(app, 'POST', '/api/v1/auth/login', { email, password });
  assert.equal(response.statusCode, 401);
  response = await request(app, 'POST', '/api/v1/auth/login', { email, password: nextPassword });
  assert.equal(response.statusCode, 200);

  response = await request(app, 'GET', '/api/v1/auth/sessions');
  assert.equal(response.statusCode, 401);
});

test('expired reset tokens and API-key session management are rejected', async t => {
  const app = await buildApp({ logger: false });
  t.after(async () => { await app.close(); });
  const nonce = randomUUID();
  const email = `expired-reset-${nonce}@example.invalid`;
  const password = `Current-${nonce}`;
  let response = await request(app, 'POST', '/api/v1/auth/register', { name: 'Expired Reset User', email, password });
  assert.equal(response.statusCode, 201);
  const userId = json(response).data.id;
  const expired = `prt_expired_${nonce}`;
  await app.db.insert(passwordResetTokens).values({ id: `token-${nonce}`, userId, tokenHash: hashApiKey(expired), expiresAt: new Date(Date.now() - 1_000).toISOString(), createdAt: new Date(Date.now() - 2_000).toISOString() });
  response = await request(app, 'POST', '/api/v1/auth/password-reset/consume', { token: expired, newPassword: `New-${nonce}` });
  assert.equal(response.statusCode, 401);

  response = await request(app, 'POST', '/api/v1/auth/login', { email, password });
  const token = json(response).data.token;
  response = await request(app, 'POST', '/api/v1/auth/api-keys', { name: 'Session API key', scopes: ['projects:read'] }, token);
  const apiKey = json(response).data.rawKey;
  response = await app.inject({ method: 'GET', url: '/api/v1/auth/sessions', headers: { 'x-api-key': apiKey } });
  assert.equal(response.statusCode, 403);
});
