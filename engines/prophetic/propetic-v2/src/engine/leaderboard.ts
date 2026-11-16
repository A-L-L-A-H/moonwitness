import type { Dataset, Evidence, LeaderboardRow, ProphetProfile, RelationMode } from "../types.js";
import { scoreAllProfiles } from "./scoring.js";
const traitModes=new Set<RelationMode>(["SHARED_LEXEME_TRAIT","SHARED_ROOT_TRAIT","SEMANTIC_TRAIT_REFLECTION"]);
function band(score:number){if(score>=90)return "DIRECT_LEXEME";if(score>=80)return "SHARED_ROOT";if(score>=65)return "SEMANTIC";return "LIMITED";}
function assignCompetitionRanks(rows:LeaderboardRow[]){let lastScore:number|undefined;let lastRank=0;rows.forEach((r,i)=>{if(lastScore===undefined||Math.abs(r.score-lastScore)>1e-9)lastRank=i+1;r.rank=lastRank;lastScore=r.score;});return rows;}
function strength(data:Dataset,e:Evidence){return data.evidence_scale[e]?.score??0;}
/** Trait Evidence = strongest curated evidence class among shared/semantic trait relations only. */
export function traitEvidenceScore(data:Dataset,p:ProphetProfile):number {
  const vals=data.edges.filter(e=>e.from===`prophet:${p.id}`&&e.type==="asma_relation"&&e.relation_mode&&traitModes.has(e.relation_mode)).map(e=>strength(data,e.evidence));
  return vals.length?100*Math.max(...vals):0;
}
export function traitEvidenceLeaderboard(data:Dataset):LeaderboardRow[]{
  const rows=data.prophet_order.map(id=>data.prophets[id]).filter((p):p is ProphetProfile=>!!p).map(p=>{const score=Number(traitEvidenceScore(data,p).toFixed(2));return {rank:0,prophet_id:p.id,prophet_name:p.display_name,score,band:band(score),metric:"TRAIT_EVIDENCE",note:"Strongest curated shared/semantic trait evidence class. Heuristic matcher, divine interaction, mission alignment and etymology are excluded."};}).sort((a,b)=>b.score-a.score||a.prophet_name.localeCompare(b.prophet_name));return assignCompetitionRanks(rows);
}
export function dataConfidenceLeaderboard(data:Dataset):LeaderboardRow[]{const rows=scoreAllProfiles(data).map(x=>({rank:0,prophet_id:x.prophet_id,prophet_name:x.prophet_name,score:x.data_confidence_score,band:x.band,metric:"DATA_CONFIDENCE",note:"Includes RID/status/mission/name-root/ASMA data confidence; not prophet rank."})).sort((a,b)=>b.score-a.score||a.prophet_name.localeCompare(b.prophet_name));return assignCompetitionRanks(rows);}
export function worldTraitSalienceScore(p:ProphetProfile):number|null {
  const traits=(p.world_traits??[]).filter(t=>t.via_alpha!==null);
  if(traits.length<2)return null;
  const contributions=traits.map(t=>t.textual_strength*t.mapping_confidence*(t.via_alpha??0)*((t.moral_top5?1:0)+(t.prevalence_top5?1:0))).sort((a,b)=>b-a).slice(0,2);
  return Number((100*contributions.reduce((a,b)=>a+b,0)/4).toFixed(2));
}
export function worldTraitLeaderboard(data:Dataset):LeaderboardRow[]{const rows=data.prophet_order.map(id=>data.prophets[id]).filter((p):p is ProphetProfile=>!!p).map(p=>{const score=worldTraitSalienceScore(p);return score===null?null:{rank:0,prophet_id:p.id,prophet_name:p.display_name,score,band:score>=30?"HIGH_SALIENCE":score>=15?"SOME_SALIENCE":"LOW_SALIENCE",metric:"WORLD_TRAIT_SALIENCE",note:"At least two conservative trait mappings required. Uses textual evidence × mapping confidence × VIA reliability × published top-five categories; not preference probability."};}).filter((x):x is LeaderboardRow=>!!x).sort((a,b)=>b.score-a.score||a.prophet_name.localeCompare(b.prophet_name));return assignCompetitionRanks(rows);}
