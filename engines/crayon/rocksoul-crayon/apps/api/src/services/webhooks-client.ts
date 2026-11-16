const baseUrl = () => (process.env.WEBHOOKS_BASE_URL || '').replace(/\/$/, '');
const key = () => process.env.WEBHOOKS_INTERNAL_API_KEY || '';
export async function webhookRequest(path: string, method = 'GET', body?: unknown) {
  if (!baseUrl() || !key()) throw new Error('Webhook service integration is unavailable');
  const response = await fetch(`${baseUrl()}${path}`, { method, headers: { 'content-type': 'application/json', 'x-webhooks-internal-key': key() }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15_000) });
  const json = await response.json() as any;
  if (!response.ok || !json.success) throw new Error(json?.error?.message || `Webhook service returned ${response.status}`);
  return json.data;
}
