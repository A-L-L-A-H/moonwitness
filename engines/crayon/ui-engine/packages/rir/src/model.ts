import type { EpistemicState, OutcomeStatus } from "allah-crayon-kernel";

export type RIRKind = "field" | "mark" | "line" | "region" | "path" | "anchor" | "portal" | "layer";
export type RIRTemporalPhase = "prediction" | "observation" | "reconciliation" | "witness";
export interface RIRMetric { score: number; explanation: string[]; }
export interface RIRPhysics { gravity?: RIRMetric; distance?: RIRMetric; depth?: RIRMetric; trace?: RIRMetric; disclosure?: RIRMetric; continuity?: RIRMetric; momentum?: RIRMetric; }
export interface RIRTemporal { phase: RIRTemporalPhase; at: string; witnessId?: string; status?: OutcomeStatus; sourceIds?: string[]; evidenceIds?: string[]; }
interface RIRBase { id: string; kind: RIRKind; semanticRef?: string; salience?: number; physics?: RIRPhysics; temporal?: RIRTemporal; }
export interface RIRField extends RIRBase { kind: "field"; children: string[]; }
export interface RIRMark extends RIRBase { kind: "mark"; role: "knowledge" | "state" | "effect" | "future" | "prediction" | "observation" | "reconciliation" | "witness" | "retry"; label: string; value?: unknown; epistemic?: EpistemicState; }
export interface RIRLine extends RIRBase { kind: "line"; from: string; to: string; relation?: string; strength?: number; }
export interface RIRRegion extends RIRBase { kind: "region"; purpose: "context" | "consequence" | "evidence" | "history"; label: string; members: string[]; }
export interface RIRPath extends RIRBase {
  kind: "path"; from: string; to: string; intent: string; possibilityId: string;
  availability: "available" | "unavailable" | "unknown";
  resistance: { score: number; mode: string };
  consequenceMarks: string[];
  requirements?: { constraintIds: string[]; authorityCapabilities: string[] };
}
export interface RIRAnchor extends RIRBase { kind: "anchor"; subjectId: string; label: string; entityType?: string; }
export interface RIRPortal extends RIRBase { kind: "portal"; targetSubjectId: string; label: string; relation?: string; }
export interface RIRLayer extends RIRBase { kind: "layer"; depth: number; purpose: "present" | "possible-future" | "context" | "history"; members: string[]; }
export type RIRNode = RIRField | RIRMark | RIRLine | RIRRegion | RIRPath | RIRAnchor | RIRPortal | RIRLayer;
export interface RIRDocument { version: "0"; situationId: string; root: string; nodes: RIRNode[]; explanation: string[]; }
