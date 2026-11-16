import fs from "node:fs";
import { loadDataset } from "./lib/load.js";
import { loadConflicts, loadCorpusRegistry, loadDocumentationRegistry, loadGenealogy, loadPreferenceDataset, loadTimeline } from "./lib/load-v2.js";
import { validateDataset } from "./engine/validate.js";
import { validateV2 } from "./engine/validate-v2.js";
import { auditDataset } from "./engine/audit.js";
import { auditProfiles } from "./engine/profile-audit.js";
import { matchAllProphets, matchAsmaForProphet } from "./engine/semantic.js";
import { evaluateCalibration, scoreAllProfiles, scoreAllRelations, scoreProphetRelations } from "./engine/scoring.js";
import { dataConfidenceLeaderboard, traitEvidenceLeaderboard, worldTraitLeaderboard } from "./engine/leaderboard.js";
import { contextLeaderboard } from "./engine/context-scoring.js";
import { buildProvenanceIndex, claimsForProphet } from "./engine/provenance.js";
import { buildEventGraph, relationsForProphet } from "./engine/timeline.js";
import { uncertaintyForProphet } from "./engine/uncertainty.js";
import { preferenceReport } from "./engine/preference.js";
const cmd=process.argv[2]??"validate",data=loadDataset(),corpus=loadCorpusRegistry(),docs=loadDocumentationRegistry(),genealogy=loadGenealogy(),timeline=loadTimeline(),conflicts=loadConflicts(),pd=loadPreferenceDataset(),prov=buildProvenanceIndex(data),events=buildEventGraph(data,timeline),pref=preferenceReport(pd);
if(cmd==="validate"){const a=validateDataset(data),b=validateV2(data,corpus,genealogy,timeline,conflicts,pd);console.log(JSON.stringify({ok:a.ok&&b.ok,legacy:a,v2:b},null,2));process.exitCode=a.ok&&b.ok?0:1}
else if(cmd==="audit")console.log(JSON.stringify(auditDataset(data),null,2));
else if(cmd==="audit-profiles")console.log(JSON.stringify(auditProfiles(data),null,2));
else if(cmd==="match"){const id=process.argv[3];console.log(JSON.stringify(id&&data.prophets[id]?matchAsmaForProphet(data,data.prophets[id]!):matchAllProphets(data),null,2))}
else if(cmd==="score"){const id=process.argv[3];console.log(JSON.stringify(id?scoreProphetRelations(data,id):[],null,2))}
else if(cmd==="score-profiles")console.log(JSON.stringify(scoreAllProfiles(data),null,2));
else if(cmd==="score-report")console.log(JSON.stringify({relations:scoreAllRelations(data),profiles:scoreAllProfiles(data)},null,2));
else if(cmd==="leaderboard")console.log(JSON.stringify({trait_evidence:traitEvidenceLeaderboard(data),data_confidence:dataConfidenceLeaderboard(data)},null,2));
else if(cmd==="world-leaderboard")console.log(JSON.stringify(worldTraitLeaderboard(data),null,2));
else if(cmd==="context-leaderboard")console.log(JSON.stringify(contextLeaderboard(data),null,2));
else if(cmd==="calibrate"){const f=process.argv[3];console.log(JSON.stringify(f?evaluateCalibration(JSON.parse(fs.readFileSync(f,"utf8"))):{error:"file required"},null,2))}
else if(cmd==="provenance"){const id=process.argv[3];console.log(JSON.stringify(id?claimsForProphet(prov,id):prov,null,2))}
else if(cmd==="timeline"){const id=process.argv[3];console.log(JSON.stringify(id?{era:timeline.eras[id]??null,events:events.filter(e=>e.prophet_id===id),relations:relationsForProphet(genealogy,id)}:{timeline,events,genealogy},null,2))}
else if(cmd==="uncertainty"){const id=process.argv[3];console.log(JSON.stringify(id?uncertaintyForProphet(data,id,claimsForProphet(prov,id),conflicts):data.prophet_order.map(x=>uncertaintyForProphet(data,x,claimsForProphet(prov,x),conflicts)).filter(Boolean),null,2))}
else if(cmd==="preference")console.log(JSON.stringify(pref,null,2));
else if(cmd==="docs")console.log(JSON.stringify(docs,null,2));
else if(cmd==="v2-report"||cmd==="report"){const a=validateDataset(data),b=validateV2(data,corpus,genealogy,timeline,conflicts,pd),pa=auditProfiles(data),ps=scoreAllProfiles(data);console.log(JSON.stringify({model:data.model,release_version:data.runtime?.version??"2.1.0",schema_version:data.schema_version,validation_ok:a.ok&&b.ok,...a.counts,...b.counts,profile_pass:pa.filter(x=>x.result==="PASS").length,profile_review:pa.filter(x=>x.result==="PASS_WITH_REVIEW").length,profile_fail:pa.filter(x=>x.result==="FAIL").length,mean_data_confidence:Number((ps.reduce((s,x)=>s+x.data_confidence_score,0)/Math.max(ps.length,1)).toFixed(2)),preference_status:pref.status,documentation_status:docs.status,documentation_files:docs.documents.length},null,2));process.exitCode=a.ok&&b.ok?0:1}
else{console.error(`Unknown command: ${cmd}`);process.exitCode=2}
