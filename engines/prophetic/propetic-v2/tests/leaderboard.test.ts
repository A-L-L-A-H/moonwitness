import test from "node:test";
import assert from "node:assert/strict";
import { loadDataset } from "../src/lib/load.js";
import { dataConfidenceLeaderboard, traitEvidenceLeaderboard, worldTraitLeaderboard } from "../src/engine/leaderboard.js";

test("trait leaderboard excludes divine interaction",()=>{
  const d=loadDataset(); const rows=traitEvidenceLeaderboard(d);
  assert.equal(rows.length,25);
  const top=rows.filter(x=>x.rank===1).map(x=>x.prophet_id).sort();
  assert.equal(top.join(","),["ibrahim","muhammad","nuh","yahya"].sort().join(","));
  assert.ok((rows.find(x=>x.prophet_id==="musa")?.score??0)<(rows[0]?.score??0));
});

test("data confidence leaderboard remains separate",()=>{
  const d=loadDataset(); const rows=dataConfidenceLeaderboard(d);
  assert.equal(rows[0]?.prophet_id,"nuh");
});

test("world trait index is bounded and non-probabilistic",()=>{
  const d=loadDataset(); const rows=worldTraitLeaderboard(d);
  assert.ok(rows.length>0);
  assert.ok(rows.every(x=>x.score>=0&&x.score<=100));
  const top=rows.filter(x=>x.rank===1).map(x=>x.prophet_id).sort();
  assert.equal(top.join(","),["dawud","yusuf"].sort().join(","));
});
