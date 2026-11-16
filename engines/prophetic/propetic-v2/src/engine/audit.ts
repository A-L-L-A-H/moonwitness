import type { Dataset } from "../types.js";
export interface AuditFinding { severity:"info"|"warning"|"error"; code:string; prophet?:string; message:string }
export function auditDataset(data:Dataset):AuditFinding[]{
  const out:AuditFinding[]=[];
  const roots=new Map<string,string>();
  for(const f of Object.values(data.divine_attributes)){
    if(roots.has(f.id)) out.push({severity:"error",code:"DIVINE_ID_COLLISION",message:`Duplicate divine ID ${f.id}`});
    roots.set(f.id,f.root);
  }
  for(const [id,p] of Object.entries(data.prophets)){
    if(p.name_root.root==="UNKNOWN") out.push({severity:"info",code:"NAME_ROOT_UNKNOWN",prophet:id,message:`${p.display_name}: etymology kept UNKNOWN rather than guessed.`});
    if(p.name_root.root!==p.rid.root) out.push({severity:"info",code:"ROOT_RID_SEPARATED",prophet:id,message:`${p.display_name}: name root and positive RID intentionally differ.`});
    if(p.supplemental_witnesses.some(w=>w.relation_to_quran.includes("DIVERGES"))) out.push({severity:"warning",code:"CROSS_SCRIPTURE_DIFFERENCE",prophet:id,message:`${p.display_name}: a cross-scripture difference is preserved.`});
    if(p.quranic_status.evidence==="T1") out.push({severity:"warning",code:"STATUS_DEBATED",prophet:id,message:`${p.display_name}: prophetic status is traditional/debated in this model.`});
  }
  return out;
}
