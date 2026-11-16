import type { Dataset, ProfileAuditFinding, ProfileAuditResult } from "../types.js";
import { matchAsmaForProphet } from "./semantic.js";
import { resolveMissionSource } from "./source-policy.js";

function curatedRoots(data:Dataset,id:string):string[]{
  return [...new Set(data.edges.filter(e=>e.from===`prophet:${id}`&&e.type==="asma_relation")
    .map(e=>e.canonical_divine_root ?? e.to.replace("divine-root:","")) )];
}

export function auditProfiles(data:Dataset):ProfileAuditResult[]{
  return data.prophet_order.map(id=>{
    const p=data.prophets[id]; const findings:ProfileAuditFinding[]=[];
    if(!p) return {prophet_id:id,prophet_name:id,result:"FAIL",findings:[{severity:"error",code:"PROFILE_MISSING",message:"Profile missing."}],curated_asma_roots:[],auto_top_match:null,auto_agrees_with_curated:false};
    if(p.rid.polarity!=="positive") findings.push({severity:"error",code:"RID_NOT_POSITIVE",message:"RID must remain positive."});
    if(!p.rid.quran_refs.length && p.rid.source_type!=="native_name_root") findings.push({severity:"review",code:"RID_NO_QURAN_REF",message:"Non-native RID lacks Qur'an reference."});
    if(p.name_root.root==="UNKNOWN") findings.push({severity:"review",code:"NAME_ROOT_UNKNOWN",message:"Name etymology intentionally remains UNKNOWN."});
    if((p.name_root.status??"").includes("disputed")) findings.push({severity:"review",code:"NAME_ROOT_DISPUTED",message:"Name-root etymology is disputed."});
    if(p.quranic_status.evidence==="T1") findings.push({severity:"review",code:"STATUS_DEBATED",message:"Prophetic status is tafsir/traditional rather than direct Qur'anic label."});
    if(p.id==="adam") findings.push({severity:"review",code:"ADAM_STATUS_GUARDRAIL",message:"Conventional prophet classification retained, but Qur'an does not directly use nabi/rasul label for Adam."});
    if(p.id==="ismail"&&p.mission.test?.refs.includes("37:102-107")) findings.push({severity:"info",code:"SACRIFICE_NAME_GUARDRAIL",message:"QS 37:102-107 leaves the son unnamed; Ismail identification remains T1 only."});
    if(p.supplemental_witnesses.some(w=>w.relation_to_quran.includes("DIVERGES"))) findings.push({severity:"review",code:"CROSS_SCRIPTURE_DIFFERENCE",message:"Cross-scripture difference is preserved rather than harmonized."});
    for(const [slot,v] of Object.entries(p.mission)){ if(v.evidence==="E0"){ const r=resolveMissionSource(p,slot); if(r.source!=="UNKNOWN") findings.push({severity:"info",code:"FOUR_CORPUS_FALLBACK",message:`${slot}: Qur’an E0 → ${r.source} ${r.refs.join(", ")}`}); } }
    const top=matchAsmaForProphet(data,p,1)[0] ?? null; const curated=curatedRoots(data,id);
    if(!top) findings.push({severity:"review",code:"NO_AUTO_ASMA_MATCH",message:"Automatic matcher produced no candidate above threshold."});
    const agrees=!!top&&curated.includes(top.divine_root);
    if(top&&!agrees) findings.push({severity:"info",code:"AUTO_MATCH_NEW_CANDIDATE",message:`Top automatic candidate ${top.divine_name} (${top.divine_root}) is not yet a curated edge.`});
    const result=findings.some(x=>x.severity==="error")?"FAIL":findings.some(x=>x.severity==="review")?"PASS_WITH_REVIEW":"PASS";
    return {prophet_id:id,prophet_name:p.display_name,result,findings,curated_asma_roots:curated,auto_top_match:top,auto_agrees_with_curated:agrees};
  });
}
