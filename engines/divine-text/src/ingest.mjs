import fs from 'node:fs';
import path from 'node:path';
import { fileMeta } from './provenance.mjs';

function assertObject(x, label) {
  if (!x || typeof x !== 'object' || Array.isArray(x)) throw new Error(`${label} must be an object`);
}

export function loadJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = JSON.parse(raw);
  return { parsed, raw };
}

export function normalizeHadithRecord(r, index, sourceId) {
  assertObject(r, `hadith[${index}]`);
  const arabic = r.arabic ?? r.text_ar ?? r.text ?? null;
  const english = r.english ?? r.translation ?? r.text_en ?? null;
  const reference = r.reference ?? r.ref ?? r.hadith_reference ?? null;
  const collection = r.collection ?? r.book ?? sourceId;
  if (!arabic && !english) throw new Error(`hadith[${index}] has no Arabic/English text`);
  return {
    id: String(r.id ?? r.hadith_id ?? `${sourceId}:${index + 1}`),
    collection: String(collection),
    book: r.book ?? null,
    chapter: r.chapter ?? null,
    reference: reference ? String(reference) : null,
    arabic: arabic ? String(arabic) : null,
    english: english ? String(english) : null,
    isnad: r.isnad ?? null,
    matn: r.matn ?? null,
    grade: r.grade ?? null,
    source_record_index: index
  };
}

export function ingestHadithJson(inputFile, outDir, meta = {}) {
  const { parsed } = loadJson(inputFile);
  const records = Array.isArray(parsed) ? parsed : (parsed.hadiths ?? parsed.data ?? parsed.records ?? null);
  if (!Array.isArray(records)) throw new Error('Unsupported hadith JSON shape: expected array or .hadiths/.data/.records');
  const normalized = records.map((r, i) => normalizeHadithRecord(r, i, meta.source_id ?? 'unknown'));
  fs.mkdirSync(outDir, { recursive: true });
  const rawCopy = path.join(outDir, 'raw.json');
  fs.copyFileSync(inputFile, rawCopy);
  const normalizedPath = path.join(outDir, 'normalized.jsonl');
  fs.writeFileSync(normalizedPath, normalized.map(x => JSON.stringify(x)).join('\n') + (normalized.length ? '\n' : ''));
  const manifest = {
    schema_version: '1.0',
    source_id: meta.source_id ?? 'unknown',
    source_url: meta.source_url ?? null,
    edition: meta.edition ?? null,
    language: meta.language ?? ['ar'],
    ingested_at: new Date().toISOString(),
    record_count: normalized.length,
    raw: fileMeta(rawCopy),
    normalized: fileMeta(normalizedPath),
    status: 'INGESTED_AND_NORMALIZED'
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

export function generateCorpusGapReport(statusFile, outputFile) {
  const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
  const gaps = [];
  for (const [name, value] of Object.entries(status.local_corpora ?? {})) {
    if (!String(value.status).startsWith('NORMALIZED')) gaps.push({ corpus: name, status: value.status });
  }
  const report = {
    generated_at: new Date().toISOString(),
    version: status.version,
    missing_or_pending: gaps,
    policy: 'PENDING means data unavailable locally; it is not a zero score.'
  };
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  return report;
}
