import fs from 'node:fs';
export const EDGE_TYPES=['supports','contradicts','corroborates','interprets','depends_on','candidate_for','not_equivalent','qualifies'];
export function buildGraph(claimsFile, graphFile=null){
  const payload=JSON.parse(fs.readFileSync(claimsFile,'utf8'));
  const claims=Array.isArray(payload)?payload:(payload.claims??[]);
  const nodes=claims.map(c=>({id:c.claim_id??c.id,type:'claim',status:c.status??'UNKNOWN',source_type:c.source_type??c.source?.type??null,reference:c.reference??c.source?.reference??null,text:c.claim??null}));
  let edges=[];
  for(const c of claims){
    const id=c.claim_id??c.id;
    for(const rel of (c.relations??[])) if(EDGE_TYPES.includes(rel.type) && rel.to) edges.push({from:id,to:rel.to,type:rel.type,reason:rel.reason??null});
  }
  if(graphFile && fs.existsSync(graphFile)){
    const extra=JSON.parse(fs.readFileSync(graphFile,'utf8'));
    if(Array.isArray(extra.edges)) edges=[...edges,...extra.edges.filter(e=>EDGE_TYPES.includes(e.type)&&e.from&&e.to)];
  }
  return {nodes,edges,node_count:nodes.length,edge_count:edges.length,relation_status:edges.length?'ACTIVE':'NO_RELATIONS'};
}
