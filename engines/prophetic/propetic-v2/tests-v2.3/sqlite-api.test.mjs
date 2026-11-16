import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { openStore } from "../apps/api/dist/db.js";

const root=path.resolve(new URL("../",import.meta.url).pathname);
const store=openStore(root);
const health=store.health();
assert.equal(health.database,"sqlite");
assert.equal(health.version,"2.3.2");
assert.equal(health.dbSchemaVersion,"2.3");
assert.equal(health.dataSchemaVersion,"2.0");
assert.equal(health.prophetCount,25);
assert.match(String(health.seedFingerprint),/^[a-f0-9]{64}$/);
assert.match(String(health.schemaFingerprint),/^[a-f0-9]{64}$/);
assert.equal(store.listProphets().length,25);
assert.equal(store.getProphet("muhammad")?.id,"muhammad");
assert.equal(store.getProphet("not-a-prophet"),null);

const prophetSql=store.db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='prophets'").get();
const documentSql=store.db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='documents'").get();
assert.match(String(prophetSql?.sql),/json_valid\(payload_json\)/i);
assert.match(String(prophetSql?.sql),/STRICT/i);
assert.match(String(documentSql?.sql),/json_valid\(payload_json\)/i);
const indexes=store.db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name").all().map(r=>r.name);
for(const name of ["idx_documents_kind","idx_prophets_display_name","idx_prophets_rid_root"]) assert.ok(indexes.includes(name),`missing ${name}`);
assert.equal(store.db.prepare("PRAGMA integrity_check").get()?.integrity_check,"ok");
store.db.close();

// Prove fingerprint-based re-seed: clone the minimal source tree + DB, mutate one source profile,
// reopen the store and verify the derived database follows source rather than staying stale.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"prophet-v23-"));
for(const rel of ["apps/api/schema.sql","src/data/prophet-identity-graph.v2.0.json","src/data/v2/corpus-registry.v2.0.json","src/data/v2/documentation-registry.v2.3.json"]) {
  const src=path.join(root,rel), dst=path.join(temp,rel); fs.mkdirSync(path.dirname(dst),{recursive:true}); fs.copyFileSync(src,dst);
}
for(const rel of ["web/public/leaderboards.v2.0.json","web/public/provenance-index.v2.0.json","web/public/timeline.v2.0.json","web/public/events.v2.0.json","web/public/genealogy.v2.0.json","web/public/uncertainty.v2.0.json","web/public/validation.v2.0.json","web/public/profile-audit.v2.0.json","web/public/scoring-audit.v2.3.json"]) {
  const src=path.join(root,rel); if(!fs.existsSync(src)) continue; const dst=path.join(temp,rel); fs.mkdirSync(path.dirname(dst),{recursive:true}); fs.copyFileSync(src,dst);
}
const originalDb=path.join(root,"data/sqlite/prophet-research-v2.3.sqlite");
const tempDb=path.join(temp,"data/sqlite/prophet-research-v2.3.sqlite"); fs.mkdirSync(path.dirname(tempDb),{recursive:true}); fs.copyFileSync(originalDb,tempDb);
const datasetPath=path.join(temp,"src/data/prophet-identity-graph.v2.0.json");
const data=JSON.parse(fs.readFileSync(datasetPath,"utf8")); data.prophets.muhammad.display_name="Muḥammad · fingerprint-test"; fs.writeFileSync(datasetPath,JSON.stringify(data,null,2));
const tempStore=openStore(temp); assert.equal(tempStore.getProphet("muhammad")?.display_name,"Muḥammad · fingerprint-test"); const beforeSchema=String(tempStore.health().schemaFingerprint); tempStore.db.close();
fs.appendFileSync(path.join(temp,"apps/api/schema.sql"),"\n-- fingerprint-change-test\n");
const schemaChanged=openStore(temp); assert.notEqual(String(schemaChanged.health().schemaFingerprint),beforeSchema); assert.equal(schemaChanged.getProphet("muhammad")?.display_name,"Muḥammad · fingerprint-test"); schemaChanged.db.close();
fs.rmSync(temp,{recursive:true,force:true});

const webDist=path.join(root,"apps/web/dist");
fs.mkdirSync(path.join(webDist,"assets"),{recursive:true});
fs.writeFileSync(path.join(webDist,"index.html"),"<!doctype html><title>static-contract</title>");
fs.writeFileSync(path.join(webDist,"assets/test.js"),"console.log('ok')");

const port="4313";
const child=spawn(process.execPath,["apps/api/dist/server.js"],{cwd:root,env:{...process.env,PROPHET_RESEARCH_ROOT:root,PORT:port},stdio:["ignore","pipe","pipe"]});
try {
  let ok=false;
  for(let i=0;i<50;i++){await sleep(100);try{const r=await fetch(`http://127.0.0.1:${port}/api/v2/health`);if(r.ok){ok=true;break}}catch{}}
  assert.ok(ok,"API did not start");
  const get=(route,init)=>fetch(`http://127.0.0.1:${port}${route}`,init);
  const healthRes=await get("/api/v2/health").then(r=>r.json());
  assert.equal(healthRes.version,"2.3.2"); assert.equal(healthRes.dbSchemaVersion,"2.3");
  const prophets=await get("/api/v2/prophets").then(r=>r.json()); assert.equal(prophets.length,25);
  const musa=await get("/api/v2/prophets/musa").then(r=>r.json()); assert.equal(musa.id,"musa");
  const claims=await get("/api/v2/prophets/musa/provenance").then(r=>r.json()); assert.ok(Array.isArray(claims.claims)); assert.ok(claims.claims.every(x=>x.prophet_id==="musa"));
  const events=await get("/api/v2/prophets/musa/events").then(r=>r.json()); assert.equal(events.events.length,8); assert.ok(events.events.every(x=>x.prophet_id==="musa"));
  const timeline=await get("/api/v2/prophets/musa/timeline").then(r=>r.json()); assert.equal(timeline.prophet_id,"musa");
  const relations=await get("/api/v2/prophets/musa/relations").then(r=>r.json()); assert.ok(Array.isArray(relations.relations));
  for(const route of ["leaderboards","corpus","docs","provenance","timeline","events","genealogy","uncertainty","validation","scoring-audit","source-editions","conflicts","preference/status","relation-scores","profile-data-scores"]){const r=await get(`/api/v2/${route}`);assert.equal(r.status,200,route)}
  assert.equal((await get("/api/v2/prophets/nope")).status,404);
  assert.equal((await get("/api/v2/nope")).status,404);
  assert.equal((await get("/api/v2/health",{method:"POST"})).status,405);
  const options=await get("/api/v2/health",{method:"OPTIONS",headers:{Origin:"http://127.0.0.1:5173"}}); assert.equal(options.status,204); assert.equal(options.headers.get("access-control-allow-origin"),"http://127.0.0.1:5173");
  const cors=await get("/api/v2/health",{headers:{Origin:"http://localhost:5173"}}); assert.equal(cors.headers.get("access-control-allow-origin"),"http://localhost:5173");
  assert.equal((await get("/")).status,200);
  assert.equal((await get("/profile/musa")).status,200,"extensionless SPA navigation should fall back to index");
  assert.equal((await get("/assets/test.js")).status,200);
  assert.equal((await get("/assets/missing.js")).status,404,"missing static asset must not receive SPA index");
  console.log("SQLite/API v2.3 integration: PASS");
} finally {
  child.kill("SIGTERM");
  fs.rmSync(path.join(root,"apps/web/dist"),{recursive:true,force:true});
}
