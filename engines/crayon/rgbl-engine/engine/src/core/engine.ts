import type {Completeness, CrayonInput, CrayonResult, Domain, EpistemicYield} from "./types.js";
import {NINE_GATE} from "../gate/nine-gate.js";
import {THIRTEEN_WAY} from "../way/thirteen-way.js";
import {buildEpistemicYield} from "../rgbl/rgbl.js";
import {runQualityCheck} from "../quality/quality-check.js";
import {buildSinCan} from "../sin-can/sin-can.js";
import {DOMAIN_PROFILES} from "../domains/index.js";
import {validateCrayonInput} from "./validate.js";
import {ENGINE_VERSION, RESULT_SCHEMA_VERSION} from "../version.js";
import {buildRndAnalysis} from "../rnd/model.js";
import {ENGINE_RESEARCH_STATUS} from "../research/governance.js";
export interface CrayonEngine {analyze(input:CrayonInput):CrayonResult;analyzeMany(inputs:CrayonInput[]):CrayonResult[];}
const isUnknown=(items:string[])=>items.length===0||items.every(item=>item.startsWith("UNKNOWN"));
function completenessOf(yieldMap:EpistemicYield):Completeness{const entries=[["R1",yieldMap.R1.items],["G2",yieldMap.G2.items],["B3",yieldMap.B3.items],["L4",yieldMap.L4.items]] as const;const missingLevels=entries.filter(([,items])=>isUnknown(items)).map(([level])=>level);const filledLevels=4-missingLevels.length;return{filledLevels,totalLevels:4,ratio:filledLevels/4,missingLevels};}
export function createCrayonEngine():CrayonEngine{const analyze=(input:CrayonInput):CrayonResult=>{validateCrayonInput(input);const domain:Domain=input.domain??"general";const profile=DOMAIN_PROFILES[domain];const epistemicYield=buildEpistemicYield(input);const qualityCheck=runQualityCheck(input,epistemicYield);const sinCan=buildSinCan(input);const rnd=buildRndAnalysis(input);return{engineVersion:ENGINE_VERSION,schemaVersion:RESULT_SCHEMA_VERSION,domain,world:profile.world,question:input.question.trim(),gate:NINE_GATE,way:THIRTEEN_WAY,epistemicYield,completeness:completenessOf(epistemicYield),qualityCheck:{...qualityCheck,cautions:[profile.boundary,...qualityCheck.cautions]},sinCan,benefit:input.benefits?.length?input.benefits:["UNKNOWN — state what becomes clearer, safer, more useful, or more responsible"],caution:[profile.boundary,...(input.cautions??[])],next:input.nextActions?.length?input.nextActions:["Collect the missing evidence or information, then repeat the loop."],sources:input.sources??[],rnd,researchStatus:ENGINE_RESEARCH_STATUS};};return{analyze,analyzeMany:(inputs)=>inputs.map(analyze)};}
