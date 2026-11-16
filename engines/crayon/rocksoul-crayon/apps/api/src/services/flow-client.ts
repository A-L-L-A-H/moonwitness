const baseUrl = () => process.env.FLOW_BASE_URL || 'http://localhost:3003';
const key = () => process.env.FLOW_INTERNAL_API_KEY || 'development-flow-internal-key';
export async function flowRequest<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, { method, headers: { 'content-type': 'application/json', 'x-flow-internal-key': key() }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30_000) });
  const payload = await response.json() as { success?: boolean; data?: T; error?: { code?: string; message?: string } };
  if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Flow service request failed');
  return payload.data as T;
}
