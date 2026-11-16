import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { openStore } from "../apps/api/dist/db.js";
const root=new URL("../",import.meta.url).pathname;
const store=openStore(root);
const health=store.health();
assert.equal(health.database,"sqlite");
assert.equal(health.prophetCount,25);
assert.equal(store.listProphets().length,25);
assert.equal(store.getProphet("muhammad")?.id,"muhammad");
assert.equal(store.getProphet("not-a-prophet"),null);
store.db.close();

const child=spawn(process.execPath,["apps/api/dist/server.js"],{cwd:root,env:{...process.env,PROPHET_RESEARCH_ROOT:root,PORT:"4311"},stdio:["ignore","pipe","pipe"]});
try{
  let ok=false;
  for(let i=0;i<30;i++){await sleep(100); try{const r=await fetch("http://127.0.0.1:4311/api/v2/health"); if(r.ok){ok=true;break}}catch{}}
  assert.ok(ok,"API did not start");
  const healthRes=await fetch("http://127.0.0.1:4311/api/v2/health").then(r=>r.json());
  assert.equal(healthRes.database,"sqlite"); assert.equal(healthRes.version,"2.2.0");
  const prophets=await fetch("http://127.0.0.1:4311/api/v2/prophets").then(r=>r.json()); assert.equal(prophets.length,25);
  const musa=await fetch("http://127.0.0.1:4311/api/v2/prophets/musa").then(r=>r.json()); assert.equal(musa.id,"musa");
  for(const route of ["leaderboards","corpus","docs","provenance","timeline","events","genealogy","uncertainty","validation"]){const r=await fetch(`http://127.0.0.1:4311/api/v2/${route}`); assert.equal(r.status,200,route)}
  console.log("SQLite/API integration: PASS");
}finally{child.kill("SIGTERM")}
