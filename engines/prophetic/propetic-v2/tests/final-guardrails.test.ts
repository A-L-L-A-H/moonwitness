import test from "node:test";
import assert from "node:assert/strict";
import { loadDataset } from "../src/lib/load.js";

test("Musa guidance is not Q5 after final audit",()=>{
  const d=loadDataset(); const e=d.edges.find(x=>x.from==="prophet:musa"&&x.type==="asma_relation"&&x.canonical_divine_root==="H-D-Y");
  if(!e) throw new Error("Missing Musa H-D-Y edge");
  assert.ok(e.evidence!=="Q5"); assert.equal(e.relation_mode,"MISSION_ALIGNMENT");
});

test("all Asma edges have relation modes",()=>{
  const d=loadDataset(); assert.ok(d.edges.filter(e=>e.type==="asma_relation").every(e=>!!e.relation_mode));
});
