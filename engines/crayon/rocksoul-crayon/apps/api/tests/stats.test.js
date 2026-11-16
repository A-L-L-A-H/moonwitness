import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file::memory:';
process.env.DASHBOARD_PASSWORD = 'Youknowm@2026';

const { buildApp } = await import('../dist/app.js');

test('Dashboard password protection, user management, and dynamic telemetry', async (t) => {
  const app = await buildApp({ logger: false });
  t.after(async () => { await app.close(); });

  // 1. Unauthenticated request to GET / (Browser receives login page with 401)
  const loginPageRes = await app.inject({
    method: 'GET',
    url: '/',
    headers: { accept: 'text/html' },
  });
  assert.equal(loginPageRes.statusCode, 401);
  assert.ok(loginPageRes.body.includes('RockSoul Gateway'));
  assert.ok(loginPageRes.body.includes('Dashboard Access Key'));

  // 2. Unauthenticated request to GET / (API client receives 401 JSON)
  const unauthJsonRes = await app.inject({
    method: 'GET',
    url: '/?format=json',
  });
  assert.equal(unauthJsonRes.statusCode, 401);

  // 3. Attempt login with wrong password
  const failLoginRes = await app.inject({
    method: 'POST',
    url: '/api/dashboard/login',
    payload: { password: 'wrong-password' },
  });
  assert.equal(failLoginRes.statusCode, 401);

  // 4. Successful login with correct password (Youknowm@2026)
  const successLoginRes = await app.inject({
    method: 'POST',
    url: '/api/dashboard/login',
    payload: { password: 'Youknowm@2026' },
  });
  assert.equal(successLoginRes.statusCode, 200);
  const cookieHeader = successLoginRes.headers['set-cookie'];
  assert.ok(cookieHeader && cookieHeader.includes('rs_dashboard_auth'));

  // Extract auth cookie
  const authCookie = cookieHeader.split(';')[0];

  // 5. Authenticated request to GET / with cookie (Browser receives full dashboard)
  const dashboardRes = await app.inject({
    method: 'GET',
    url: '/',
    headers: {
      accept: 'text/html',
      cookie: authCookie,
    },
  });
  assert.equal(dashboardRes.statusCode, 200);
  assert.ok(dashboardRes.body.includes('Gateway Dashboard'));
  assert.ok(dashboardRes.body.includes('User Management'));
  assert.ok(dashboardRes.body.includes('Database Target'));

  // 6. Authenticated request to GET / with header x-dashboard-key
  const headerAuthRes = await app.inject({
    method: 'GET',
    url: '/?format=json',
    headers: {
      'x-dashboard-key': 'Youknowm@2026',
    },
  });
  assert.equal(headerAuthRes.statusCode, 200);
  const data = headerAuthRes.json().data;
  assert.ok(Array.isArray(data.users));
  assert.ok(Array.isArray(data.apiKeys));
  assert.ok(data.database.totalTables > 0);
  assert.ok(data.routes.length > 0);

  // 7. User Management: Create new user
  const createUserRes = await app.inject({
    method: 'POST',
    url: '/api/dashboard/users',
    headers: { cookie: authCookie },
    payload: {
      name: 'Dashboard Operator',
      email: 'operator@rocksoul.internal',
      password: 'SecureOperatorPass123!',
      role: 'admin',
    },
  });
  assert.equal(createUserRes.statusCode, 201);
  const newUserId = createUserRes.json().data.id;

  // 8. User Management: Toggle user status
  const toggleUserRes = await app.inject({
    method: 'PATCH',
    url: `/api/dashboard/users/${newUserId}/toggle`,
    headers: { cookie: authCookie },
  });
  assert.equal(toggleUserRes.statusCode, 200);
  assert.equal(toggleUserRes.json().data.isActive, false);

  // 9. Auth Management: Generate API Key
  const createKeyRes = await app.inject({
    method: 'POST',
    url: '/api/dashboard/api-keys',
    headers: { cookie: authCookie },
    payload: {
      name: 'Telemetry Scraper Key',
      scopes: ['system:read', 'models:read'],
    },
  });
  assert.equal(createKeyRes.statusCode, 201);
  const keyData = createKeyRes.json().data;
  assert.ok(keyData.rawKey.startsWith('rs_live_'));
  assert.ok(keyData.id);

  // 10. Auth Management: Revoke API Key
  const revokeKeyRes = await app.inject({
    method: 'DELETE',
    url: `/api/dashboard/api-keys/${keyData.id}`,
    headers: { cookie: authCookie },
  });
  assert.equal(revokeKeyRes.statusCode, 200);
  assert.equal(revokeKeyRes.json().data.isActive, false);

  // 11. Programmatic Assets API
  const assetsRes = await app.inject({
    method: 'GET',
    url: '/api/v1/assets',
  });
  assert.equal(assetsRes.statusCode, 200);
  const assetPayload = assetsRes.json().data;
  assert.ok(assetPayload.baseUrl);
  assert.ok(assetPayload.brand.logoHorizontal.includes('logo-horizontal.svg'));
  assert.ok(assetPayload.brand.lockup.includes('rocksoul-lockup.svg'));
  assert.equal(assetPayload.surfaces.length, 12);
  assert.equal(assetPayload.packs.length, 6);
  assert.ok(assetPayload.catalog.length > 20);

  // 12. Visualized README & Assets in Dashboard HTML
  const dashboardHtmlRes = await app.inject({
    method: 'GET',
    url: '/',
    headers: {
      accept: 'text/html',
      cookie: authCookie,
    },
  });
  assert.equal(dashboardHtmlRes.statusCode, 200);
  assert.ok(dashboardHtmlRes.payload.includes('tab-docs'));
  assert.ok(dashboardHtmlRes.payload.includes('tab-assets'));
  assert.ok(dashboardHtmlRes.payload.includes('logo-horizontal.svg'));
  assert.ok(dashboardHtmlRes.payload.includes('Console Specification') || dashboardHtmlRes.payload.includes('CRAYON'));

  // 13. Login screen uses canonical brand assets
  const unauthHtmlRes = await app.inject({
    method: 'GET',
    url: '/',
    headers: {
      accept: 'text/html',
    },
  });
  assert.equal(unauthHtmlRes.statusCode, 401);
  assert.ok(unauthHtmlRes.payload.includes('rocksoul-lockup.svg') || unauthHtmlRes.payload.includes('logo-horizontal.svg'));
});
