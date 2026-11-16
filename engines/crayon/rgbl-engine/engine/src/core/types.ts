export type Domain = "allah" | "human" | "nature" | "justice" | "general";
export type RgblLevel = "R1" | "G2" | "B3" | "L4";
export type SourceType = "observation" | "measurement" | "document" | "testimony" | "reasoning" | "revelation" | "other";
export type ClaimType = "observation" | "measurement" | "source-statement" | "pattern" | "relation" | "model" | "causal-hypothesis" | "inference" | "interpretation" | "entity" | "agency" | "intention" | "impact" | "value" | "decision" | "caution" | "theological-claim";
export type EvidenceClass = "empirical" | "testimonial" | "documentary" | "philosophical" | "revelation" | "mixed" | "unspecified";
export type UnknownReason = "missing-evidence" | "conflicting-evidence" | "weak-source" | "ambiguous-definition" | "insufficient-sample" | "competing-explanation" | "out-of-scope";
export type TransitionStatus = "supported" | "partial" | "unsupported" | "pending";
export type DiagnosticSeverity = "info" | "warning" | "error";
export type FailureCode = "R_SOURCE_CONFUSION" | "R_MISSING_CONTEXT" | "G_WITHOUT_R" | "G_PATTERN_JUMP" | "G_CAUSAL_OVERREACH" | "B_WITHOUT_G" | "B_PROJECTION_RISK" | "B_IDENTITY_REDUCTION_RISK" | "L_WITHOUT_B" | "L_PREMATURE_CONCLUSION" | "L_FALSE_CERTAINTY" | "L_DISPROPORTIONATE_ACTION_RISK" | "UNSUPPORTED_TRANSITION" | "EVIDENCE_ERASURE" | "CONTRADICTION_SUPPRESSION" | "SOURCELESS_DERIVED_CLAIM" | "DUPLICATE_CLAIM_ID" | "THEOLOGY_PROVENANCE_BOUNDARY" | "LOW_CONFIDENCE_ACTION" | "LEVEL_BOUNDARY_MISMATCH";
export interface SourceRecord { id?: string; label:string; type:SourceType; reference?:string; note?:string; }
export interface StructuredClaim { id:string; text:string; level:RgblLevel; type:ClaimType; facet?:string; sourceRefs?:string[]; dependsOn?:string[]; confidence?:number; evidenceClass?:EvidenceClass; }
export interface ConflictInput { id?:string; description:string; claimIds?:string[]; sourceRefs?:string[]; resolution?:string; }
export interface ConflictRecord { id:string; description:string; claimIds:string[]; sourceRefs:string[]; status:"unresolved"|"resolved"; resolution?:string; }
export interface UnknownRecord { level:RgblLevel; reason:UnknownReason; message:string; required:string[]; }
export interface TransitionRecord { from:RgblLevel; to:RgblLevel|"R1'"; status:TransitionStatus; rule:string; justification:string[]; dependsOn:string[]; }
export interface LevelConfidence { R1:number; G2:number; B3:number; L4:number; }
export interface Diagnostic { code:FailureCode; level?:RgblLevel; severity:DiagnosticSeverity; message:string; rule:string; claimIds?:string[]; }
export interface RndAnalysis { modelVersion:"0.8"; claims:StructuredClaim[]; transitions:TransitionRecord[]; unknowns:UnknownRecord[]; conflicts:ConflictRecord[]; levelConfidence:LevelConfidence; diagnostics:Diagnostic[]; }
export interface CrayonInput { domain?:Domain; question:string; observations?:string[]; evidence?:string[]; assumptions?:string[]; patterns?:string[]; relations?:string[]; actors?:string[]; intentions?:string[]; impacts?:string[]; values?:string[]; interpretations?:string[]; problems?:string[]; risks?:string[]; possibilities?:string[]; benefits?:string[]; cautions?:string[]; nextActions?:string[]; sources?:SourceRecord[]; confidence?:number; structuredClaims?:StructuredClaim[]; conflicts?:ConflictInput[]; levelConfidence?:Partial<LevelConfidence>; }
export interface EpistemicYield { R1:{level:"Reality";yield:"Information";items:string[]}; G2:{level:"Governing Order";yield:"Knowledge";items:string[]}; B3:{level:"Being";yield:"Understanding / Meaning";items:string[]}; L4:{level:"Light";yield:"Wisdom / Responsible Direction";items:string[]}; }
export interface QualityCheck { evidenceStatus:"supported"|"partial"|"missing"; alternatives:string[]; assumptions:string[]; reasoningTrace:string[]; confidence:number; confidenceLabel:"low"|"medium"|"high"; cautions:string[]; }
export interface SinCanResult {sin:string[];understand:string[];can:string[];act:string[];learn:string[];returnToReality:string[];}
export interface Completeness {filledLevels:number;totalLevels:4;ratio:number;missingLevels:RgblLevel[];}
export interface ResearchStatus { researchStackVersion:"7.0"; releaseStatus:"stable-research-specification"; validationStatus:"empirical-validation-pending"|"partially-evaluated"|"externally-validated"; formalizationBase:"0.8"; canonicalLevels:4; }
export interface CrayonResult {engineVersion:string;schemaVersion:string;domain:Domain;world:string;question:string;gate:readonly string[];way:readonly string[];epistemicYield:EpistemicYield;completeness:Completeness;qualityCheck:QualityCheck;sinCan:SinCanResult;benefit:string[];caution:string[];next:string[];sources:SourceRecord[];rnd:RndAnalysis;researchStatus:ResearchStatus;}
