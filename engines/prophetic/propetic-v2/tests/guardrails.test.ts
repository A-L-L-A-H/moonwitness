import test from "node:test";
import assert from "node:assert/strict";
import {loadDataset} from "../src/lib/load.js";
test("critical audit guardrails",()=>{
  const d=loadDataset();
  assert.equal(d.prophets.ismail?.mission.test?.evidence,"T1");
  assert.equal(d.prophets.dhulkifl?.quranic_status.evidence,"T1");
  assert.ok(d.prophets.adam?.quranic_status.evidence!=="Q5");
  assert.equal(d.prophets.muhammad?.rid.root,"Ḥ-M-D");
  assert.equal(d.prophets.isa?.rid.root,"Y-Š-ʿ");
  assert.equal(d.principles.automatic_match_is_candidate_not_revelation,true);
});
