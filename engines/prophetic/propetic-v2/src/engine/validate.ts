import type { Dataset, Evidence } from "../types.js";
import { matchAsmaForProphet } from "./semantic.js";
const missionSlots=["call","test","gift","mission","conflict","response","judgment","legacy"];
export interface ValidationReport { ok:boolean; errors:string[]; warnings:string[]; counts:Record<string,number> }
export function validateDataset(data:Dataset):ValidationReport {
  const errors:string[]=[]; const warnings:string[]=[];
  if(data.schema_version!=="2.0") errors.push(`schema_version must be 2.0, got ${data.schema_version}`);
  if(data.prophet_order.length!==25) warnings.push(`Expected conventional 25-name set; got ${data.prophet_order.length}`);
  for(const id of data.prophet_order){
    const p=data.prophets[id]; if(!p){errors.push(`Missing prophet ${id}`);continue;}
    if(p.rid.polarity!=="positive") errors.push(`${id}: RID must be positive`);
    if(!p.name_root.name_root_source_language) errors.push(`${id}: missing name-root source language`);
    if(!p.quranic_status.classification) errors.push(`${id}: missing Qur'anic status`);
    if(!p.context) errors.push(`${id}: missing context graph`);
    for(const slot of missionSlots) if(!p.mission[slot]) errors.push(`${id}: missing mission slot ${slot}`);
    for(const w of p.supplemental_witnesses) if(!["TAURAT","ZABUR","INJIL"].includes(w.source_book)) errors.push(`${id}: invalid supplemental book ${w.source_book}`);
    if((p.world_traits?.length??0)>3) errors.push(`${id}: world trait mapping must be capped at 3 traits`);
    const auto=matchAsmaForProphet(data,p);
    if(!auto.length) errors.push(`${id}: automatic matcher produced no ASMA candidate`);
    if(auto.some(x=>x.evidence==="Q5")) errors.push(`${id}: automatic matcher may not emit Q5`);
  }
  for(const [root,f] of Object.entries(data.divine_attributes)){
    if(root!==f.root) errors.push(`Divine registry key ${root} must equal canonical root ${f.root}`);
    if(f.id!==`root:${f.root}`) errors.push(`${root}: collision-safe id must be root:${f.root}`);
    if(!f.forms.length) errors.push(`${root}: no divine form`);
  }
  for(const e of data.edges){
    if(!data.evidence_scale[e.evidence as Evidence]) errors.push(`${e.id}: unknown evidence ${e.evidence}`);
    if(e.guardrail==="RELATION_NOT_IDENTITY" && e.type!=="asma_relation") warnings.push(`${e.id}: relation guardrail on non-Asma edge`);
    if(e.type==="asma_relation"){
      const root=e.canonical_divine_root ?? e.to.replace("divine-root:","");
      if(!data.divine_attributes[root]) errors.push(`${e.id}: missing divine root target ${root}`);
      if(!e.relation_mode) errors.push(`${e.id}: missing relation_mode`);
    }
  }
  const ismail=data.prophets.ismail;
  if(ismail?.mission.test?.refs.includes("37:102-107") && ismail.mission.test.evidence==="Q5") errors.push("Ismail sacrifice identification must not be Q5");
  if(data.prophets.dhulkifl?.quranic_status.evidence!=="T1") errors.push("Dhul-Kifl prophethood must remain debated/T1 in this model");
  if(data.prophets.adam?.quranic_status.evidence==="Q5") errors.push("Adam must not be directly labeled nabi/rasul by Qur'an in this dataset");
  if(!data.divine_attributes["ʿ-L-M"]||!data.divine_attributes["Ḥ-L-M"]) errors.push("Al-ʿAlim / Al-Halim root families must both exist independently");
  const musaHdy=data.edges.find(e=>e.from==="prophet:musa"&&e.type==="asma_relation"&&(e.canonical_divine_root==="H-D-Y"||e.to==="divine-root:H-D-Y"));
  if(musaHdy?.evidence==="Q5") errors.push("Musa H-D-Y relation must not be Q5; it is mission-alignment/semantic in this model");
  const witnessCount=Object.values(data.prophets).reduce((n,p)=>n+p.supplemental_witnesses.length,0);
  const supplementEdgeCount=data.edges.filter(e=>e.type==="supplemental_witness").length;
  if(witnessCount!==supplementEdgeCount) errors.push(`Supplemental witness/edge mismatch: ${witnessCount} witnesses vs ${supplementEdgeCount} edges`);
  const counts={
    prophets:Object.keys(data.prophets).length,
    edges:data.edges.length,
    asma_edges:data.edges.filter(e=>e.type==="asma_relation").length,
    supplemental_edges:data.edges.filter(e=>e.type==="supplemental_witness").length,
    positive_rid:Object.values(data.prophets).filter(p=>p.rid.polarity==="positive").length,
    unknown_name_roots:Object.values(data.prophets).filter(p=>p.name_root.root==="UNKNOWN").length,
    divine_root_families:Object.keys(data.divine_attributes).length,
    auto_match_coverage:data.prophet_order.filter(id=>{const p=data.prophets[id];return !!p&&matchAsmaForProphet(data,p).length>0;}).length,
    world_trait_profiles:data.prophet_order.filter(id=>(data.prophets[id]?.world_traits?.length??0)>0).length
  };
  return {ok:errors.length===0,errors,warnings,counts};
}
