import type { Dataset, ProphetProfile, RelationMode } from "../types.js";
import { matchAsmaForProphet } from "./semantic.js";
import { scoreAllProfiles, scoreAllRelations } from "./scoring.js";
import { traitEvidenceLeaderboard, worldTraitLeaderboard } from "./leaderboard.js";

export interface DistributionStats { n:number; min:number; max:number; mean:number; sd:number; median:number; }
export interface MatcherDiagnostic { profiles:number; top1_agreement:number; top1_rate:number; recall_at_3:number; recall_at_3_rate:number; interpretation:string; }
export interface ScoringAuditReport {
  version:"2.3";
  matcher:{ trait_target:MatcherDiagnostic; all_curated_edges_context_only:MatcherDiagnostic; };
  distributions:{ data_confidence:DistributionStats; relation_score:DistributionStats; };
  native_rid_guardrail:Array<{prophet_id:string;source_type:string;quran_refs:number}>;
  warnings:string[];
  note:string;
}

const traitModes=new Set<RelationMode>(["SHARED_LEXEME_TRAIT","SHARED_ROOT_TRAIT","SEMANTIC_TRAIT_REFLECTION"]);
function stats(values:number[]):DistributionStats{
  if(!values.length)return {n:0,min:0,max:0,mean:0,sd:0,median:0};
  const sorted=[...values].sort((a,b)=>a-b); const mean=values.reduce((s,v)=>s+v,0)/values.length;
  const sd=Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/values.length);
  return {n:values.length,min:+sorted[0]!.toFixed(2),max:+sorted.at(-1)!.toFixed(2),mean:+mean.toFixed(2),sd:+sd.toFixed(2),median:+sorted[Math.floor(sorted.length/2)]!.toFixed(2)};
}
function curatedRoots(data:Dataset,p:ProphetProfile,modes?:Set<RelationMode>):string[]{
  return [...new Set(data.edges.filter(e=>e.from===`prophet:${p.id}`&&e.type==="asma_relation"&&(!modes||(!!e.relation_mode&&modes.has(e.relation_mode)))).map(e=>e.canonical_divine_root??e.to.replace("divine-root:","")))];
}
function matcherDiagnostic(data:Dataset,modes:Set<RelationMode>|undefined,interpretation:string):MatcherDiagnostic{
  let profiles=0,top1=0,at3=0;
  for(const id of data.prophet_order){const p=data.prophets[id];if(!p)continue;const curated=curatedRoots(data,p,modes);if(!curated.length)continue;profiles++;const automatic=matchAsmaForProphet(data,p,3);if(automatic[0]&&curated.includes(automatic[0].divine_root))top1++;if(automatic.some(c=>curated.includes(c.divine_root)))at3++;}
  return {profiles,top1_agreement:top1,top1_rate:profiles?+(top1/profiles).toFixed(4):0,recall_at_3:at3,recall_at_3_rate:profiles?+(at3/profiles).toFixed(4):0,interpretation};
}

export function auditScoring(data:Dataset):ScoringAuditReport{
  const traitDiag=matcherDiagnostic(data,traitModes,"Primary matcher diagnostic: compares automatic candidates only with curated shared/semantic TRAIT relations, which is the closest like-for-like internal target. Curated edges are still not an external gold standard.");
  const allDiag=matcherDiagnostic(data,undefined,"Context-only diagnostic. This mixes trait, mission-alignment, bestowed/divine-interaction relation modes and therefore must not be used as matcher accuracy.");
  const profileStats=stats(scoreAllProfiles(data).map(x=>x.data_confidence_score));
  const relationStats=stats(Object.values(scoreAllRelations(data)).flat().map(x=>x.raw_score));
  const warnings:string[]=[];
  if(traitDiag.top1_rate<0.8)warnings.push(`Trait-target matcher top-1 agreement is ${(100*traitDiag.top1_rate).toFixed(1)}%; matcher must remain a candidate generator.`);
  if(profileStats.mean>85)warnings.push(`Data-confidence mean is ${profileStats.mean}; rubric is high/saturated and must not be interpreted as probability or fine-grained ranking.`);
  if(relationStats.max>=99.99)warnings.push("At least one relation reaches 100; this is a rubric ceiling, not metaphysical certainty.");
  const traitRows=traitEvidenceLeaderboard(data), traitUnique=new Set(traitRows.map(r=>r.score)).size, worldRows=worldTraitLeaderboard(data);
  if(traitUnique<=5)warnings.push(`Trait-evidence leaderboard has only ${traitUnique} unique score levels; it is an evidence-class ranking, not a fine-grained continuous measure.`);
  if(worldRows.length<data.prophet_order.length/2)warnings.push(`World-trait salience is available for only ${worldRows.length}/${data.prophet_order.length} profiles; missing mappings must remain missing rather than imputed.`);
  const native=data.prophet_order.map(id=>data.prophets[id]).filter((p):p is ProphetProfile=>!!p&&p.rid.source_type==="native_name_root").map(p=>({prophet_id:p.id,source_type:p.rid.source_type,quran_refs:p.rid.quran_refs.length}));
  return {version:"2.3",matcher:{trait_target:traitDiag,all_curated_edges_context_only:allDiag},distributions:{data_confidence:profileStats,relation_score:relationStats},native_rid_guardrail:native,warnings,note:"Scores are deterministic research rubrics. They are uncalibrated and are not probabilities, holiness measures, or rankings of prophetic worth."};
}
