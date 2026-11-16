import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const STATE = path.join(REPO, 'data/autopilot/state.json');
const REPORT = path.join(REPO, 'outputs/AUTOPILOT_REPORT.json');
const TASKS = path.join(REPO, 'data/autopilot/tasks.json');

async function readJson(p, fallback) {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); }
  catch { return fallback; }
}
async function writeJson(p, obj) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(obj, null, 2), 'utf8');
}

function now(){ return new Date().toISOString(); }

function buildTasks(question) {
  return [
    { id:'T001', type:'parse_question', status:'pending', input:{question}, output:null },
    { id:'T002', type:'resolve_entities', status:'pending', input:null, output:null },
    { id:'T003', type:'retrieve_local_corpus', status:'pending', input:null, output:null },
    { id:'T004', type:'build_evidence_graph', status:'pending', input:null, output:null },
    { id:'T005', type:'score_evidence', status:'pending', input:null, output:null },
    { id:'T006', type:'check_review_gate', status:'pending', input:null, output:null },
    { id:'T007', type:'generate_report', status:'pending', input:null, output:null }
  ];
}

async function parseQuestion(task) {
  const q = String(task.input?.question || '').trim();
  const tokens = q.split(/\s+/).filter(Boolean);
  return { question:q, token_count:tokens.length, status:q?'READY':'BLOCKED_EMPTY_QUESTION' };
}

async function resolveEntities(task, context) {
  const q = context.question.toLowerCase();
  let entities = [];
  if (q.includes('isa') || q.includes('jesus')) entities.push('isa', 'injil', 'gospels');
  if (q.includes('musa') || q.includes('moses')) entities.push('musa', 'torah');
  if (q.includes('dawud') || q.includes('david')) entities.push('dawud', 'zabur', 'psalms');
  
  return { entities, status:'READY' };
}

async function loadLocalCorpusSummary(){
  const quran = path.join(REPO,'data/corpora/quran/quran_normalized.jsonl');
  let quranCount = 0;
  try { quranCount = (await fs.readFile(quran,'utf8')).split('\n').filter(Boolean).length; } catch {}
  const hadith = path.join(REPO,'data/corpora/hadith');
  let hadithReady = false;
  try { await fs.access(hadith); hadithReady = true; } catch {}
  return { quran:{available:quranCount>0, records:quranCount}, hadith:{directory:hadithReady, corpus_ready:false}, torah:{corpus_ready:false}, psalms:{corpus_ready:false}, gospels:{corpus_ready:false} };
}

async function retrieveLocal(task, context){
  const corpus = await loadLocalCorpusSummary();
  const available = Object.entries(corpus).filter(([,v])=>v.available || v.corpus_ready).map(([k])=>k);
  return { corpus, available_sources:available, status: available.length?'PARTIAL':'BLOCKED_NO_LOCAL_CORPUS' };
}

import { buildEvidenceGraph } from '../evidence-graph.mjs';

async function buildGraph(task, context){
  const entities = context.entities || [];
  const fullGraph = buildEvidenceGraph();
  
  const relevantNodes = fullGraph.nodes.filter(n => 
    entities.length === 0 || n.tags.some(t => entities.includes(t)) || entities.includes('all')
  );
  
  const relevantIds = new Set(relevantNodes.map(n => n.id));
  const relevantEdges = fullGraph.edges.filter(e => relevantIds.has(e.from) || relevantIds.has(e.to));
  
  const edges = relevantEdges.map(e => {
    const fromNode = fullGraph.nodes.find(n => n.id === e.from);
    return {
      from: e.from,
      relation: e.type,
      to: e.to,
      evidence_status: fromNode?.status === 'QURAN_EXPLICIT' ? 'explicit' : 'pending'
    };
  });
  
  return { nodes: relevantNodes, edges, status: relevantNodes.length ? 'READY' : 'NO_RELATIONS' };
}

import { scoreEvidenceV5 } from '../score-v5.mjs';

async function score(task, context){
  const graph = context.graph || {nodes:[], edges:[]};
  const scored=[];
  
  for (const node of graph.nodes) {
    if (node.status === 'QURAN_EXPLICIT') {
      const s = scoreEvidenceV5({
        evidence: {sourceQuality:20, transmission:25, proximity:20, corroboration:20, interpretationGap:15},
        basis: {sourceQuality:['Divine Origin'], transmission:['Mutawatir'], proximity:['Direct Revelation'], corroboration:['Internal Consistency'], interpretationGap:['Clear text']}
      });
      scored.push({claim:node.text, text_reference:node.reference || node.id, status:'EVIDENCE_GROUNDED', score:s, review_required:false});
    }
    else if (node.status === 'UNRESOLVED' || node.status === 'TO_BE_VERIFIED' || node.status === 'PENDING') {
      const s = scoreEvidenceV5({
        evidence: {sourceQuality:12, transmission:15, proximity:10, corroboration:8, interpretationGap:8},
        basis: {sourceQuality:['Historical records'], transmission:['Manuscript chains'], proximity:['Centuries later'], corroboration:['Partial'], interpretationGap:['Translation loss']}
      });
      scored.push({claim:node.text, text_reference:node.reference || node.id, status:'PENDING_REVIEW', score:s, review_required:true});
    }
  }
  return { scores:scored, status:'READY' };
}

async function reviewGate(task, context){
  const pending = (context.scores||[]).filter(x=>x.review_required || x.status==='PENDING');
  return { pending_count:pending.length, gate:pending.length?'REVIEW_REQUIRED':'AUTO_CLEAR', status:'READY' };
}

async function generateReport(task, context){
  return {
    generated_at: now(),
    question: context.question,
    entities: context.entities || [],
    corpus: context.retrieval?.corpus || {},
    graph: context.graph || {},
    scores: context.scores || [],
    review: context.review || {},
    policy:'Autopilot never converts missing evidence to zero; unresolved or missing primary corpus remains pending.'
  };
}

const handlers = {
  parse_question: parseQuestion,
  resolve_entities: resolveEntities,
  retrieve_local_corpus: retrieveLocal,
  build_evidence_graph: buildGraph,
  score_evidence: score,
  check_review_gate: reviewGate,
  generate_report: generateReport
};

export async function runAutopilot({question, maxSteps=20, resume=true}={}) {
  let state = resume ? await readJson(STATE, null) : null;
  if (!state || state.question !== question) {
    state = { version:'6.0.0', question, started_at:now(), updated_at:now(), context:{}, tasks:buildTasks(question) };
    await writeJson(STATE, state);
  }
  let steps=0;
  while (steps<maxSteps) {
    const task = state.tasks.find(t=>t.status==='pending');
    if (!task) break;
    console.log(`[AUTOPILOT] Starting task: ${task.type} ...`);
    task.status='running'; task.started_at=now();
    try {
      const result = await handlers[task.type](task, state.context);
      task.output=result; task.status='done'; task.finished_at=now();
      console.log(`[AUTOPILOT] Task ${task.type} finished with status: ${result?.status || 'DONE'}`);
      if (task.type==='parse_question') state.context={...state.context, ...result};
      if (task.type==='resolve_entities') state.context.entities=result.entities;
      if (task.type==='retrieve_local_corpus') state.context.retrieval=result;
      if (task.type==='build_evidence_graph') state.context.graph=result;
      if (task.type==='score_evidence') state.context.scores=result.scores;
      if (task.type==='check_review_gate') state.context.review=result;
      if (task.type==='generate_report') state.context.report=result;
    } catch (err) {
      task.status='blocked'; task.error=String(err?.stack||err); task.finished_at=now();
      console.error(`[AUTOPILOT] Task ${task.type} FAILED:`, err);
    }
    state.updated_at=now();
    await writeJson(STATE,state);
    steps++;
  }
  if (state.context.report) await writeJson(REPORT,state.context.report);
  return {state, report:state.context.report||null, steps};
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const question = process.argv.includes('--question') ? process.argv[process.argv.indexOf('--question')+1] : 'Audit the identity of Isa/Jesus across available local scripture evidence.';
  const result = await runAutopilot({question, maxSteps:30, resume:true});
  console.log(JSON.stringify({status:'DONE', steps:result.steps, report:result.report, state:STATE, output:REPORT}, null, 2));
}
