import test from "node:test";
import assert from "node:assert/strict";
import { loadDataset } from "../src/lib/load.js";
import { profileDataScore, scoreAsmaRelation } from "../src/engine/scoring.js";

test("native-name RID references do not receive full etymology evidence credit",()=>{
  const d=loadDataset();
  for(const id of ["isa","muhammad"]){
    const p=d.prophets[id]!;
    assert.equal(p.rid.source_type,"native_name_root");
    const score=profileDataScore(d,p);
    assert.ok(score.components.rid_evidence<1,`${id}: native etymology should not equal direct Qur'anic proof`);
  }
});

test("profile ASMA quality averages curated relations rather than cherry-picking best relation",()=>{
  const d=loadDataset(); const p=d.prophets.muhammad!;
  const roots=[...new Set(d.edges.filter(e=>e.from==="prophet:muhammad"&&e.type==="asma_relation").map(e=>e.canonical_divine_root??e.to.replace("divine-root:","")))];
  const values=roots.map(root=>scoreAsmaRelation(d,"muhammad",root)!.raw_score/100);
  assert.ok(values.length>=2);
  const expected=values.reduce((a,b)=>a+b,0)/values.length;
  const actual=profileDataScore(d,p).components.asma_relation_quality;
  assert.ok(Math.abs(actual-expected)<1e-9);
});
