import type { Dataset, Evidence } from "../types.js";
export function evidenceScore(data:Dataset, e:Evidence):number { return data.evidence_scale[e]?.score ?? 0; }
export function isQuranEvidence(e:Evidence):boolean { return e.startsWith("Q"); }
export function isSupplementEvidence(e:Evidence):boolean { return e.startsWith("S"); }
export function strongest(data:Dataset, levels:Evidence[]):Evidence { return [...levels].sort((a,b)=>evidenceScore(data,b)-evidenceScore(data,a))[0] ?? "E0"; }
