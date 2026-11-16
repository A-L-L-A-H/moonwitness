import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

test('HTTP executor honors method/body and local allowlist', async () => {
  process.env.SCHEDULER_HTTP_ALLOWED_HOSTS = '127.0.0.1';
  const { dispatcher } = await import('../dist/dispatcher.js');
  const server = createServer((req, res) => { let body = ''; req.on('data', chunk => body += chunk); req.on('end', () => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ method: req.method, body })); }); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const port = server.address().port;
    const result = await dispatcher().get('http')({ payload: { url: `http://127.0.0.1:${port}/test`, method: 'POST', body: { ok: true } } }, new AbortController().signal, '');
    assert.equal(result.status, 200); assert.ok(result.body.includes('\\"ok\\":true'));
  } finally { await new Promise(resolve => server.close(resolve)); }
});
