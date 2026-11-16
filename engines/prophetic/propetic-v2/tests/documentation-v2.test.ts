import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadCorpusRegistry, loadDocumentationRegistry } from "../src/lib/load-v2.js";

test("v2.3 documentation registry is structured and complete",()=>{
  const d=loadDocumentationRegistry();
  assert.equal(d.version,"2.3.2");
  assert.equal(d.schema_version,"2.0");
  assert.equal(d.status,"FINAL_HANDOFF_READY_V2_3_2");
  assert.ok(d.documents.length>=35);
  const categories=new Set(d.documents.map(x=>x.category));
  for(const required of ["architecture","adr","corpus","bible_witness","research","scoring","api","project","todo","roadmap","handoff","testing","user_guide","issues","support"]){
    assert.ok(categories.has(required),`missing docs category ${required}`);
  }
  for(const doc of d.documents){
    assert.equal(doc.status,"complete");
    const text=fs.readFileSync(path.join(process.cwd(),doc.path),"utf8");
    assert.ok(text.length>80,`${doc.path}: documentation too small`);
  }
  assert.equal(d.governance?.todo_path,"docs/project/TODO.md");
  assert.ok(fs.readFileSync(path.join(process.cwd(),d.governance?.todo_path??""),"utf8").includes("[ ]"));
});

test("four corpus registry remains exactly four approved sources",()=>{
  const c=loadCorpusRegistry();
  assert.equal(c.sources.length,4);
  assert.equal(c.allowed_source_ids.join(","),"quran,taurat,zabur,injil");
  assert.equal(c.sources[0]?.role,"CORE_MUHAIMIN");
});
