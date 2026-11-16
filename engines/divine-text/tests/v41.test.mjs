import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ingestHadithJson, generateCorpusGapReport } from '../src/ingest.mjs';
import { buildEvidenceGraph } from '../src/evidence-graph.mjs';

test('Hadith ingestion preserves raw and normalized forms', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dtv-'));
  const input = path.join(dir, 'input.json');
  fs.writeFileSync(input, JSON.stringify([{id:1, arabic:'نص', english:'Text', reference:'B1', collection:'Bukhari'}]));
  const out = path.join(dir, 'out');
  const m = ingestHadithJson(input, out, {source_id:'test-bukhari'});
  assert.equal(m.record_count, 1);
  assert.equal(fs.existsSync(path.join(out,'raw.json')), true);
  assert.equal(fs.existsSync(path.join(out,'normalized.jsonl')), true);
  assert.equal(fs.existsSync(path.join(out,'manifest.json')), true);
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Evidence graph builds', () => {
  const graph = buildEvidenceGraph(path.join(ROOT, 'data/claims/claims.json'));
  assert.ok(graph.node_count > 0);
});

test('Corpus gap report preserves pending state', () => {
  const status = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/PROJECT_STATUS_V4.json'),'utf8'));
  const pending = Object.values(status.local_corpora).filter(x => !String(x.status).startsWith('NORMALIZED'));
  assert.ok(pending.length >= 1);
});
