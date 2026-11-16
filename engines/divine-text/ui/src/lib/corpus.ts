export async function corpusStatus(){
  const r=await fetch('/api/corpus/status');
  if(!r.ok) throw new Error(`Corpus status failed: ${r.status}`);
  return r.json();
}
export async function downloadCorpus(target='all'){
  const r=await fetch(`/api/corpus/download?target=${encodeURIComponent(target)}`);
  const text=await r.text();
  if(!r.ok) throw new Error(text || `Corpus download failed: ${r.status}`);
  return JSON.parse(text);
}
export async function verifyCorpus(id?: string){
  const r=await fetch(`/api/corpus/verify${id?`?id=${encodeURIComponent(id)}`:''}`);
  const text=await r.text();
  if(!r.ok) throw new Error(text || `Corpus verify failed: ${r.status}`);
  return JSON.parse(text);
}
