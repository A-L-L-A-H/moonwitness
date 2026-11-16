import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadDataset } from "../src/lib/load.js";

test("release is v2.3 while research schema remains v2.0",()=>{
  const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
  const d=loadDataset();
  assert.equal(pkg.version,"2.3.2");
  assert.equal(fs.readFileSync("VERSION","utf8").trim(),"2.3.2");
  assert.equal(d.runtime?.version,"2.3.2");
  assert.equal(d.release?.version,"2.3.2");
  assert.equal(d.schema_version,"2.0");
  assert.equal(d.release?.research_semantics_changed,false);
});

test("Bible remains witness container, not source five",()=>{
  const text=fs.readFileSync("docs/corpus/bible/BIBLE-WITNESS-CONCEPT.md","utf8");
  assert.ok(text.includes("not a fifth"));
  assert.ok(text.includes("witness"));
});
