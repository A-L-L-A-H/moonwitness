import { useEffect, useState } from 'react';
import { Code2, FileCode2, Folder } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';

export function CodingWorkspace() {
  const [files, setFiles] = useState<Array<{ name: string; path: string; kind: string }>>([]);
  const [selected, setSelected] = useState<{ path: string; content: string }>();
  const [error, setError] = useState<string>();
  useEffect(() => { void api.ai.listWorkspaceFiles().then(setFiles).catch((e: Error) => setError(e.message)); }, []);
  const open = async (file: { path: string; kind: string }) => { if (file.kind !== 'file') return; try { setSelected(await api.ai.readWorkspaceFile(file.path)); } catch (e) { setError((e as Error).message); } };
  return (
    <Card className="min-h-[420px]">
      <CardHeader><CardTitle className="flex items-center gap-2"><Code2 aria-hidden="true" className="size-5 text-primary" /> Coding workspace</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[260px_1fr]">{error && <p role="alert" className="text-sm text-destructive md:col-span-2">{error}</p>}<div className="space-y-1" aria-label="Workspace files">{files.map((file) => <Button key={file.path} variant="ghost" className="min-h-10 w-full justify-start gap-2 text-sm" onClick={() => void open(file)}>{file.kind === 'directory' ? <Folder aria-hidden="true" className="size-4" /> : <FileCode2 aria-hidden="true" className="size-4" />}{file.name}</Button>)}</div><pre aria-label="Selected workspace file" className="min-h-80 overflow-auto rounded-md bg-muted p-4 text-xs">{selected?.content ?? 'Select a file to inspect its current workspace contents.'}</pre></CardContent>
    </Card>
  );
}
