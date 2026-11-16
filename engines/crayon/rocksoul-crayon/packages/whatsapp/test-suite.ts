import { buildWhatsAppServer } from './src/server.js';
import { WebSocket } from 'ws';
import path from 'node:path';
import fs from 'node:fs';

async function runTests() {
  console.log('🚀 Starting Rocksoul WhatsApp Gateway Test Suite...');
  
  const testDbPath = path.resolve('./data/test-whatsapp.db');
  const testSessionsPath = path.resolve('./data/test-whatsapp-sessions');

  if (!fs.existsSync(path.resolve('./data'))) {
    fs.mkdirSync(path.resolve('./data'), { recursive: true });
  }

  // 1. Build and start server on test port
  const app = await buildWhatsAppServer({
    port: 3099,
    host: '127.0.0.1',
    databaseUrl: `file:${testDbPath}`,
    baseSessionsDir: testSessionsPath,
    password: '210491',
  });

  await app.listen({ port: 3099, host: '127.0.0.1' });
  console.log('✅ Server listening on http://127.0.0.1:3099');

  const baseUrl = 'http://127.0.0.1:3099';
  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}:`, err);
    }
  }

  // TEST 1: Health Endpoint
  await test('GET /health - Returns OK with status and active metrics', async () => {
    const res = await fetch(`${baseUrl}/health`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const json = await res.json();
    if (json.status !== 'ok' || json.service !== 'whatsapp-gateway') {
      throw new Error(`Unexpected health payload: ${JSON.stringify(json)}`);
    }
  });

  // TEST 2: Auth Protection on Protected Route without password
  await test('GET /chat without Auth - Redirects to /login', async () => {
    const res = await fetch(`${baseUrl}/chat`, { redirect: 'manual' });
    if (res.status !== 302 || !res.headers.get('location')?.includes('/login')) {
      throw new Error(`Expected 302 redirect to /login, got ${res.status}`);
    }
  });

  // TEST 3: Login Authentication
  let authCookie = '';
  await test('POST /login with correct password 210491 - Returns cookie and redirects to /chat', async () => {
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'password=210491',
      redirect: 'manual',
    });
    if (res.status !== 302) throw new Error(`Expected 302, got ${res.status}`);
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie || !setCookie.includes('wa_dashboard_session=')) {
      throw new Error(`Cookie wa_dashboard_session not received, got: ${setCookie}`);
    }
    authCookie = setCookie.split(';')[0];
  });

  // TEST 4: Access /chat with auth cookie (Verifies Vite React SPA or EJS served)
  await test('GET /chat with auth cookie - Serves HTML interface (HTTP 200)', async () => {
    const res = await fetch(`${baseUrl}/chat`, {
      headers: { Cookie: authCookie },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const html = await res.text();
    if (!html.includes('WhatsApp Web')) {
      throw new Error('Chat interface missing "WhatsApp Web" title');
    }
  });

  // TEST 5: API Key Generation via Admin API / Dashboard
  let rawApiKey = '';
  await test('POST /api/keys - Creates new API key', async () => {
    const res = await fetch(`${baseUrl}/api/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dashboard-key': '210491',
      },
      body: JSON.stringify({ name: 'Integration Test Key' }),
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const json = await res.json();
    if (!json.success || !json.data.rawKey) {
      throw new Error(`Failed to create API key: ${JSON.stringify(json)}`);
    }
    rawApiKey = json.data.rawKey;
  });

  // TEST 6: List API Keys with generated key
  await test('GET /api/keys - Returns created API key', async () => {
    const res = await fetch(`${baseUrl}/api/keys`, {
      headers: { Authorization: `Bearer ${rawApiKey}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error('API key list is empty');
    }
  });

  // TEST 7: WebSocket Connection and Handshake
  await test('WebSocket /ws - Establishes real-time connection and receives handshake', async () => {
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket('ws://127.0.0.1:3099/ws?key=210491');
      const timer = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket handshake timeout'));
      }, 5000);

      ws.on('open', () => {
        // Connected
      });

      ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.type === 'connected') {
            clearTimeout(timer);
            ws.close();
            resolve();
          }
        } catch (err) {
          clearTimeout(timer);
          ws.close();
          reject(err);
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  });

  // TEST 8: Session Status API
  await test('GET /sessions - Lists sessions via API Key auth', async () => {
    const res = await fetch(`${baseUrl}/sessions`, {
      headers: { Authorization: `Bearer ${rawApiKey}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) {
      throw new Error('Failed to list sessions');
    }
  });

  // TEST 9: Chat List API
  await test('GET /api/sessions/default/chats - Returns chats list (empty or populated)', async () => {
    const res = await fetch(`${baseUrl}/api/sessions/default/chats`, {
      headers: { Authorization: `Bearer ${rawApiKey}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) {
      throw new Error('Failed to fetch chats');
    }
  });

  // TEST 10: QR Code Endpoint
  await test('GET /sessions/default/qr - Returns QR status JSON or HTML view', async () => {
    const res = await fetch(`${baseUrl}/sessions/default/qr`);
    if (res.status !== 200 && res.status !== 202) {
      throw new Error(`Expected 200 or 202, got ${res.status}`);
    }
    const json = await res.json();
    if (!json.status && typeof json.sessionId !== 'string') {
      throw new Error(`Invalid QR response: ${JSON.stringify(json)}`);
    }
  });

  // TEST 11: Dashboard Settings View
  await test('GET /dashboard with auth cookie - Serves Admin Dashboard', async () => {
    const res = await fetch(`${baseUrl}/dashboard`, {
      headers: { Cookie: authCookie },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const html = await res.text();
    if (!html.includes('Dashboard')) {
      throw new Error('Dashboard page missing');
    }
  });

  // Close server
  await app.close();
  console.log(`\n🎉 Test Summary: ${passed}/${total} Tests Passed Successfully!`);

  // Clean test db
  try {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  } catch {
    // ignore
  }

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
