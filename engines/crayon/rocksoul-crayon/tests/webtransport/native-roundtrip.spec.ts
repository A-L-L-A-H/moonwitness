import { test, expect } from '@playwright/test';
import { FrameType, Priority, encodeFrame } from '../../packages/protocol/dist/index.js';

const endpoint = process.env.WEBTRANSPORT_URL ?? 'https://webtransport.localhost:6121/webtransport';

test('native WebTransport real carrier round trip', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', error => browserErrors.push(error.message));

  // WebTransport is exposed only in a secure context.
  await page.goto('https://webtransport.localhost:8443/');
  const canonicalFrame = encodeFrame({
    header: {
      magic: 0x41455031,
      protocolVersion: 1,
      frameType: FrameType.HELLO,
      flags: 0,
      streamId: 0,
      sequence: 0,
      acknowledgement: 0,
      timestamp: 1n,
      priority: Priority.CRITICAL,
      payloadLength: 0,
    },
    payload: { serializers: ['msgpack'] },
  });
  const result = await page.evaluate(async ({ url, frame }) => {
    const diagnostics = {
      userAgent: navigator.userAgent,
      location: location.href,
      secureContext: window.isSecureContext,
      webTransport: typeof (globalThis as { WebTransport?: unknown }).WebTransport,
    };
    if (typeof (globalThis as { WebTransport?: unknown }).WebTransport !== 'function') {
      return { status: 'ENVIRONMENT-BLOCKED', reason: 'native WebTransport API unavailable', diagnostics };
    }

    const transport = new WebTransport(url);
    try {
      await transport.ready;
      const stream = await transport.createBidirectionalStream();
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      const payload = new Uint8Array(frame);
      await writer.write(payload);
      const chunk = await reader.read();
      const received = chunk.value ? Array.from(new Uint8Array(chunk.value)) : [];
      await writer.close();
      await reader.cancel();
      await transport.close();
      return { status: 'PASS', sent: Array.from(payload), received, diagnostics };
    } catch (error) {
      transport.close();
      return { status: 'ENVIRONMENT-BLOCKED', reason: String(error), diagnostics };
    }
  }, { url: endpoint, frame: Array.from(canonicalFrame) });

  expect(result.status, JSON.stringify(result)).toBe('PASS');
  expect(result.received).toEqual(result.sent);
  expect(browserErrors).toEqual([]);
});
