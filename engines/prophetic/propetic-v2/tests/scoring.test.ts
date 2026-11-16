import test from "node:test";
import assert from "node:assert/strict";
import { loadDataset } from "../src/lib/load.js";
import { geometricMean, noisyOr, scoreAllProfiles, scoreAsmaRelation, scoreProphetRelations } from "../src/engine/scoring.js";

const data=loadDataset();

test("scoring is bounded and covers all 25 profiles",()=>{
  const profiles=scoreAllProfiles(data);
  assert.equal(profiles.length,25);
  for(const p of profiles){assert.ok(p.data_confidence_score>=0&&p.data_confidence_score<=100);assert.equal(p.calibration_status,"UNCALIBRATED");}
});

test("noisy-OR is monotonic and has diminishing returns",()=>{
  const a=noisyOr([0.6]); const b=noisyOr([0.6,0.6]); const c=noisyOr([0.6,0.6,0.6]);
  assert.ok(b>a&&c>b);
  assert.ok((b-a)>(c-b));
  assert.ok(c<=1);
});

test("geometric mean is bounded and balance-sensitive",()=>{
  assert.equal(Number(geometricMean([1,1,1]).toFixed(6)),1);
  assert.ok(geometricMean([1,1,0.25])<geometricMean([0.75,0.75,0.75]));
});

test("Muhammad H-M-D relation is scored and never called probability",()=>{
  const s=scoreAsmaRelation(data,"muhammad","Ḥ-M-D");
  assert.ok(s);
  assert.ok((s?.raw_score??0)>0);
  assert.equal(s?.calibrated_probability,null);
  assert.equal(s?.calibration_status,"UNCALIBRATED");
});

test("automatic-only candidates remain weaker than curated direct relations",()=>{
  const muh=scoreProphetRelations(data,"muhammad");
  assert.ok(muh.length>0);
  const curated=muh.find(x=>x.curated_evidence.length>0);
  assert.ok(curated);
  const autoOnly=muh.find(x=>x.curated_evidence.length===0);
  if(autoOnly) assert.ok(curated!.components.find(x=>x.name==="evidence_strength")!.value >= autoOnly.components.find(x=>x.name==="evidence_strength")!.value);
});

test("unrelated cross-scripture divergence does not contaminate an ASMA relation",()=>{
  const ib=scoreProphetRelations(data,"ibrahim");
  const ibTop=ib.find(x=>x.divine_root==="Ḥ-L-M");
  if(!ibTop) throw new Error("Expected Ibrahim Halim relation");
  const consistency=ibTop.components.find(x=>x.name==="cross_source_consistency")!.value;
  assert.equal(consistency,1);
});
