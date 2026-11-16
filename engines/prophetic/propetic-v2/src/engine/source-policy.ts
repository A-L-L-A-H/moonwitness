import type { Evidence, MissionSlot, ProphetProfile, SupplementalWitness } from "../types.js";
export const SOURCE_PRIORITY = ["AL-QURAN","TAURAT","ZABUR","INJIL"] as const;
export type SourceName=typeof SOURCE_PRIORITY[number]|"UNKNOWN";
export interface SourceResolution { source:SourceName; evidence:Evidence; refs:string[]; claim:string; witness?:SupplementalWitness }
export function supplementalByBook(p:ProphetProfile, book:SupplementalWitness["source_book"]){ return p.supplemental_witnesses.filter(w=>w.source_book===book); }
export function hasStrongQuranMissionEvidence(p:ProphetProfile){ return Object.values(p.mission).some(v=>["Q5","Q4","Q3","Q2"].includes(v.evidence)); }
export function resolveMissionSource(p:ProphetProfile,slot:string):SourceResolution {
  const q:MissionSlot|undefined=p.mission[slot];
  if(q&&q.evidence.startsWith("Q")) return {source:"AL-QURAN",evidence:q.evidence,refs:q.refs,claim:q.summary};
  for(const book of ["TAURAT","ZABUR","INJIL"] as const){
    const w=p.supplemental_witnesses.find(x=>x.source_book===book&&x.mission_slots?.includes(slot));
    if(w)return {source:book,evidence:w.evidence,refs:[w.ref],claim:w.claim,witness:w};
  }
  return {source:"UNKNOWN",evidence:"E0",refs:q?.refs??[],claim:q?.summary??"UNKNOWN / NOT EXPLICIT"};
}
