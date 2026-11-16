import type { ApiResponse, ConflictDataset, CorpusRegistry, Dataset, DocumentationRegistry, EventNode, GenealogyGraph, PreferenceReport, ProvenanceIndex, SourceEditionRegistry } from "../types.js";
import { claimById, claimsForProphet } from "../engine/provenance.js";
import { relationsForProphet, timelineForProphet } from "../engine/timeline.js";
import { dataConfidenceLeaderboard, traitEvidenceLeaderboard, worldTraitLeaderboard } from "../engine/leaderboard.js";
import { contextLeaderboard } from "../engine/context-scoring.js";

export interface ApiState {
  data:Dataset;
  provenance:ProvenanceIndex;
  events:EventNode[];
  genealogy:GenealogyGraph;
  conflicts:ConflictDataset;
  preference:PreferenceReport;
  corpus?:CorpusRegistry;
  docs?:DocumentationRegistry;
  source_editions?:SourceEditionRegistry;
}

const ok=<T>(body:T):ApiResponse<T>=>({status:200,body});
const nf=(m:string):ApiResponse=>({status:404,body:{error:m}});

export function handleApi(s:ApiState,method:string,path:string):ApiResponse {
  if(method!=="GET") return {status:405,body:{error:"METHOD_NOT_ALLOWED"}};
  if(path==="/api/v2/health") return ok({ok:true,release_version:s.data.runtime?.version??"2.1.0",schema_version:s.data.schema_version,api_major:"v2",model:s.data.model,docs:s.docs?.status??"UNAVAILABLE",todo:s.docs?.governance?.todo_path??null});
  if(path==="/api/v2/prophets") return ok(s.data.prophet_order.map(id=>s.data.prophets[id]).filter(Boolean));
  if(path==="/api/v2/leaderboards") return ok({
    trait_evidence:traitEvidenceLeaderboard(s.data),
    data_confidence:dataConfidenceLeaderboard(s.data),
    world_trait_salience:worldTraitLeaderboard(s.data),
    context_evidence:contextLeaderboard(s.data),
    human_preference:s.preference
  });
  if(path==="/api/v2/corpus") return s.corpus?ok(s.corpus):nf("Corpus registry unavailable");
  if(path==="/api/v2/docs") return s.docs?ok(s.docs):nf("Documentation registry unavailable");
  if(path==="/api/v2/source-editions") return s.source_editions?ok(s.source_editions):nf("Source edition registry unavailable");
  if(path==="/api/v2/timeline") return ok(s.events);
  if(path==="/api/v2/genealogy") return ok(s.genealogy);
  if(path==="/api/v2/conflicts") return ok(s.conflicts);
  if(path==="/api/v2/preference/status") return ok(s.preference);
  const pm=path.match(/^\/api\/v2\/prophets\/([^/]+)$/);
  if(pm){
    const id=pm[1]??"",p=s.data.prophets[id];
    return p?ok({...p,provenance:claimsForProphet(s.provenance,id),timeline:timelineForProphet(s.events,id),relations:relationsForProphet(s.genealogy,id)}):nf(`Unknown prophet ${id}`);
  }
  const cm=path.match(/^\/api\/v2\/provenance\/(.+)$/);
  if(cm){
    const id=decodeURIComponent(cm[1]??""),c=claimById(s.provenance,id);
    return c?ok(c):nf(`Unknown claim ${id}`);
  }
  return nf(path);
}
