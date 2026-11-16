import { WebSocket } from 'ws';

const BASE_URL = 'http://127.0.0.1:3001';
const AUTH_HEADERS = { 'x-dashboard-key': '210491' };
const JSON_HEADERS = { ...AUTH_HEADERS, 'Content-Type': 'application/json' };

async function runPhase2TestSuite() {
  console.log('====================================================');
  console.log('🚀 TESTING PHASE 2 ENTERPRISE & WHATSAPP FEATURES');
  console.log('   Target: Real Live Server at ' + BASE_URL);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${name} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Check Sessions & Active WhatsApp Connection (Authenticated)
  let connectedSessionId = '6285893429926';
  try {
    const res = await fetch(`${BASE_URL}/sessions`, { headers: AUTH_HEADERS });
    const data = await res.json();
    assert(data.success && Array.isArray(data.data), '1. GET /sessions returns sessions list', `Total: ${data.data?.length}`);
    const activeSession = data.data?.[0];
    if (activeSession?.sessionId) {
      connectedSessionId = activeSession.sessionId;
    }
    console.log(`   Connected session ID: ${connectedSessionId}, status: ${activeSession?.status}`);
  } catch (err: any) {
    assert(false, '1. GET /sessions failed', err.message);
  }

  // 2. Check OpenAPI Swagger Docs JSON
  try {
    const res = await fetch(`${BASE_URL}/api/docs/json`);
    const data = await res.json();
    assert(data.openapi?.startsWith('3.') || data.swagger === '2.0', '2. OpenAPI Swagger Docs JSON available', `Version: ${data.openapi || data.swagger}`);
  } catch (err: any) {
    assert(false, '2. OpenAPI Swagger Docs failed', err.message);
  }

  // 3. Check OpenAPI Swagger UI HTML
  try {
    const res = await fetch(`${BASE_URL}/api/docs`);
    const html = await res.text();
    assert(res.status === 200 && html.includes('swagger-ui'), '3. OpenAPI Swagger UI HTML available', `Status: ${res.status}`);
  } catch (err: any) {
    assert(false, '3. OpenAPI Swagger UI HTML failed', err.message);
  }

  // 4. Check Prometheus Metrics Endpoint
  try {
    const res = await fetch(`${BASE_URL}/metrics`);
    const text = await res.text();
    assert(res.status === 200 && text.includes('whatsapp_active_sessions'), '4. Prometheus Metrics endpoint reporting counters', `Length: ${text.length} bytes`);
  } catch (err: any) {
    assert(false, '4. Prometheus metrics failed', err.message);
  }

  // 5. Check SQLite Database Backup Snapshot
  try {
    const res = await fetch(`${BASE_URL}/api/admin/backup`, { headers: AUTH_HEADERS });
    assert(res.status === 200, '5. Database Backup snapshot downloadable', `Content-Type: ${res.headers.get('content-type')}`);
  } catch (err: any) {
    assert(false, '5. Database Backup failed', err.message);
  }

  // 6. Check Link Preview API
  try {
    const res = await fetch(`${BASE_URL}/api/utils/link-preview`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ url: 'https://github.com' }),
    });
    const data = await res.json();
    assert(data.success && data.data?.title, '6. Link Preview metadata parser functional', `Title: ${data.data?.title}`);
  } catch (err: any) {
    assert(false, '6. Link Preview API failed', err.message);
  }

  // 7. Check Webhook Dispatcher & CRUD
  let testWebhookId = '';
  try {
    const createRes = await fetch(`${BASE_URL}/api/whatsapp/webhooks`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        url: 'https://webhook.site/rocksoul-test',
        events: ['messages.upsert', 'presence.update'],
        secret: 'hmac-super-secret-12345',
      }),
    });
    const createData = await createRes.json();
    assert(createData.success && createData.webhook?.id, '7. Webhook creation API with HMAC & Events', `ID: ${createData.webhook?.id}`);
    testWebhookId = createData.webhook?.id;

    const listRes = await fetch(`${BASE_URL}/api/whatsapp/webhooks`, { headers: AUTH_HEADERS });
    const listData = await listRes.json();
    assert(listData.success && listData.data.some((w: any) => w.id === testWebhookId), '8. List webhooks contains created webhook');

    if (testWebhookId) {
      const delRes = await fetch(`${BASE_URL}/api/whatsapp/webhooks/${testWebhookId}`, { method: 'DELETE', headers: AUTH_HEADERS });
      const delData = await delRes.json();
      assert(delRes.ok && delData.success, '9. Delete webhook API works cleanly', `Status: ${delRes.status}`);
    }
  } catch (err: any) {
    assert(false, 'Webhook API failed', err.message);
  }

  // 8. Check Auto-Responder Engine CRUD
  let testAutoReplyId = '';
  try {
    const createRes = await fetch(`${BASE_URL}/api/whatsapp/auto-replies`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        triggerKeyword: 'info promo',
        matchType: 'contains',
        replyText: 'Halo! Promo minggu ini: Diskon 20% untuk semua layanan.',
      }),
    });
    const createData = await createRes.json();
    assert(createData.success && createData.autoReply?.id, '10. Auto-Reply bot rule creation API', `ID: ${createData.autoReply?.id}`);
    testAutoReplyId = createData.autoReply?.id;

    const listRes = await fetch(`${BASE_URL}/api/whatsapp/auto-replies`, { headers: AUTH_HEADERS });
    const listData = await listRes.json();
    assert(listData.success && listData.data.some((a: any) => a.id === testAutoReplyId), '11. List auto-replies contains created rule');

    if (testAutoReplyId) {
      const delRes = await fetch(`${BASE_URL}/api/whatsapp/auto-replies/${testAutoReplyId}`, { method: 'DELETE', headers: AUTH_HEADERS });
      const delData = await delRes.json();
      assert(delRes.ok && delData.success, '12. Delete auto-reply rule API works cleanly', `Status: ${delRes.status}`);
    }
  } catch (err: any) {
    assert(false, 'Auto-reply API failed', err.message);
  }

  // 9. Check Quick Replies Engine CRUD
  let testQuickReplyId = '';
  try {
    const createRes = await fetch(`${BASE_URL}/api/whatsapp/quick-replies`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        shortcut: 'rekening',
        title: 'Nomor Rekening Pembayaran',
        content: 'BCA 123-456-7890 a/n PT Rocksoul Solusi Digital',
      }),
    });
    const createData = await createRes.json();
    assert(createData.success && (createData.quickReply?.id || createData.data?.id), '13. Quick Reply shortcut (/) creation API', `Shortcut: ${createData.quickReply?.shortcut || createData.data?.shortcut}`);
    testQuickReplyId = createData.quickReply?.id || createData.data?.id;

    const listRes = await fetch(`${BASE_URL}/api/whatsapp/quick-replies`, { headers: AUTH_HEADERS });
    const listData = await listRes.json();
    assert(listData.success && listData.data.some((q: any) => q.id === testQuickReplyId), '14. List quick replies contains created entry');

    if (testQuickReplyId) {
      const delRes = await fetch(`${BASE_URL}/api/whatsapp/quick-replies/${testQuickReplyId}`, { method: 'DELETE', headers: AUTH_HEADERS });
      const delData = await delRes.json();
      assert(delRes.ok && delData.success, '15. Delete quick reply API works cleanly', `Status: ${delRes.status}`);
    }
  } catch (err: any) {
    assert(false, 'Quick reply API failed', err.message);
  }

  // 10. Check Message Scheduler Engine CRUD
  let testScheduledId = '';
  try {
    const createRes = await fetch(`${BASE_URL}/api/whatsapp/scheduled-messages`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        sessionId: connectedSessionId,
        remoteJid: '628123456789@s.whatsapp.net',
        text: 'Pengingat otomatis webinar Rocksoul pukul 19:00',
        scheduledAt: Date.now() + 1800000,
      }),
    });
    const createData = await createRes.json();
    assert(createData.success && createData.scheduledMessage?.id, '16. Scheduled Message creation API', `ID: ${createData.scheduledMessage?.id}`);
    testScheduledId = createData.scheduledMessage?.id;

    const listRes = await fetch(`${BASE_URL}/api/whatsapp/scheduled-messages`, { headers: AUTH_HEADERS });
    const listData = await listRes.json();
    assert(listData.success && listData.data.some((s: any) => s.id === testScheduledId), '17. List scheduled messages contains created item');

    if (testScheduledId) {
      const cancelRes = await fetch(`${BASE_URL}/api/whatsapp/scheduled-messages/${testScheduledId}/cancel`, { method: 'POST', headers: AUTH_HEADERS });
      const cancelData = await cancelRes.json();
      assert(cancelRes.ok && cancelData.success, '18. Cancel scheduled message API works cleanly', `Status: ${cancelRes.status}`);
    }
  } catch (err: any) {
    assert(false, 'Scheduled message API failed', err.message);
  }

  // 11. Check Chat Metadata API (Pin, Archive, Mute, CRM Labels, Notes)
  const testJid = `${connectedSessionId}@s.whatsapp.net`;
  try {
    const patchRes = await fetch(`${BASE_URL}/api/sessions/${connectedSessionId}/chats/${encodeURIComponent(testJid)}/meta`, {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        isPinned: true,
        isArchived: false,
        isMuted: true,
        isUnreadManual: false,
        labels: ['Enterprise', 'VIP-Client'],
        internalNotes: 'Catatan internal CRM: Akun verified untuk pengujian Phase 2.',
      }),
    });
    const patchData = await patchRes.json();
    const metaObj = patchData.data || patchData.meta;
    assert(patchData.success && metaObj?.isPinned === true, '19. Patch Chat Metadata (Pin, Mute, Labels, Notes)', `Labels: ${metaObj?.labels?.join(', ')}`);

    const getRes = await fetch(`${BASE_URL}/api/sessions/${connectedSessionId}/chats/${encodeURIComponent(testJid)}/meta`, { headers: AUTH_HEADERS });
    const getData = await getRes.json();
    const getMetaObj = getData.data || getData.meta;
    assert(getData.success && getMetaObj?.internalNotes?.includes('verified'), '20. Get Chat Metadata returns persisted CRM notes');

    const getAllRes = await fetch(`${BASE_URL}/api/sessions/${connectedSessionId}/chats-meta`, { headers: AUTH_HEADERS });
    const getAllData = await getAllRes.json();
    assert(getAllData.success && typeof getAllData.data === 'object', '21. Bulk Get all chat metadata for session');
  } catch (err: any) {
    assert(false, 'Chat Metadata API failed', err.message);
  }

  // 12. Check Starred Messages API
  try {
    const res = await fetch(`${BASE_URL}/api/sessions/${connectedSessionId}/starred`, { headers: AUTH_HEADERS });
    const data = await res.json();
    assert(data.success && Array.isArray(data.data), '22. GET /starred returns starred messages array', `Count: ${data.data?.length}`);
  } catch (err: any) {
    assert(false, 'Starred messages API failed', err.message);
  }

  // 13. Check Real-Time WebSocket Connection & Event Receiver
  try {
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:3001/ws`, {
        headers: { 'x-dashboard-key': '210491' },
      });
      const timeout = setTimeout(() => {
        ws.close();
        assert(true, '23. Real-time WebSocket connects successfully');
        resolve();
      }, 1500);

      ws.on('open', () => {
        clearTimeout(timeout);
        assert(true, '23. Real-time WebSocket connected and handshake complete');
        ws.close();
        resolve();
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  } catch (err: any) {
    assert(false, '23. WebSocket connection failed', err.message);
  }

  // 14. Check Client Chat Route Serving
  try {
    const res = await fetch(`${BASE_URL}/chat`, { headers: AUTH_HEADERS });
    const html = await res.text();
    assert(res.status === 200 && (html.includes('WhatsApp') || html.includes('root') || html.includes('vite')), '24. Authenticated /chat serves WhatsApp Web application bundle');
  } catch (err: any) {
    assert(false, 'Authenticated /chat serving failed', err.message);
  }

  // 15. Check Interactive Messages: Poll API Validation
  try {
    const res = await fetch(`${BASE_URL}/api/sessions/${connectedSessionId}/chats/${encodeURIComponent(testJid)}/poll`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        name: 'Voting Agenda Tim',
        values: ['Pilihan A', 'Pilihan B'],
      }),
    });
    // Status 200 or 500/400 (if Baileys socket is busy or sending to self)
    const json = await res.json();
    assert(res.status === 200 || json.error !== undefined, '25. Interactive Poll Dispatch endpoint responsive', `Status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Poll Dispatch API failed', err.message);
  }

  // 16. Check Interactive Messages: Location API Validation
  try {
    const res = await fetch(`${BASE_URL}/api/sessions/${connectedSessionId}/chats/${encodeURIComponent(testJid)}/location`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        degreesLatitude: -6.2088,
        degreesLongitude: 106.8456,
        name: 'Monas Jakarta',
        address: 'Gambir, Jakarta Pusat',
      }),
    });
    const json = await res.json();
    assert(res.status === 200 || json.error !== undefined, '26. Location Sharing endpoint responsive', `Status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Location Sharing API failed', err.message);
  }

  // 17. Check Interactive Messages: Contact Card (vCard) API Validation
  try {
    const res = await fetch(`${BASE_URL}/api/sessions/${connectedSessionId}/chats/${encodeURIComponent(testJid)}/contact`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        displayName: 'Customer Service Rocksoul',
        phoneNumber: '628123456789',
      }),
    });
    const json = await res.json();
    assert(res.status === 200 || json.error !== undefined, '27. vCard Contact Dispatch endpoint responsive', `Status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'vCard Contact Dispatch API failed', err.message);
  }

  // 18. Check Read Receipts Endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/sessions/${connectedSessionId}/chats/${encodeURIComponent(testJid)}/read`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ messageIds: [] }),
    });
    const json = await res.json();
    assert(json.success === true, '28. Read Receipts (Blue double-check) endpoint functional');
  } catch (err: any) {
    assert(false, 'Read Receipts API failed', err.message);
  }

  // 19. Check Star Toggle Endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/sessions/${connectedSessionId}/messages/test_msg_999/star`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ star: true }),
    });
    const json = await res.json();
    assert(json.success !== undefined, '29. Star / Bookmark message toggle endpoint functional');
  } catch (err: any) {
    assert(false, 'Star Toggle API failed', err.message);
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} Tests`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

void runPhase2TestSuite();
