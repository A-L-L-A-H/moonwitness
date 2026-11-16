import type { Dataset, EventNode, GenealogyGraph, TimelineDataset } from "../types.js";
export function buildEventGraph(d:Dataset,t:TimelineDataset){const e:EventNode[]=[];for(const id of d.prophet_order){const p=d.prophets[id],era=t.eras[id];if(!p||!era)continue;for(const[slot,m]of Object.entries(p.mission))e.push({id:`event:${id}:${slot}`,prophet_id:id,slot,summary:m.summary,refs:m.refs,evidence:m.evidence,era:era.era,era_confidence:era.confidence});}return e;}
export const relationsForProphet=(g:GenealogyGraph,id:string)=>g.relations.filter(r=>r.from===`prophet:${id}`||r.to===`prophet:${id}`);
export const timelineForProphet=(e:EventNode[],id:string)=>e.filter(x=>x.prophet_id===id);
