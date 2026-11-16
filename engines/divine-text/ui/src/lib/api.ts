export type Health = { ok: boolean; version: string; ui: boolean; ai?: unknown };
export type Report = any;
export async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function postJSON<T>(path: string, body: any): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}
export async function runResearch(topic: string): Promise<any> {
  return getJSON(`/api/research/run?topic=${encodeURIComponent(topic)}`);
}
export async function searchQuran(q: string, limit = 20): Promise<any[]> {
  if (!q.trim()) return [];
  return getJSON(`/api/quran/search?q=${encodeURIComponent(q)}&limit=${limit}`);
}
