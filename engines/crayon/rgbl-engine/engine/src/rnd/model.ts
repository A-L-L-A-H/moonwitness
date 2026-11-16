import type {ClaimType, ConflictRecord, CrayonInput, Diagnostic, EvidenceClass, FailureCode, LevelConfidence, RgblLevel, RndAnalysis, StructuredClaim, TransitionRecord, UnknownReason, UnknownRecord} from "../core/types.js";

export const RGBL_FACETS = {
  R1: ["observation", "measurement", "source", "context", "unknown"],
  G2: ["pattern", "relation", "comparison", "rule", "mechanism", "model", "causal-hypothesis"],
  B3: ["entity", "state", "agency", "intention", "dependency", "relationship", "experience", "impact", "value", "responsibility", "meaning"],
  L4: ["lesson", "option", "trade-off", "benefit", "risk", "limitation", "decision", "action", "next-question"],
} as const;

export const CLAIM_LEVEL_ADMISSIBILITY: Record<ClaimType, readonly RgblLevel[]> = {
  observation: ["R1"], measurement: ["R1"], "source-statement": ["R1"],
  pattern: ["G2"], relation: ["G2"], model: ["G2"], "causal-hypothesis": ["G2"], inference: ["G2", "B3"],
  interpretation: ["B3"], entity: ["B3"], agency: ["B3"], intention: ["B3"], impact: ["B3"], value: ["B3", "L4"],
  decision: ["L4"], caution: ["L4"], "theological-claim": ["B3", "L4"],
};

export function isClaimAdmissibleAtLevel(type: ClaimType, level: RgblLevel): boolean {
  return CLAIM_LEVEL_ADMISSIBILITY[type].includes(level);
}

export const TRANSITION_RULES = {
  "R1->G2": "A G2 claim must identify R1 information that supports the proposed pattern, relation, rule, mechanism, or model.",
  "G2->B3": "A B3 claim must preserve R1 and identify how a supported G2 pattern bears on beings, agency, relation, impact, value, or meaning.",
  "B3->L4": "An L4 direction must integrate R1, G2, and B3, expose limitations, and remain proportionate to current support.",
  "L4->R1'": "Action creates a new state to observe; feedback is pending until new Reality is recorded.",
} as const;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const ids = (claims: StructuredClaim[], level: RgblLevel) => claims.filter((claim) => claim.level === level).map((claim) => claim.id);

function makeClaims(input: CrayonInput): StructuredClaim[] {
  const claims: StructuredClaim[] = [];
  const add = (level: RgblLevel, type: ClaimType, prefix: string, values: string[] | undefined, evidenceClass: EvidenceClass, dependsOn: string[] = []) => {
    for (const [index, text] of (values ?? []).entries()) claims.push({id:`${prefix}:${index + 1}`,text,level,type,evidenceClass,...(dependsOn.length ? {dependsOn} : {})});
  };
  add("R1", "observation", "r1-observation", input.observations, "empirical");
  add("R1", "source-statement", "r1-evidence", input.evidence, "mixed");
  const r1 = ids(claims, "R1");
  add("G2", "pattern", "g2-pattern", input.patterns, "empirical", r1);
  add("G2", "relation", "g2-relation", input.relations, "mixed", r1);
  const g2 = ids(claims, "G2");
  const bDeps = g2.length ? g2 : r1;
  add("B3", "entity", "b3-entity", input.actors, "unspecified", bDeps);
  add("B3", "intention", "b3-intention", input.intentions, "testimonial", bDeps);
  add("B3", "impact", "b3-impact", input.impacts, "mixed", bDeps);
  add("B3", "value", "b3-value", input.values, "philosophical", bDeps);
  add("B3", "interpretation", "b3-interpretation", input.interpretations, "philosophical", bDeps);
  const b3 = ids(claims, "B3");
  const lDeps = b3.length ? b3 : (g2.length ? g2 : r1);
  add("L4", "decision", "l4-action", input.nextActions, "mixed", lDeps);
  add("L4", "caution", "l4-caution", input.cautions, "mixed", lDeps);
  add("L4", "value", "l4-benefit", input.benefits, "mixed", lDeps);
  return [...claims, ...(input.structuredClaims ?? [])];
}

function conflictsOf(input: CrayonInput): ConflictRecord[] {
  return (input.conflicts ?? []).map((item, index) => ({id:item.id ?? `conflict:${index + 1}`,description:item.description,claimIds:item.claimIds ?? [],sourceRefs:item.sourceRefs ?? [],status:item.resolution ? "resolved" : "unresolved",...(item.resolution ? {resolution:item.resolution} : {})}));
}

function unknownReason(level: RgblLevel, input: CrayonInput, conflicts: ConflictRecord[], r1Count: number): UnknownReason {
  if (conflicts.some((conflict) => conflict.status === "unresolved")) return "conflicting-evidence";
  if (level === "G2" && r1Count > 0 && r1Count < 2) return "insufficient-sample";
  if (level === "L4" && (input.interpretations?.length ?? 0) > 1) return "competing-explanation";
  return "missing-evidence";
}

function unknownsOf(input: CrayonInput, claims: StructuredClaim[], conflicts: ConflictRecord[]): UnknownRecord[] {
  const r1Count = ids(claims, "R1").length;
  const requirement: Record<RgblLevel,string> = {R1:"observable facts, measurements, or explicit sources",G2:"supported patterns, relations, mechanisms, or models",B3:"being, agency, relation, impact, value, or meaning",L4:"a proportionate lesson, caution, decision, or responsible action"};
  return (["R1","G2","B3","L4"] as RgblLevel[]).filter((level) => ids(claims, level).length === 0).map((level) => ({level,reason:unknownReason(level,input,conflicts,r1Count),message:`${level} remains UNKNOWN because current support does not establish ${requirement[level]}.`,required:[requirement[level]]}));
}

function confidenceOf(input: CrayonInput, claims: StructuredClaim[]): LevelConfidence {
  const count = (level: RgblLevel) => ids(claims, level).length;
  const sources = input.sources?.length ?? 0;
  const computedR = count("R1") === 0 ? 0 : clamp01(0.3 + Math.min(0.45, count("R1") * 0.15) + Math.min(0.25, sources * 0.08));
  const computedG = count("G2") === 0 ? 0 : clamp01((computedR * 0.7) + Math.min(0.3, count("G2") * 0.12));
  const computedB = count("B3") === 0 ? 0 : clamp01(((computedR + computedG) / 2) * 0.75 + Math.min(0.25, count("B3") * 0.06));
  const computedL = count("L4") === 0 ? 0 : clamp01(((computedR + computedG + computedB) / 3) * 0.8 + Math.min(0.2, count("L4") * 0.06));
  return {R1:input.levelConfidence?.R1 ?? computedR,G2:input.levelConfidence?.G2 ?? computedG,B3:input.levelConfidence?.B3 ?? computedB,L4:input.levelConfidence?.L4 ?? computedL};
}

const isTraced = (claim: StructuredClaim) => claim.level === "R1" || Boolean(claim.dependsOn?.length || claim.sourceRefs?.length);

function transitionsOf(claims: StructuredClaim[], input: CrayonInput): TransitionRecord[] {
  const r1Claims = claims.filter((claim) => claim.level === "R1");
  const g2Claims = claims.filter((claim) => claim.level === "G2");
  const b3Claims = claims.filter((claim) => claim.level === "B3");
  const l4Claims = claims.filter((claim) => claim.level === "L4");
  const r1 = r1Claims.map((claim) => claim.id); const g2 = g2Claims.map((claim) => claim.id); const b3 = b3Claims.map((claim) => claim.id); const l4 = l4Claims.map((claim) => claim.id);
  const records: TransitionRecord[] = [];
  if (g2.length) records.push({from:"R1",to:"G2",status:!r1.length ? "unsupported" : g2Claims.every(isTraced) ? "supported" : "partial",rule:TRANSITION_RULES["R1->G2"],justification:r1.length ? [`${r1.length} R1 claim(s) available as support.`] : ["No R1 support recorded."],dependsOn:r1});
  if (b3.length) records.push({from:"G2",to:"B3",status:!r1.length ? "unsupported" : g2.length && b3Claims.every(isTraced) ? "supported" : "partial",rule:TRANSITION_RULES["G2->B3"],justification:g2.length ? [`${g2.length} G2 claim(s) connect information to being/meaning.`] : ["No explicit G2 bridge recorded."],dependsOn:g2.length ? g2 : r1});
  if (l4.length) records.push({from:"B3",to:"L4",status:!r1.length ? "unsupported" : b3.length && g2.length && l4Claims.every(isTraced) ? "supported" : "partial",rule:TRANSITION_RULES["B3->L4"],justification:b3.length ? [`${b3.length} B3 claim(s) provide meaning/impact context.`] : ["No explicit B3 meaning/impact bridge recorded."],dependsOn:b3.length ? b3 : (g2.length ? g2 : r1)});
  if ((input.nextActions?.length ?? 0) > 0) records.push({from:"L4",to:"R1'",status:"pending",rule:TRANSITION_RULES["L4->R1'"],justification:["The action must be observed after execution before the feedback transition can be considered supported."],dependsOn:l4});
  return records;
}

function diagnostic(code: FailureCode, severity: Diagnostic["severity"], message: string, rule: string, level?: RgblLevel, claimIds?: string[]): Diagnostic {
  return {code,severity,message,rule,...(level ? {level} : {}),...(claimIds?.length ? {claimIds} : {})};
}

function diagnosticsOf(input: CrayonInput, claims: StructuredClaim[], conflicts: ConflictRecord[], confidence: LevelConfidence): Diagnostic[] {
  const result: Diagnostic[] = [];
  const r1=ids(claims,"R1"), g2=ids(claims,"G2"), b3=ids(claims,"B3"), l4=ids(claims,"L4");
  if (g2.length && !r1.length) result.push(diagnostic("G_WITHOUT_R","error","G2 claims exist without recorded R1 support.",TRANSITION_RULES["R1->G2"],"G2",g2));
  if ((input.patterns?.length ?? 0) > 0 && r1.length < 2) result.push(diagnostic("G_PATTERN_JUMP","warning","A pattern is proposed from fewer than two R1 information claims; treat it as provisional.","Patterns require repeated/comparative support appropriate to the domain.","G2",g2));
  if (b3.length && !g2.length) result.push(diagnostic("B_WITHOUT_G","warning","B3 meaning/agency claims have no explicit G2 bridge.",TRANSITION_RULES["G2->B3"],"B3",b3));
  if (l4.length && !b3.length) result.push(diagnostic("L_PREMATURE_CONCLUSION","warning","L4 direction appears before B3 meaning/impact is established.",TRANSITION_RULES["B3->L4"],"L4",l4));
  if (conflicts.some((conflict) => conflict.status === "unresolved") && l4.length) result.push(diagnostic("CONTRADICTION_SUPPRESSION","warning","An L4 direction exists while conflicting evidence remains unresolved.","Preserve conflict and lower conclusion strength until discriminating evidence resolves it.","L4",l4));
  if (confidence.L4 < 0.45 && (input.nextActions?.length ?? 0) > 0) result.push(diagnostic("LOW_CONFIDENCE_ACTION","warning","A next action is proposed while L4 confidence is low.","Low-confidence action should be reversible, proportionate, or primarily information-gathering.","L4",l4));
  const seen = new Set<string>();
  for (const claim of claims) {
    if (seen.has(claim.id)) result.push(diagnostic("DUPLICATE_CLAIM_ID","error",`Duplicate claim id: ${claim.id}.`,"Claim IDs must be unique for provenance to be auditable.",claim.level,[claim.id]));
    seen.add(claim.id);
    if (!isClaimAdmissibleAtLevel(claim.type, claim.level)) {
      result.push(diagnostic("LEVEL_BOUNDARY_MISMATCH","warning",`Claim ${claim.id} has type ${claim.type} at ${claim.level}, outside the default admissibility boundary.`,`Reclassify the claim or document a domain-specific exception.`,claim.level,[claim.id]));
      if (claim.level === "R1") result.push(diagnostic("R_SOURCE_CONFUSION","warning",`R1 claim ${claim.id} is typed as ${claim.type}, which risks mixing interpretation with observation/source information.`,`R1 should keep observation/source records distinct from interpretation.`,"R1",[claim.id]));
    }
    if (claim.type === "causal-hypothesis" && (r1.length < 2 || (!(claim.dependsOn?.length) && !(claim.sourceRefs?.length)))) result.push(diagnostic("G_CAUSAL_OVERREACH","warning",`Causal claim ${claim.id} has sparse or untraced support.`,`Causal language requires domain-appropriate discriminating evidence; association or sequence alone is insufficient.`,claim.level,[claim.id]));
    if (claim.type === "intention" && claim.evidenceClass !== "testimonial" && claim.evidenceClass !== "mixed" && !(claim.sourceRefs?.length)) result.push(diagnostic("B_PROJECTION_RISK","warning",`Intention claim ${claim.id} lacks testimonial/mixed provenance.`,`Do not infer internal intention from external behavior alone without appropriate evidence.`,claim.level,[claim.id]));
    if (claim.level === "L4" && claim.confidence !== undefined && claim.confidence > confidence.L4 + 0.25) result.push(diagnostic("L_FALSE_CERTAINTY","warning",`Claim ${claim.id} confidence materially exceeds current L4 support.`,`Claim confidence should not outrun the support of the integrated L4 record.`,"L4",[claim.id]));
    if (claim.level !== "R1" && !(claim.dependsOn?.length) && !(claim.sourceRefs?.length)) result.push(diagnostic("SOURCELESS_DERIVED_CLAIM","warning",`Derived claim ${claim.id} has no dependency or source reference.`,`Derived claims should identify provenance or remain explicitly unsupported.`,claim.level,[claim.id]));
    if (input.domain === "allah" && claim.type === "theological-claim" && claim.evidenceClass !== "revelation" && claim.evidenceClass !== "mixed") result.push(diagnostic("THEOLOGY_PROVENANCE_BOUNDARY","warning",`Theological claim ${claim.id} is not marked as revelation or mixed provenance.`,`Keep observable signs, philosophical inference, and revelation-based theological claims distinct.`,claim.level,[claim.id]));
  }
  return result;
}

export function buildRndAnalysis(input: CrayonInput): RndAnalysis {
  const claims = makeClaims(input);
  const conflicts = conflictsOf(input);
  const levelConfidence = confidenceOf(input, claims);
  return {modelVersion:"0.8",claims,transitions:transitionsOf(claims,input),unknowns:unknownsOf(input,claims,conflicts),conflicts,levelConfidence,diagnostics:diagnosticsOf(input,claims,conflicts,levelConfidence)};
}
