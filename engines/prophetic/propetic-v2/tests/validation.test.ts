import test from "node:test";
import assert from "node:assert/strict";
import {loadDataset} from "../src/lib/load.js";
import {validateDataset} from "../src/engine/validate.js";
test("dataset validates",()=>{
  const r=validateDataset(loadDataset());
  assert.equal(r.ok,true,r.errors.join("\n"));
  assert.equal(r.counts.prophets,25);
  assert.equal(r.counts.positive_rid,25);
  assert.equal(r.counts.auto_match_coverage,25);
  assert.ok((r.counts.divine_root_families??0)>=18);
});
