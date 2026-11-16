import type { Dataset, Evidence, MatchCandidate, ProphetProfile } from "../types.js";
import { matchAsmaForProphet } from "./semantic.js";

export type ScoreComponentName =
  | "evidence_strength"
  | "linguistic_match"
  | "provenance"
  | "cross_source_consistency"
  | "reproducibility";

export interface ScoreComponent {
  name: ScoreComponentName;
  value: number; // 0..1
  rationale: string[];
}

export interface RelationScore {
  prophet_id: string;
  prophet_name: string;
  divine_root: string;
  divine_name: string;
  raw_score: number; // 0..100, NOT a probability
  band: "VERY_STRONG"|"STRONG"|"MODERATE"|"WEAK"|"INSUFFICIENT";
  calibrated_probability: null;
  calibration_status: "UNCALIBRATED";
  components: ScoreComponent[];
  curated_evidence: Evidence[];
  automatic_candidate: MatchCandidate|null;
  mathematical_properties: string[];
}

export interface ProfileDataScore {
  prophet_id: string;
  prophet_name: string;
  data_confidence_score: number; // 0..100, NOT a prophet-rank
  band: RelationScore["band"];
  calibration_status: "UNCALIBRATED";
  components: {
    rid_evidence: number;
    status_evidence: number;
    mission_evidence: number;
    name_root_confidence: number;
    asma_relation_quality: number;
  };
  note: string;
}

const EPS=1e-9;

const confidenceValue:Record<string,number>={high:1,medium:0.75,low:0.5};

function ridEvidenceValue(p:ProphetProfile):number {
  const hasRefs=p.rid.quran_refs.length>0;
  if(p.rid.source_type==="quranic_attribute"||p.rid.source_type==="quranic_positive_attribute") return hasRefs?1:0.4;
  if(p.rid.source_type==="name_and_quality") return hasRefs?0.9:0.5;
  if(p.rid.source_type==="native_name_root"){
    const c=confidenceValue[p.rid.confidence]??0.6;
    // Qur'anic verses can attest the name/form without independently proving a historical etymology.
    return hasRefs?Math.min(0.85,0.55+0.30*c):0.55*c;
  }
  return hasRefs?0.8:0.4;
}

export function clamp01(x:number):number { return Math.max(0,Math.min(1,x)); }

/**
 * Correlation-aware noisy-OR.
 * Repeated observations are discounted geometrically: 1, 1/2, 1/4...
 * This yields bounded, monotonic, diminishing-return aggregation.
 */
export function noisyOr(values:number[]):number {
  let residual=1;
  values.map(clamp01).sort((a,b)=>b-a).forEach((v,i)=>{
    const discount=Math.pow(0.5,i);
    residual*=1-v*discount;
  });
  return clamp01(1-residual);
}

/** Weighted geometric mean. Equal weights are used by default to avoid silently
 * privileging one dimension. A zero component forces the total toward zero. */
export function geometricMean(values:number[],weights?:number[]):number {
  if(!values.length)return 0;
  const w=weights?.length===values.length?weights:values.map(()=>1);
  const sumW=w.reduce((a,b)=>a+b,0);
  if(sumW<=0)return 0;
  let logSum=0;
  for(let i=0;i<values.length;i++) logSum+=w[i]!*Math.log(Math.max(EPS,clamp01(values[i]!)));
  return clamp01(Math.exp(logSum/sumW));
}

export function scoreBand(x:number):RelationScore["band"] {
  if(x>=85)return "VERY_STRONG";
  if(x>=70)return "STRONG";
  if(x>=50)return "MODERATE";
  if(x>=30)return "WEAK";
  return "INSUFFICIENT";
}

function quranOrEvidenceStrength(data:Dataset, ev:Evidence):number {
  return clamp01(data.evidence_scale[ev]?.score ?? 0);
}

function relationEdges(data:Dataset,prophetId:string,root:string){
  return data.edges.filter(e=>e.from===`prophet:${prophetId}`&&e.type==="asma_relation"&&(e.canonical_divine_root??e.to.replace("divine-root:",""))===root);
}

function provenanceForEdge(e:{prophet_refs?:string[];divine_refs?:string[]}):number {
  const p=e.prophet_refs?.length??0,d=e.divine_refs?.length??0;
  if(p>0&&d>0)return 1;
  if(p>0||d>0)return 0.75;
  return 0.35;
}

function crossSourceConsistency(edges:Array<{relation_to_quran?:string}>):{value:number;rationale:string[]} {
  // Scientific guardrail: cross-scripture disagreement is claim-specific.
  // An unrelated witness (e.g. a narrative identification dispute) must not penalize another ASMA relation.
  const relevant=edges.filter(e=>!!e.relation_to_quran);
  if(!relevant.length)return {value:1,rationale:["No relation-specific cross-scripture divergence recorded; unrelated profile-level differences are excluded."]};
  let penalty=0;const rationale:string[]=[];
  for(const e of relevant){const rel=(e.relation_to_quran??"").toUpperCase();if(rel.includes("DIVERGES")){penalty+=0.35;rationale.push("Relation-specific divergence penalty 0.35.");}else if(rel.includes("IDENTIFICATION_UNCERTAIN")){penalty+=0.15;rationale.push("Relation-specific identification uncertainty penalty 0.15.");}else rationale.push("Relation-specific supplement agrees/merely supplements; no penalty.");}
  return {value:clamp01(1-penalty),rationale};
}

function curatedLinguisticFloor(data:Dataset,edges:Array<{evidence:Evidence}>):{value:number;rationale:string[]} {
  if(!edges.length)return {value:0,rationale:[]};
  const best=Math.max(...edges.map(e=>quranOrEvidenceStrength(data,e.evidence)));
  const value=best>=0.9?1:best>=0.8?0.95:best>=0.65?0.72:best>=0.45?0.55:0.4;
  return {value,rationale:[`Curated textual class implies linguistic floor ${value.toFixed(2)} from strongest evidence ${best.toFixed(2)}.`]};
}

function automaticLinguisticScore(m:MatchCandidate|null):{value:number;rationale:string[]} {
  if(!m)return {value:0.25,rationale:["No automatic matcher candidate for this root; conservative floor 0.25."]};
  let v=0;
  const r:string[]=[];
  if(m.root_match){v=Math.max(v,1);r.push("Exact RID ↔ divine root match.");}
  else if(m.lexeme_match){v=Math.max(v,0.9);r.push("Explicit identity lexeme overlap.");}
  else if(m.concept_overlap.length){v=Math.max(v,Math.min(0.82,0.55+0.09*m.concept_overlap.length));r.push(`Semantic concept overlap: ${m.concept_overlap.join(", ")}.`);}
  else {v=Math.max(v,Math.min(0.6,m.score));r.push("Only weak contextual semantic support.");}
  return {value:clamp01(v),rationale:r};
}

function reproducibility(data:Dataset,edges:Array<{evidence:Evidence}>,m:MatchCandidate|null,root:string):{value:number;rationale:string[]} {
  const curated=edges.length>0;
  const strongestCurated=curated?Math.max(...edges.map(e=>quranOrEvidenceStrength(data,e.evidence))):0;
  if(curated&&m?.divine_root===root)return {value:1,rationale:["Curated relation reproduced by the automatic matcher."]};
  if(curated&&strongestCurated>=0.9)return {value:0.9,rationale:["Very strong curated text remains primary even when the heuristic matcher does not reproduce it."]};
  if(curated&&strongestCurated>=0.8)return {value:0.85,rationale:["Strong curated root evidence; matcher disagreement receives only a modest penalty."]};
  if(curated&&m)return {value:0.7,rationale:[`Curated root ${root} exists, but automatic candidate points elsewhere.`]};
  if(curated&&!m)return {value:0.65,rationale:["Curated relation exists, but matcher does not reproduce it above threshold."]};
  if(!curated&&m?.divine_root===root)return {value:0.55,rationale:["Automatic candidate only; no curated relation yet."]};
  return {value:0.4,rationale:["Neither curated relation nor reproducible auto candidate is available."]};
}

export function scoreAsmaRelation(data:Dataset,prophetId:string,divineRoot:string):RelationScore|null {
  const p=data.prophets[prophetId],f=data.divine_attributes[divineRoot];
  if(!p||!f)return null;
  const edges=relationEdges(data,prophetId,divineRoot);
  const allAuto=matchAsmaForProphet(data,p,Math.max(10,data.matcher_config?.max_candidates??3));
  const auto=allAuto.find(x=>x.divine_root===divineRoot)??null;

  const curatedStrengths=edges.map(e=>quranOrEvidenceStrength(data,e.evidence));
  // Scientific guardrail: automatic matching is derived from the same textual dataset and is NOT independent evidence.
  // It therefore contributes to reproducibility/linguistic checks, not to evidence strength when curated evidence exists.
  const autoHypothesisStrength=auto?quranOrEvidenceStrength(data,auto.evidence)*0.25:0;
  const evidenceStrength=curatedStrengths.length?noisyOr(curatedStrengths):autoHypothesisStrength;
  const evidenceRationale=curatedStrengths.length
    ? edges.map(e=>`Curated ${e.evidence} = ${quranOrEvidenceStrength(data,e.evidence).toFixed(2)}; automatic matcher excluded from evidence aggregation to prevent double counting.`)
    : (auto?[`Automatic-only hypothesis support ${auto.evidence} ×0.25 = ${autoHypothesisStrength.toFixed(2)}; not treated as independent textual evidence.`]:["No textual support available."]);

  const autoLing=automaticLinguisticScore(auto);
  const curatedLing=curatedLinguisticFloor(data,edges);
  const ling={value:Math.max(autoLing.value,curatedLing.value),rationale:[...curatedLing.rationale,...autoLing.rationale]};
  const provenanceValues=edges.map(provenanceForEdge);
  const provenance=provenanceValues.length?noisyOr(provenanceValues):auto?(p.rid.quran_refs.length?0.65:0.45):0.3;
  const provenanceRationale=edges.length?edges.map(e=>`Curated edge provenance=${provenanceForEdge(e).toFixed(2)}.`):["No curated edge; provenance estimated from RID references only."];
  const consistency=crossSourceConsistency(edges);
  const repro=reproducibility(data,edges,auto,divineRoot);

  const components:ScoreComponent[]=[
    {name:"evidence_strength",value:evidenceStrength,rationale:evidenceRationale},
    {name:"linguistic_match",value:ling.value,rationale:ling.rationale},
    {name:"provenance",value:provenance,rationale:provenanceRationale},
    {name:"cross_source_consistency",value:consistency.value,rationale:consistency.rationale},
    {name:"reproducibility",value:repro.value,rationale:repro.rationale}
  ];
  const raw=100*geometricMean(components.map(x=>x.value));
  return {
    prophet_id:p.id,prophet_name:p.display_name,divine_root:divineRoot,divine_name:f.forms[0]?.name??divineRoot,
    raw_score:Number(raw.toFixed(2)),band:scoreBand(raw),calibrated_probability:null,calibration_status:"UNCALIBRATED",
    components,curated_evidence:edges.map(e=>e.evidence),automatic_candidate:auto,
    mathematical_properties:["bounded_0_100","monotonic_support","diminishing_returns","conflict_penalty","equal_weight_geometric_balance"]
  };
}

export function scoreProphetRelations(data:Dataset,prophetId:string):RelationScore[] {
  const p=data.prophets[prophetId];if(!p)return [];
  const roots=new Set<string>();
  for(const e of data.edges.filter(e=>e.from===`prophet:${prophetId}`&&e.type==="asma_relation")) roots.add(e.canonical_divine_root??e.to.replace("divine-root:",""));
  for(const m of matchAsmaForProphet(data,p,10)) roots.add(m.divine_root);
  return [...roots].map(r=>scoreAsmaRelation(data,prophetId,r)).filter((x):x is RelationScore=>!!x).sort((a,b)=>b.raw_score-a.raw_score);
}

export function scoreAllRelations(data:Dataset):Record<string,RelationScore[]> {
  return Object.fromEntries(data.prophet_order.map(id=>[id,scoreProphetRelations(data,id)]));
}

export function profileDataScore(data:Dataset,p:ProphetProfile):ProfileDataScore {
  const ridEv=ridEvidenceValue(p);
  const statusEv=quranOrEvidenceStrength(data,p.quranic_status.evidence);
  const missionVals=Object.values(p.mission).map(x=>quranOrEvidenceStrength(data,x.evidence));
  const mission=missionVals.length?missionVals.reduce((a,b)=>a+b,0)/missionVals.length:0;
  const root=confidenceValue[p.name_root.confidence]??0.5;
  const curatedRoots=[...new Set(data.edges
    .filter(e=>e.from===`prophet:${p.id}`&&e.type==="asma_relation")
    .map(e=>e.canonical_divine_root??e.to.replace("divine-root:","")))];
  const curatedScores=curatedRoots
    .map(r=>scoreAsmaRelation(data,p.id,r))
    .filter((x):x is RelationScore=>!!x)
    .map(x=>x.raw_score/100);
  const asma=curatedScores.length?curatedScores.reduce((a,b)=>a+b,0)/curatedScores.length:0;
  const components={rid_evidence:ridEv,status_evidence:statusEv,mission_evidence:mission,name_root_confidence:root,asma_relation_quality:asma};
  const score=100*geometricMean(Object.values(components));
  return {prophet_id:p.id,prophet_name:p.display_name,data_confidence_score:Number(score.toFixed(2)),band:scoreBand(score),calibration_status:"UNCALIBRATED",components,note:"Data-confidence only; never interpret as rank, holiness, or worth of a prophet."};
}

export function scoreAllProfiles(data:Dataset):ProfileDataScore[] {
  return data.prophet_order.map(id=>data.prophets[id]).filter((p):p is ProphetProfile=>!!p).map(p=>profileDataScore(data,p));
}

export interface CalibrationObservation { raw_score:number; label:0|1; }
export interface CalibrationReport { n:number; brier_score:number|null; calibration_status:"INSUFFICIENT_DATA"|"EVALUATED"; note:string; }

/** Brier score for externally labeled benchmark data. Raw scores are converted to [0,1]
 * only for evaluation of a supplied benchmark; this does not magically make raw scores probabilities. */
export function evaluateCalibration(observations:CalibrationObservation[]):CalibrationReport {
  if(observations.length<20)return {n:observations.length,brier_score:null,calibration_status:"INSUFFICIENT_DATA",note:"Need at least 20 independently labeled benchmark claims; 100+ is recommended for meaningful calibration."};
  const brier=observations.reduce((s,o)=>{const p=clamp01(o.raw_score/100);return s+(p-o.label)**2;},0)/observations.length;
  return {n:observations.length,brier_score:Number(brier.toFixed(6)),calibration_status:"EVALUATED",note:"Lower Brier is better. Reliability diagrams should also be inspected before calling a score calibrated probability."};
}
