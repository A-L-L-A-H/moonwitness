import fs from 'node:fs/promises';
import path from 'node:path';
import {loadQuran,verifyQuran} from './quran.mjs'; 
import {claims} from './claims.mjs'; 
import {manuscripts} from './manuscripts.mjs';
import { buildEvidenceGraph } from './evidence-graph.mjs';
import { scoreEvidenceV5 } from './score-v5.mjs';

async function hasFiles(root, id) {
  try {
    const files = await fs.readdir(path.join(root, 'data', 'corpora', id, 'raw'));
    return files.length > 0;
  } catch {
    return false;
  }
}

export async function buildReport(root){
  const q=await loadQuran(root);
  const v=verifyQuran(q);
  const h = await hasFiles(root, 'hadith');
  const t = await hasFiles(root, 'torah');
  const p = await hasFiles(root, 'psalms');
  const g = await hasFiles(root, 'gospels');

  const pending = [];
  if (!h) pending.push('Full hadith corpus');
  if (!t) pending.push('Primary Torah corpus');
  if (!p) pending.push('Primary Psalms corpus');
  if (!g) pending.push('Primary Gospel corpus');

  const graphData = buildEvidenceGraph(path.join(root,'data','claims','claims.json'));
  let graphPayload = { nodes: graphData.node_count || 0, edges: graphData.edge_count || 0 };
  let scorecardPayload = scoreEvidenceV5({evidence:{sourceQuality:18,transmission:20,proximity:16,corroboration:14,interpretationGap:12},basis:{sourceQuality:['source'],transmission:['manuscript'],proximity:['date'],corroboration:['independent'],interpretationGap:['analysis']}});
  let autopilotReport = null;

  try {
    const autoStr = await fs.readFile(path.join(root, 'outputs', 'AUTOPILOT_REPORT.json'), 'utf8');
    autopilotReport = JSON.parse(autoStr);
    
    if (autopilotReport.graph) {
      graphPayload = {
        nodes: Array.isArray(autopilotReport.graph.nodes) ? autopilotReport.graph.nodes.length : (autopilotReport.graph.nodes || graphPayload.nodes),
        edges: Array.isArray(autopilotReport.graph.edges) ? autopilotReport.graph.edges.length : (autopilotReport.graph.edges || graphPayload.edges),
        nodeList: Array.isArray(autopilotReport.graph.nodes) ? autopilotReport.graph.nodes : [],
        edgeList: Array.isArray(autopilotReport.graph.edges) ? autopilotReport.graph.edges : []
      };
    }
    if (autopilotReport.scores || autopilotReport.review) {
      scorecardPayload = {
        status: autopilotReport.review?.status || 'PENDING',
        scores: autopilotReport.scores || [],
        reviewGate: autopilotReport.review || {}
      };
    }
  } catch (err) {
    // Ignore if autopilot hasn't been run yet
  }

  return{
    version:'4.0.0',
    corpus:[
      {name:'quran',status:'NORMALIZED_LOCAL_WITNESS',records:v.records,path:'data/corpora/quran/quran_normalized.jsonl'},
      {name:'hadith',status: h ? 'READY' : 'PENDING_EXTERNAL_FILE'},
      {name:'torah',status: t ? 'READY' : 'EXTERNAL_REGISTER_ONLY'},
      {name:'psalms',status: p ? 'READY' : 'EXTERNAL_REGISTER_ONLY'},
      {name:'gospels',status: g ? 'READY' : 'EXTERNAL_REGISTER_ONLY'}
    ],
    corpusStatus: {
      quran: 'LOCAL',
      hadith: h ? 'LOCAL' : 'PENDING',
      torah: t ? 'LOCAL' : 'PENDING',
      psalms: p ? 'LOCAL' : 'PENDING',
      gospels: g ? 'LOCAL' : 'PENDING'
    },
    graph: graphPayload,
    scorecard: scorecardPayload,
    claims:claims.length,
    manuscripts:manuscripts.length,
    pending,
    autopilot: autopilotReport,
    generatedAt:new Date().toISOString()
  };
}
