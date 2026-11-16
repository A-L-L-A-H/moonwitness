import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export async function readJsonl(file){ const raw=await readFile(file,'utf8'); return raw.split(/\r?\n/).filter(Boolean).map((line,i)=>{try{return JSON.parse(line)}catch(e){throw new Error(`Invalid JSONL ${file}:${i+1}`)}}); }
export function sha256(s){return createHash('sha256').update(s).digest('hex')}
export function confidence(t){if(t>=90)return'VERY_STRONG';if(t>=80)return'STRONG';if(t>=70)return'GOOD';if(t>=60)return'MODERATE';if(t>=50)return'MIXED';if(t>=40)return'WEAK';if(t>=20)return'VERY_WEAK';return'UNVERIFIED'}
