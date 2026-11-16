import type {ClaimType, Domain, EvidenceClass, RgblLevel} from "../core/types.js";

export type DatasetSplit = "development" | "validation" | "holdout" | "adversarial";
export type ConsentStatus = "not-required" | "obtained" | "withdrawn" | "unknown";
export type Sensitivity = "public" | "internal" | "personal" | "sensitive";
export interface StudyCase {id:string;domain:Domain;question:string;split:DatasetSplit;synthetic:boolean;contentHash:string;consentStatus?:ConsentStatus;sensitivity?:Sensitivity;sourceDescription?:string;}
export interface AnnotationLabel {claimId:string;level:RgblLevel;claimType?:ClaimType;confidence?:number;}
export interface AnnotationRecord {caseId:string;analystId:string;runId:string;blinded:boolean;labels:AnnotationLabel[];notes?:string[];}
export interface AgreementReport {n:number;rawAgreement:number;cohenKappa:number;confusion:Record<RgblLevel,Record<RgblLevel,number>>;perLevel:Record<RgblLevel,{precision:number;recall:number;f1:number;support:number}>;}
export type HypothesisStatus = "open" | "favored" | "disfavored" | "unresolved";
export interface HypothesisRecord {id:string;statement:string;supportingClaimIds:string[];opposingClaimIds:string[];discriminatingEvidenceNeeded:string[];status:HypothesisStatus;}
export type TriState = true | false | "unknown";
export interface CausalChecklist {temporalOrder:TriState;mechanism:TriState;confoundingAddressed:TriState;alternativesCompared:boolean;interventionEvidence:TriState;}
export interface CausalAssessment {score:number;max:5;status:"unsupported"|"provisional"|"supported";missing:string[];}
export interface CounterfactualRecord {statement:string;assumptionIds:string[];confidence:number;testableBy?:string[];}
export type Reversibility = "reversible" | "partially-reversible" | "irreversible";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export interface TemporalState {id:string;timeIndex:number;realityClaimIds:string[];note?:string;}
export interface ActionPlan {id:string;description:string;reversibility:Reversibility;risk:RiskLevel;expectedOutcome:string;observationWindow:string;}
export interface ConsequenceRecord {actionId:string;newStateId:string;observedOutcomes:string[];review:"confirmed"|"revised"|"reversed"|"unresolved";}
export type SourceRole = "primary" | "supporting" | "context" | "normative" | "theological";
export interface EpistemicRule {evidenceClass:EvidenceClass;levels:RgblLevel[];claimTypes?:ClaimType[];role:SourceRole;note:string;}
export interface DomainEpistemologyProfile {domain:Domain;rules:EpistemicRule[];exclusions:string[];}
export interface AdmissibilityResult {allowed:boolean;role?:SourceRole;reason:string;}
export interface UncertaintyVector {epistemic:number;variability:number;source:number;model:number;normative:number;}
export interface CalibrationPoint {confidence:number;outcome:0|1;}
export interface CalibrationBin {from:number;to:number;n:number;meanConfidence:number;empiricalRate:number;gap:number;}
export interface CalibrationReport {n:number;brier:number;ece:number;bins:CalibrationBin[];}
export interface DecisionContext {risk:RiskLevel;reversibility:Reversibility;}
export interface DecisionGate {requiredConfidence:number;decision:"proceed"|"reversible-test"|"gather-information"|"stop";reason:string;}
export type ExperimentArm = "free-reasoning" | "checklist" | "rgbl";
export type AdversarialFamily = "emotional-framing"|"authority-bias"|"missing-context"|"contradictory-evidence"|"causal-bait"|"premature-urgency"|"identity-projection";
export interface BenchmarkCaseDescriptor {id:string;split:DatasetSplit;contentHash:string;synthetic:boolean;adversarialFamily?:AdversarialFamily;}
export interface ComparativeScore {unsupportedClaimRate:number;provenanceCoverage:number;unknownHonesty:number;transitionQuality:number;decisionProportionality:number;calibration:number;}
export interface ArmEvaluation {caseId:string;arm:ExperimentArm;score:ComparativeScore;}
export interface ArmSummary {arm:ExperimentArm;n:number;mean:ComparativeScore;}
export type ValidationStatus = "empirical-validation-pending" | "partially-evaluated" | "externally-validated";
export interface ResearchVersionRecord {version:string;capability:string;implementationStatus:"implemented"|"empirical-gate";}
export interface V7ReleaseMetadata {name:"RGBL v7.0 — Stable Research Specification & Engine";engineVersion:"7.0.0";researchStackVersion:"7.0";releaseStatus:"stable-research-specification";validationStatus:ValidationStatus;formalizationBase:"0.8";canonicalYields:readonly ["Information","Knowledge","Understanding / Meaning","Wisdom / Responsible Direction"];}
export interface MaturityAudit {passed:boolean;implemented:string[];empiricalGates:string[];violations:string[];}
