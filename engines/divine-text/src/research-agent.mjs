import fs from 'node:fs/promises';
import {scoreEvidenceV5} from './score-v5.mjs';
import {buildGraph} from './evidence-graph-v5.mjs';
import {searchQuran} from './quran.mjs';

const TOPICS={
  isa:{label:'Isa / Jesus',queries:['عيسى','المسيح','الإنجيل','يسوع'],claimIds:['INJIL-001','INJIL-002']},
  musa:{label:'Musa / Moses',queries:['موسى','التوراة'],claimIds:['TORAH-001','TORAH-002']},
  dawud:{label:'Dawud / David',queries:['داود','زبور'],claimIds:['ZABUR-001']}
};

export function buildResearchPlan(topic){
  const t=TOPICS[topic]||TOPICS.isa;
  return {version:'5.1.0',topic,label:t.label,steps:[
    'Collect primary passages from local Quran corpus',
    'Resolve linked claims and their current status',
    'Collect manuscript witnesses registered locally',
    'Apply evidence scoring only where every scoring component has a basis',
    'Mark missing external corpora explicitly as PENDING',
    'Produce a reproducible report with findings and open questions'
  ],claimIds:t.claimIds,corpusPolicy:'LOCAL_FIRST_NO_FABRICATION'};
}

export async function runResearch(root, topic='isa'){
  const plan=buildResearchPlan(topic);
  const records=JSON.parse(await fs.readFile(`${root}/data/claims/claims.json`,'utf8'));
  const claims=records.claims??records;
  const selected=claims.filter(c=>plan.claimIds.includes(c.claim_id));
  const jsonl=(await fs.readFile(`${root}/data/corpora/quran/quran_normalized.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(x=>JSON.parse(x));
  const qResults=plan.topic==='isa'||plan.topic==='musa'||plan.topic==='dawud'
    ? plan.topic==='isa' ? [...new Set(TOPICS.isa.queries.flatMap(q=>searchQuran(jsonl,q,25)))] : plan.topic==='musa' ? [...new Set(TOPICS.musa.queries.flatMap(q=>searchQuran(jsonl,q,25)))] : [...new Set(TOPICS.dawud.queries.flatMap(q=>searchQuran(jsonl,q,25)))]
    : [];
  const graph=buildGraph(`${root}/data/claims/claims.json`,`${root}/data/graph/edges.json`);
  const scored=selected.map(c=>({claim_id:c.claim_id,status:c.status,score: c.score??null}));
  const corpusGaps={hadith:'PENDING_EXTERNAL_FILE',torah:'EXTERNAL_REGISTER_ONLY',psalms:'EXTERNAL_REGISTER_ONLY',gospels:'EXTERNAL_REGISTER_ONLY'};
  return {version:'5.1.0',plan,claims:scored,quranMatches:qResults.map(x=>({surah:x.surah,ayah:x.ayah,text:x.text_uthmani,name:x.surah_name})),graph,corpusGaps,openQuestions:[
    'Which surviving text tradition, if any, can be demonstrated to be identical to the revelation claim?',
    'What manuscript witnesses bear on the claim and how directly?',
    'Which conclusions are source claims versus historical or interpretive inferences?'
  ],status:'PARTIAL_BY_DESIGN'};
}

import {askAI, providerStatus} from './ai-providers.mjs';

export async function askGeneralAI(prompt, options={}){
  try{
    const result=await askAI(prompt, options);
    return {available: result.provider !== 'deterministic', ...result};
  }catch(error){
    return {available:false, error: error.message, providerStatus: providerStatus()};
  }
}

export {providerStatus};
