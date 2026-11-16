import { confidence } from './utils.mjs';
export const MAX={sourceQuality:20,transmission:25,proximity:20,corroboration:20,interpretationGap:15};
export function scoreEvidenceV5(input){
  const evidence=input?.evidence ?? {};
  for(const k of Object.keys(MAX)){
    const v=evidence[k];
    if(v===undefined) throw new Error(`Missing evidence component: ${k}`);
    if(!Number.isFinite(v)||v<0||v>MAX[k]) throw new RangeError(`${k} must be 0..${MAX[k]}`);
  }
  const basis=input.basis ?? {};
  const missing=Object.keys(MAX).filter(k=>!basis[k] || (Array.isArray(basis[k])&&basis[k].length===0));
  if(missing.length) return {status:'PENDING',total:null,missingBasis:missing,confidence:'PENDING'};
  const total=Object.values(evidence).reduce((a,b)=>a+b,0);
  return {status:'SCORED',...evidence,total,confidence:confidence(total),basis};
}
