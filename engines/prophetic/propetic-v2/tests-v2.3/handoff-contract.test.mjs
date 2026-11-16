import assert from 'node:assert/strict';
import fs from 'node:fs';
const root = new URL('../', import.meta.url).pathname;
const pkg = JSON.parse(fs.readFileSync(root + 'package.json', 'utf8'));
for (const script of ['setup','setup:e2e','doctor','start','verify:handoff','verify','e2e']) assert.ok(pkg.scripts[script], script);
for (const file of [
  'HANDOFF.md','INSTALL-WINDOWS.cmd','RUN-WINDOWS.cmd','VERIFY-WINDOWS.cmd',
  'INSTALL.sh','RUN.sh','VERIFY.sh','playwright.config.ts',
  'docs/project/INSTALL-RUNBOOK.md','docs/project/HANDOFF-CHECKLIST.md','docs/project/USER-GUIDE.md','docs/project/ISSUES-KNOWN-LIMITATIONS.md','docs/project/TROUBLESHOOTING.md','docs/architecture/E2E-HANDOFF.md',
  'scripts/setup.mjs','scripts/start.mjs','scripts/doctor.mjs','scripts/verify-full.mjs','scripts/verify-handoff.mjs'
]) assert.ok(fs.existsSync(root + file), file);
const playwright = fs.readFileSync(root + 'playwright.config.ts','utf8');
assert.match(playwright,/127\.0\.0\.1:4310/);
assert.match(playwright,/npm start/);
const e2e = fs.readFileSync(root + 'e2e/ui.spec.ts','utf8');
for (const tab of ['Profile','Provenance','Timeline & Relations','Leaderboards','Four Corpus','Architecture & Docs']) assert.ok(e2e.includes(tab),tab);
assert.match(e2e,/prophetCount/);
const docs=JSON.parse(fs.readFileSync(root+'src/data/v2/documentation-registry.v2.3.json','utf8'));
assert.equal(docs.status,'FINAL_HANDOFF_READY_V2_3_2');
assert.ok(docs.documents.some(x=>x.id==='install_runbook'));
assert.ok(docs.documents.some(x=>x.id==='handoff_checklist'));
assert.ok(docs.documents.some(x=>x.id==='user_guide'));
assert.ok(docs.documents.some(x=>x.id==='issues_known_limitations'));
assert.ok(docs.documents.some(x=>x.id==='troubleshooting'));
console.log('Handoff contract v2.3: PASS');
