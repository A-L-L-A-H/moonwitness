import https from 'node:https';
import fs from 'node:fs';

const port = Number(process.env.WT_PAGE_PORT ?? 8443);
const cert = process.env.WT_CERT_FILE ?? 'infra/webtransport/certs/generated/cert.pem';
const key = process.env.WT_KEY_FILE ?? 'infra/webtransport/certs/generated/key.pem';

const server = https.createServer({ cert: fs.readFileSync(cert), key: fs.readFileSync(key) }, (_req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end('<!doctype html><title>WebTransport E2E Harness</title>');
});

server.listen(port, '127.0.0.1', () => {
  console.log(`secure WebTransport test page listening on https://webtransport.localhost:${port}`);
});
