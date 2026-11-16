import { useState } from 'react';
import { Globe, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';

export function BrowserWorkspace() {
  const [url, setUrl] = useState('https://example.com'); const [result, setResult] = useState<{ status: number; body: string }>(); const [error, setError] = useState<string>(); const [loading, setLoading] = useState(false);
  const fetchPage = async () => { setError(undefined); setLoading(true); try { setResult(await api.ai.fetchBrowserPage(url)); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } };
  return (
    <Card className="min-h-[420px]">
      <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="size-5 text-primary" aria-hidden="true" /> Browser workspace</CardTitle></CardHeader>
      <CardContent aria-busy={loading} className="space-y-4"><div className="flex flex-col gap-2 sm:flex-row"><Input value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Public URL" /><Button type="button" disabled={loading} className="min-h-10 sm:h-9" onClick={() => void fetchPage()}><Search className="mr-2 size-4" aria-hidden="true" />{loading ? 'Fetching…' : 'Fetch'}</Button></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{result && <p role="status" aria-live="polite" className="text-sm text-muted-foreground">HTTP {result.status}</p>}{result && <pre aria-label="Fetched page content" className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap">{result.body}</pre>}</CardContent>
    </Card>
  );
}
