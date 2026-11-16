import test from "node:test";
import assert from "node:assert/strict";
import { loadDataset } from "../src/lib/load.js";
import { loadConflicts, loadCorpusRegistry, loadDocumentationRegistry, loadGenealogy, loadPreferenceDataset, loadSourceEditions, loadTimeline } from "../src/lib/load-v2.js";
import { buildProvenanceIndex } from "../src/engine/provenance.js";
import { buildEventGraph } from "../src/engine/timeline.js";
import { preferenceReport } from "../src/engine/preference.js";
import { handleApi } from "../src/api/handler.js";

const d=loadDataset(),g=loadGenealogy(),t=loadTimeline();
const s={data:d,provenance:buildProvenanceIndex(d),events:buildEventGraph(d,t),genealogy:g,conflicts:loadConflicts(),preference:preferenceReport(loadPreferenceDataset()),corpus:loadCorpusRegistry(),docs:loadDocumentationRegistry(),source_editions:loadSourceEditions()};

test("api exposes corpus and docs registries",()=>{
  assert.equal(handleApi(s,"GET","/api/v2/corpus").status,200);
  assert.equal(handleApi(s,"GET","/api/v2/docs").status,200);
  assert.equal(handleApi(s,"GET","/api/v2/source-editions").status,200);
  const health=handleApi(s,"GET","/api/v2/health");
  assert.equal(health.status,200);
});
