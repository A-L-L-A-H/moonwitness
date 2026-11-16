import type { Dataset, Evidence, GraphEdge, ProphetProfile } from "../types.js";
import { evidenceScore } from "./evidence.js";
export class ProphetGraph {
  constructor(public readonly data:Dataset){}
  prophet(id:string):ProphetProfile|undefined { return this.data.prophets[id]; }
  asma(id:string,min:Evidence="E0"):GraphEdge[]{ const floor=evidenceScore(this.data,min); return this.data.edges.filter(e=>e.from===`prophet:${id}`&&e.type==="asma_relation"&&evidenceScore(this.data,e.evidence)>=floor).sort((a,b)=>evidenceScore(this.data,b.evidence)-evidenceScore(this.data,a.evidence)); }
  supplements(id:string){ return this.data.prophets[id]?.supplemental_witnesses ?? []; }
  byRid(root:string){ const q=root.trim().toLowerCase(); return Object.values(this.data.prophets).filter(p=>p.rid.root.toLowerCase()===q); }
  search(q:string){ const s=q.trim().toLowerCase(); if(!s)return []; return Object.values(this.data.prophets).filter(p=>JSON.stringify(p).toLowerCase().includes(s)); }
}
