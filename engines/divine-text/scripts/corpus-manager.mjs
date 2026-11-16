import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(await readFile(path.join(root, 'data', 'corpora', 'registry.json'), 'utf8'));
const DOWNLOAD_USER_AGENT = 'DivineTextVerification/6.3 local-research-corpus-manager';

async function sha256File(filePath) {
  const data = await readFile(filePath);
  return createHash('sha256').update(data).digest('hex');
}

async function ensureDir(dir) { await mkdir(dir, { recursive: true }); }

function sourceRoot(id) { return path.join(root, 'data', 'corpora', id); }

async function fetchBytes(url, headers = {}) {
  const res = await fetch(url, { headers: { 'user-agent': DOWNLOAD_USER_AGENT, ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function writeArtifact(id, logicalName, bytes, metadata) {
  const dir = path.join(sourceRoot(id), 'raw');
  await ensureDir(dir);
  const safe = logicalName.replaceAll('\\', '/').replace(/^\/+/, '');
  const filePath = path.join(dir, safe);
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, bytes);
  const digest = createHash('sha256').update(bytes).digest('hex');
  const metaPath = `${filePath}.manifest.json`;
  await writeFile(metaPath, JSON.stringify({ ...metadata, bytes: bytes.length, sha256: digest, downloaded_at: new Date().toISOString() }, null, 2));
  return { filePath, bytes: bytes.length, sha256: digest };
}

async function existingRawFiles(id) {
  const base = path.join(sourceRoot(id), 'raw');
  if (!existsSync(base)) return [];
  const out = [];
  async function walk(dir) {
    for (const ent of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) await walk(p);
      else if (ent.isFile() && !ent.name.endsWith('.manifest.json')) out.push(p);
    }
  }
  await walk(base);
  return out;
}

async function downloadHadith() {
  const id = 'hadith';
  const api = registry.sources.find(x => x.id === id).contents_api;
  const contents = await fetch(api).then(r => r.json());
  if (!Array.isArray(contents)) throw new Error('Unexpected GitHub contents response');
  const results = [];
  for (const entry of contents) {
    if (entry.type === 'file' && entry.name.endsWith('.json')) {
      const bytes = await fetchBytes(entry.download_url);
      results.push(await writeArtifact(id, entry.name, bytes, {
        source_id: id,
        source_url: entry.download_url,
        repository: 'AhmedBaset/hadith-json',
        ref: 'v1.2.0',
        kind: 'hadith_collection'
      }));
    } else if (entry.type === 'dir') {
      const sub = await fetch(entry.url, { headers: { 'user-agent': DOWNLOAD_USER_AGENT } });
      if (!sub.ok) throw new Error(`${sub.status} ${sub.statusText} for ${entry.url}`);
      const items = await sub.json();
      for (const child of items) {
        if (child.type !== 'file' || !child.name.endsWith('.json')) continue;
        const bytes = await fetchBytes(child.download_url);
        results.push(await writeArtifact(id, path.join(entry.name, child.name), bytes, {
          source_id: id,
          source_url: child.download_url,
          repository: 'AhmedBaset/hadith-json',
          ref: 'v1.2.0',
          kind: 'hadith_collection'
        }));
      }
    }
  }
  return results;
}

async function downloadSefaria(id) {
  const src = registry.sources.find(x => x.id === id);
  const results = [];
  for (const book of src.books) {
    const url = src.api.replace('{book}', encodeURIComponent(book));
    const bytes = await fetchBytes(url, { accept: 'application/json' });
    results.push(await writeArtifact(id, `${book}.json`, bytes, {
      source_id: id,
      source_url: url,
      requested_book: book,
      kind: 'sefaria_text_api',
      version_request: 'hebrew'
    }));
  }
  return results;
}

async function downloadRawBooks(id) {
  const src = registry.sources.find(x => x.id === id);
  const results = [];
  for (const book of src.books) {
    const bookAbbr = book === 'Matthew' ? 'Matt' : book;
    const url = src.base.replace('{book}', encodeURIComponent(bookAbbr));
    const bytes = await fetchBytes(url, { accept: 'application/json' });
    results.push(await writeArtifact(id, `${book}.json`, bytes, {
      source_id: id,
      source_url: url,
      requested_book: book,
      kind: 'public_domain_bible_witness',
      license: src.license
    }));
  }
  return results;
}

async function verifyLocal(id) {
  const files = await existingRawFiles(id);
  const results = [];
  for (const p of files) {
    results.push({ file: path.relative(root, p), bytes: (await stat(p)).size, sha256: await sha256File(p) });
  }
  return results;
}

async function status() {
  const out = [];
  for (const src of registry.sources) {
    const files = await existingRawFiles(src.id);
    let expected = 0;
    if (src.books) expected = src.books.length;
    else if (src.id === 'hadith') expected = 17;

    let computedStatus = 'MISSING';
    if (src.kind === 'local') computedStatus = 'LOCAL';
    else if (files.length === 0) computedStatus = 'MISSING';
    else if (expected > 0 && files.length >= expected) computedStatus = 'READY';
    else computedStatus = 'LOCAL_PARTIAL_OR_READY';

    out.push({
      id: src.id,
      label: src.label,
      kind: src.kind,
      status: computedStatus,
      raw_files: src.kind === 'local' ? 1 : files.length
    });
  }
  return out;
}

async function downloadOne(id) {
  if (id === 'quran') return verifyLocal('quran');
  if (id === 'hadith') return downloadHadith();
  if (id === 'torah' || id === 'psalms' || id === 'prophets') return downloadSefaria(id);
  if (id === 'gospels' || id === 'epistles') return downloadRawBooks(id);
  throw new Error(`Unknown corpus: ${id}`);
}

export { status as getCorpusStatus, verifyLocal, downloadOne as downloadCorpus };

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cmd = process.argv[2] || 'status';
  (async () => {
    try {
      if (cmd === 'list') {
        for (const s of registry.sources) console.log(`${s.id}\t${s.label}`);
      } else if (cmd === 'status') {
        console.log(JSON.stringify(await status(), null, 2));
      } else if (cmd === 'verify') {
        const id = process.argv[3];
        const ids = id ? [id] : registry.sources.map(s => s.id);
        const out = {};
        for (const x of ids) out[x] = await verifyLocal(x);
        console.log(JSON.stringify(out, null, 2));
      } else if (cmd === 'download') {
        const id = process.argv[3];
        if (!id) throw new Error('Usage: node scripts/corpus-manager.mjs download <id|all>');
        const ids = id === 'all' ? registry.sources.filter(s => s.kind !== 'local').map(s => s.id) : [id];
        const out = {};
        for (const x of ids) {
          try { out[x] = { ok: true, files: await downloadOne(x) }; }
          catch (e) { out[x] = { ok: false, error: e.message }; }
        }
        console.log(JSON.stringify(out, null, 2));
        if (Object.values(out).some(x => !x.ok)) process.exitCode = 2;
      } else {
        throw new Error('Commands: list | status | verify [id] | download <id|all>');
      }
    } catch (e) {
      console.error(`[DTV corpus] ${e.message}`);
      process.exitCode = 1;
    }
  })();
}
