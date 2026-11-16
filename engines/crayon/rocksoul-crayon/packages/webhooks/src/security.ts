import { isIP } from 'node:net';
const privateV4 = /^(10\.|127\.|0\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/;
export function validateOutboundUrl(value: string, allowHttp: boolean, allowPrivate: boolean) {
  let url: URL; try { url = new URL(value); } catch { throw new Error('Webhook URL is invalid'); }
  if (url.protocol !== 'https:' && !(allowHttp && url.protocol === 'http:')) throw new Error('Webhook URLs must use HTTPS');
  if (url.username || url.password) throw new Error('Webhook URL credentials are not allowed');
  const host = url.hostname.toLowerCase();
  if (!allowPrivate && (host === 'localhost' || host.endsWith('.localhost') || host === '::1' || privateV4.test(host) || (isIP(host) === 6 && (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80'))))) throw new Error('Private webhook targets are not allowed');
  return url.toString();
}
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => {
    return /password|secret|token|authorization|cookie|apikey|privatekey|accesstoken|refreshtoken/i.test(key)
      ? [key, '[REDACTED]']
      : [key, redact(item)];
  }));
}
