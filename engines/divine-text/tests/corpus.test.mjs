import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('corpus registry lists required families', () => {
  const out = execFileSync(process.execPath, ['scripts/corpus-manager.mjs','list'], {encoding:'utf8'});
  for (const id of ['quran','hadith','torah','psalms','gospels']) assert.match(out, new RegExp(`^${id}\\t`, 'm'));
});

test('corpus status command returns JSON', () => {
  const out = execFileSync(process.execPath, ['scripts/corpus-manager.mjs','status'], {encoding:'utf8'});
  const data = JSON.parse(out);
  assert.ok(Array.isArray(data));
  assert.ok(data.some(x=>x.id==='quran' && x.status==='LOCAL'));
});
