import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("v2.3 legacy web compatibility exposes research views and current public registries",()=>{
  const html=fs.readFileSync(path.join(process.cwd(),"web/index.html"),"utf8");
  assert.ok(html.includes("Prophet Research Engine v2.3"));
  for(const tab of ["profile","provenance","timeline","leaders","corpusview","architectureview"]){
    assert.ok(html.includes(`data-tab="${tab}"`),`missing tab ${tab}`);
  }
  for(const file of [
    "prophet-identity-graph.v2.0.json","leaderboards.v2.0.json","provenance-index.v2.0.json","events.v2.0.json",
    "genealogy.v2.0.json","uncertainty.v2.0.json","corpus-registry.v2.0.json","documentation-registry.v2.3.json","source-editions.v2.0.json","release.v2.3.json"
  ]){
    const raw=fs.readFileSync(path.join(process.cwd(),"web/public",file),"utf8");
    assert.ok(raw.length>20,`${file}: missing/empty`);
  }
});
