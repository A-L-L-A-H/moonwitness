import https from 'node:https';
import fs from 'node:fs';
import { X509Certificate, createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { FrameDecoder, FrameType, Priority, encodeFrame } from '../../packages/protocol/dist/index.js';

const pageServer = https.createServer({
  cert: fs.readFileSync(process.env.WT_PAGE_CERT_FILE ?? '/certs/page-cert.pem'),
  key: fs.readFileSync(process.env.WT_PAGE_KEY_FILE ?? '/certs/page-key.pem'),
}, (_req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end('<!doctype html><title>WebTransport Docker E2E</title>');
});

await new Promise(resolve => pageServer.listen(8443, '0.0.0.0', resolve));
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
const certificateHash = [...createHash('sha256')
  .update(new X509Certificate(fs.readFileSync('/certs/cert.pem')).raw)
  .digest()];
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', error => errors.push(error.message));

const canonicalFrame = encodeFrame({
  header: { magic: 0x41455031, protocolVersion: 1, frameType: FrameType.HELLO, flags: 0, streamId: 0, sequence: 0, acknowledgement: 0, timestamp: 1n, priority: Priority.CRITICAL, payloadLength: 0 },
  payload: { serializers: ['msgpack'] },
});

try {
  await page.goto(process.env.WT_PAGE_URL);
  const result = await page.evaluate(async ({ url, frame, certificateHash }) => {
    const diagnostics = { secureContext: window.isSecureContext, webTransport: typeof globalThis.WebTransport, userAgent: navigator.userAgent, location: location.href };
    if (!diagnostics.secureContext || diagnostics.webTransport !== 'function') return { status: 'ENVIRONMENT-BLOCKED', diagnostics };
    const roundTrip = async (bytes, cuts = []) => {
      const transport = new WebTransport(url, { serverCertificateHashes: [{ algorithm: 'sha-256', value: new Uint8Array(certificateHash) }] });
      await transport.ready;
      try {
        const stream = await transport.createBidirectionalStream();
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        let offset = 0;
        for (const end of [...cuts, bytes.length]) { await writer.write(bytes.slice(offset, end)); offset = end; }
        const received = new Uint8Array(bytes.length);
        offset = 0;
        while (offset < bytes.length) {
          const read = await reader.read();
          if (read.done) throw new Error(`stream ended at ${offset}/${bytes.length}`);
          const chunk = new Uint8Array(read.value);
          received.set(chunk, offset);
          offset += chunk.length;
        }
        await writer.close();
        await reader.cancel();
        transport.close();
        await transport.closed;
        return Array.from(received);
      } catch (error) { transport.close(); throw error; }
    };
    const bytes = new Uint8Array(frame);
    const invalidHash = new Uint8Array(certificateHash);
    invalidHash[0] ^= 0xff;
    const rejectedTransport = new WebTransport(url, { serverCertificateHashes: [{ algorithm: 'sha-256', value: invalidHash }] });
    let invalidCertificateRejected = false;
    try { await rejectedTransport.ready; } catch { invalidCertificateRejected = true; } finally { rejectedTransport.close(); }
    const repeated = [];
    for (let index = 0; index < 25; index += 1) repeated.push(await roundTrip(bytes));
    const partial = await roundTrip(bytes, [1, 7, Math.floor(bytes.length / 2)]);
    const joined = new Uint8Array(bytes.length * 2);
    joined.set(bytes); joined.set(bytes, bytes.length);
    const concatenated = await roundTrip(joined);
    const concurrent = await Promise.all(Array.from({ length: 8 }, () => roundTrip(bytes)));
    return { status: 'PASS', repeated, partial, concatenated, concurrent, invalidCertificateRejected, diagnostics };
  }, { url: process.env.WT_URL, certificateHash, frame: Array.from(canonicalFrame) });
  if (result.status !== 'PASS') throw new Error(JSON.stringify(result));
  const expected = JSON.stringify(Array.from(canonicalFrame));
  for (const bytes of [...result.repeated, result.partial, ...result.concurrent]) if (JSON.stringify(bytes) !== expected) throw new Error('carrier byte equality failed');
  if (new FrameDecoder().push(new Uint8Array(result.partial)).length !== 1) throw new Error('partial-frame decode failed');
  if (new FrameDecoder().push(new Uint8Array(result.concatenated)).length !== 2) throw new Error('concatenated-frame decode failed');
  if (!result.invalidCertificateRejected) throw new Error('invalid certificate hash was accepted');
  const unexpectedErrors = errors.filter(message => !message.includes('QUIC_TLS_CERTIFICATE_UNKNOWN'));
  if (unexpectedErrors.length) throw new Error(`browser errors: ${JSON.stringify(unexpectedErrors)}`);
  console.log(JSON.stringify({ status: 'PASS', runs: 25, partialFrames: 1, concatenatedFrames: 2, concurrentStreams: 8, invalidCertificateRejected: true, cleanup: 'transport.closed resolved', diagnostics: result.diagnostics, aep: 'decoded', unexpectedErrors }));
} finally {
  await context.close();
  await browser.close();
  await new Promise(resolve => pageServer.close(resolve));
}
