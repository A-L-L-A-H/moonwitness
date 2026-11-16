import http from "node:http";
import { loadDataset } from "../lib/load.js";
import { loadConflicts, loadCorpusRegistry, loadDocumentationRegistry, loadGenealogy, loadPreferenceDataset, loadSourceEditions, loadTimeline } from "../lib/load-v2.js";
import { buildProvenanceIndex } from "../engine/provenance.js";
import { buildEventGraph } from "../engine/timeline.js";
import { preferenceReport } from "../engine/preference.js";
import { handleApi } from "./handler.js";

const data=loadDataset(),genealogy=loadGenealogy(),timeline=loadTimeline();
const state={
  data,
  provenance:buildProvenanceIndex(data),
  events:buildEventGraph(data,timeline),
  genealogy,
  conflicts:loadConflicts(),
  preference:preferenceReport(loadPreferenceDataset()),
  corpus:loadCorpusRegistry(),
  docs:loadDocumentationRegistry(),
  source_editions:loadSourceEditions()
};
const port=Number(process.argv[2]??8787);
http.createServer((req,res)=>{
  const r=handleApi(state,req.method??"GET",req.url?.split("?")[0]??"/");
  res.statusCode=r.status;
  res.setHeader("content-type","application/json; charset=utf-8");
  res.setHeader("access-control-allow-origin","*");
  res.end(JSON.stringify(r.body));
}).listen(port,()=>console.log(`Prophet Research Engine v2 API http://127.0.0.1:${port}`));
