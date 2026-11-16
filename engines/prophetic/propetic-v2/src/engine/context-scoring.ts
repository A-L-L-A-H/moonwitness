import type { Confidence, ContextScoreRow, Dataset, Evidence, ProphetProfile } from "../types.js";
const conf:Record<Confidence,number>={low:.35,medium:.65,high:.90};
function ev(data:Dataset,e:Evidence){return data.evidence_scale[e]?.score??0;}
function mean(xs:number[]){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;}
function gm(xs:number[]){const floor=.05;return Math.exp(xs.reduce((s,x)=>s+Math.log(Math.max(x,floor)),0)/xs.length);}
export function scoreContext(data:Dataset,p:ProphetProfile):Omit<ContextScoreRow,"rank">{
  const c=p.context;if(!c)return {prophet_id:p.id,prophet_name:p.display_name,context_score:0,religion_score:0,region_score:0,language_score:0,modern_crosswalk_confidence:0,band:"NO_CONTEXT",note:"No context graph."};
  const religion=ev(data,c.religion.evidence);
  const region=mean([ev(data,c.people_region.people_evidence),ev(data,c.people_region.region_evidence)]);
  const language=mean([ev(data,c.language.evidence),ev(data,c.language.scripture_evidence)]);
  const context=gm([religion,region,language]);
  const score=Number((100*context).toFixed(2));
  return {prophet_id:p.id,prophet_name:p.display_name,context_score:score,religion_score:Number((100*religion).toFixed(2)),region_score:Number((100*region).toFixed(2)),language_score:Number((100*language).toFixed(2)),modern_crosswalk_confidence:100*conf[c.people_region.modern_crosswalk_confidence],band:score>=90?"VERY_STRONG":score>=75?"STRONG":score>=55?"MODERATE":score>=35?"LIMITED":"SPARSE",note:"Evidence/provenance quality only; not a rank of religion, people, language, country, or prophet."};
}
export function contextLeaderboard(data:Dataset):ContextScoreRow[]{
 const rows=data.prophet_order.map(id=>data.prophets[id]).filter((p):p is ProphetProfile=>!!p).map(p=>scoreContext(data,p)).sort((a,b)=>b.context_score-a.context_score||a.prophet_name.localeCompare(b.prophet_name));
 let last:number|undefined,rank=0;return rows.map((r,i)=>{if(last===undefined||Math.abs(r.context_score-last)>1e-9)rank=i+1;last=r.context_score;return {...r,rank};});
}
