import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {scoreEvidenceV5} from '../src/score-v5.mjs';
import {buildGraph} from '../src/evidence-graph-v5.mjs';
import {buildResearchPlan} from '../src/research-agent.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('score requires basis',()=>{const r=scoreEvidenceV5({evidence:{sourceQuality:10,transmission:10,proximity:10,corroboration:10,interpretationGap:10},basis:{}});assert.equal(r.status,'PENDING');});
test('score works with complete basis',()=>{const r=scoreEvidenceV5({evidence:{sourceQuality:20,transmission:20,proximity:20,corroboration:20,interpretationGap:15},basis:{sourceQuality:['a'],transmission:['b'],proximity:['c'],corroboration:['d'],interpretationGap:['e']}});assert.equal(r.total,95);});
test('graph has explicit relations',()=>{const g=buildGraph(`${root}/data/claims/claims.json`,`${root}/data/graph/edges.json`);assert.ok(g.edge_count>0);});
test('research plan is deterministic',()=>{const p=buildResearchPlan('isa');assert.equal(p.topic,'isa');assert.ok(p.steps.length>=5);});
test('ai provider is optional and general',()=>{const cfg=JSON.parse(fs.readFileSync(`${root}/data/ai/provider.json`));assert.equal(cfg.mode,'cloud-optional-local-first');});
