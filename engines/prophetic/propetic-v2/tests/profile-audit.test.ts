import test from "node:test";
import assert from "node:assert/strict";
import {loadDataset} from "../src/lib/load.js";
import {auditProfiles} from "../src/engine/profile-audit.js";

test("25 profiles audited without hard failure",()=>{
  const rows=auditProfiles(loadDataset());
  assert.equal(rows.length,25);
  assert.equal(rows.filter(x=>x.result==="FAIL").length,0);
});

test("known epistemic guardrails stay visible",()=>{
  const rows=auditProfiles(loadDataset());
  const by=Object.fromEntries(rows.map(x=>[x.prophet_id,x]));
  assert.ok(by.adam?.findings.some(x=>x.code==="ADAM_STATUS_GUARDRAIL"));
  assert.ok(by.dhulkifl?.findings.some(x=>x.code==="STATUS_DEBATED"));
  assert.ok(by.ismail?.findings.some(x=>x.code==="SACRIFICE_NAME_GUARDRAIL"));
});
