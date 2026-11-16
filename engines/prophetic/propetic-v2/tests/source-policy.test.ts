import test from "node:test";
import assert from "node:assert/strict";
import {loadDataset} from "../src/lib/load.js";
import {resolveMissionSource} from "../src/engine/source-policy.js";

test("Qur'an remains first source when present",()=>{
  const d=loadDataset(); const p=d.prophets.musa; if(!p)throw new Error("Musa missing");
  assert.equal(resolveMissionSource(p,"mission").source,"AL-QURAN");
});

test("Taurat fills selected E0 mission gaps before other supplements",()=>{
  const d=loadDataset();
  const ishaq=d.prophets.ishaq; const yaqub=d.prophets.yaqub;
  if(!ishaq||!yaqub)throw new Error("profiles missing");
  assert.equal(resolveMissionSource(ishaq,"call").source,"TAURAT");
  assert.equal(resolveMissionSource(yaqub,"call").source,"TAURAT");
});
