import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('../',import.meta.url).pathname);
const registryPath=path.join(root,'src/data/v2/documentation-registry.v2.3.json');
const registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));
assert.equal(registry.version,'2.3.2');
assert.equal(registry.schema_version,'2.0');
assert.equal(registry.status,'FINAL_HANDOFF_READY_V2_3_2');
for(const id of ['user_guide','issues_known_limitations','troubleshooting','install_runbook','handoff_checklist','architecture','bible_witness','todo','roadmap']){
  assert.ok(registry.documents.some(x=>x.id===id),`missing registry document ${id}`);
}
for(const doc of registry.documents){
  const file=path.join(root,doc.path);
  assert.ok(fs.existsSync(file),`missing ${doc.path}`);
  assert.ok(fs.statSync(file).size>80,`too small ${doc.path}`);
}

const indexPath=path.join(root,'docs/DOCS-INDEX.md');
const index=fs.readFileSync(indexPath,'utf8');
const linkRe=/\[[^\]]+\]\(([^)]+)\)/g;
for(const match of index.matchAll(linkRe)){
  const href=match[1];
  if(!href || href.startsWith('http:') || href.startsWith('https:') || href.startsWith('#')) continue;
  const clean=href.split('#')[0];
  const target=path.resolve(path.dirname(indexPath),clean);
  assert.ok(fs.existsSync(target),`DOCS-INDEX broken link: ${href}`);
}

const guide=fs.readFileSync(path.join(root,'docs/project/USER-GUIDE.md'),'utf8');
for(const view of ['Profile','Provenance','Timeline & Relations','Leaderboards','Four Corpus','Architecture & Docs']) assert.ok(guide.includes(view),view);
for(const boundary of ['score ≠ prophetic rank','ASMA relation ≠ identity with Allah','modern geography crosswalk ≠ ancient nationality']) assert.ok(guide.includes(boundary),boundary);

const issues=fs.readFileSync(path.join(root,'docs/project/ISSUES-KNOWN-LIMITATIONS.md'),'utf8');
for(const section of ['Fixed in the v2.3 line','Open engineering items','External verification gate','Research limitations','Operational limitations']) assert.ok(issues.includes(section),section);

const todo=fs.readFileSync(path.join(root,'docs/project/TODO.md'),'utf8');
assert.ok(todo.includes('[ ]'),'TODO must retain open work');
assert.ok(todo.includes('Explicitly out of scope without evidence'));

const handoff=fs.readFileSync(path.join(root,'HANDOFF.md'),'utf8');
assert.ok(handoff.includes('2.3.2'));
assert.ok(handoff.includes('HANDOFF-RESULT.json'));
console.log('Documentation integrity v2.3.2: PASS');
