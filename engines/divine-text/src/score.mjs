import {confidence} from './utils.mjs';
export const MAX={sourceQuality:20,transmission:25,proximity:20,corroboration:20,interpretationGap:15};
export function scoreEvidence(v){for(const k of Object.keys(MAX)){if(!Number.isFinite(v[k])||v[k]<0||v[k]>MAX[k])throw new RangeError(`${k} must be 0..${MAX[k]}`)}const total=Object.values(v).reduce((a,b)=>a+b,0);return{...v,total,confidence:confidence(total)}}
