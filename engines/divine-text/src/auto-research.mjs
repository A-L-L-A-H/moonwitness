import {runResearch} from './research-agent.mjs';
const root=new URL('..',import.meta.url).pathname.replace(/\/$/,'');
const topics=['isa','musa','dawud'];
const out={version:'5.1.0',mode:'deterministic',runs:{}};
for(const t of topics) out.runs[t]=await runResearch(root,t);
console.log(JSON.stringify(out,null,2));
