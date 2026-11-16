import test from "node:test";
import assert from "node:assert/strict";
import { loadSourceEditions } from "../src/lib/load-v2.js";

test("source edition registry is explicit and non-pretend",()=>{
  const r=loadSourceEditions();
  assert.equal(r.editions.length,4);
  assert.equal(r.status,"REFERENCE_ONLY_NO_PINNED_RAW_CORPUS");
  assert.ok(r.editions.every(x=>x.raw_text_ingested===false));
});
