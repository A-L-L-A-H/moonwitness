import type { Situation } from "allah-crayon-kernel";
import type { RIRDocument, RIRNode, RIRPhysics } from "allah-crayon-rir";
import type { SemanticSnapshot, SnapshotKnowledgeItem, SnapshotPossibilityItem, SnapshotTemporalRecord } from "allah-crayon-snapshot";

export interface InspectorRedaction {
  redacted: true;
  meaning: "withheld-not-unknown";
  reason: string;
  classification?: string;
}
export interface InspectorKnowledge {
  key: string;
  epistemic: SnapshotKnowledgeItem["epistemic"];
  certainty?: number;
  bucket: "known" | "uncertain" | "conflicted" | "unknown";
  visibility: "visible" | "redacted";
  redaction?: InspectorRedaction;
}
export interface InspectorPossibility {
  id: string;
  verb: string;
  status: SnapshotPossibilityItem["status"];
  resistance: SnapshotPossibilityItem["resistance"];
  reasons: SnapshotPossibilityItem["reasons"];
}
export interface InspectorTemporalRecord {
  id: string;
  transitionId: string;
  witnessId: string;
  witnessStatus: SnapshotTemporalRecord["witness"]["status"];
  predictionCount: number;
  observationCount: number;
  reconciliationCount: number;
  retry: SnapshotTemporalRecord["retry"];
  events: Array<{
    phase: "prediction" | "observation" | "reconciliation";
    at: string;
    key: string;
    value?: unknown;
    epistemic?: SnapshotKnowledgeItem["epistemic"];
    visibility: "visible" | "redacted";
    redaction?: InspectorRedaction;
    sourceIds: string[];
    evidenceIds: string[];
  }>;
}
export interface InspectorReport {
  version: "0";
  situationId: string;
  node?: { id: string; kind: RIRNode["kind"]; semanticRef?: string; salience?: number; physics?: RIRPhysics; temporal?: RIRNode["temporal"]; };
  semantic: { anchorId: string; knowledge?: InspectorKnowledge; possibility?: InspectorPossibility; };
  temporal: { records: InspectorTemporalRecord[]; relevant: InspectorTemporalRecord[]; };
  representation: { reasons: string[]; };
}

export function inspectRepresentation(args: { situation: Situation; snapshot: SemanticSnapshot; document: RIRDocument; nodeId?: string; }): InspectorReport {
  const node = args.nodeId ? args.document.nodes.find((item) => item.id === args.nodeId) : undefined;
  const semanticRef = node?.semanticRef;
  const knowledge = semanticRef ? findKnowledge(args.snapshot, semanticRef) : undefined;
  const possibility = semanticRef ? args.snapshot.possibilities.find((item) => item.id === semanticRef) : undefined;
  const semanticPossibility = possibility ? args.situation.possibilities.find((item) => item.id === possibility.id) : undefined;
  const records = args.snapshot.history.map(projectInspectorRecord);
  const relevant = records.filter((record) => isRelevantRecord(record, semanticRef, node?.temporal?.witnessId));

  const reasons = [...args.document.explanation];
  if (node) reasons.push(`RIR node ${node.id} uses semantic kind ${node.kind}.`);
  if (knowledge) {
    reasons.push(`${knowledge.key} is represented from ${knowledge.bucket} knowledge with epistemic state ${knowledge.epistemic}.`);
    if (knowledge.redaction) reasons.push(`${knowledge.key} is withheld by representation policy (${knowledge.redaction.reason}); withholding is not epistemic unknown.`);
  }
  if (possibility) {
    reasons.push(`${possibility.verb} is ${possibility.status}; availability is derived from constraints and authority.`);
    reasons.push(...possibility.resistance.explanation);
  }
  if (semanticPossibility) reasons.push(`Consequence contains ${semanticPossibility.consequence.effects.length} effect(s) and is ${semanticPossibility.consequence.reversibility}.`);
  if (node?.temporal) reasons.push(`${node.temporal.phase} at ${node.temporal.at} remains a distinct historical semantic event; later evidence does not rewrite it.`);
  appendPhysicsReasons(reasons, node?.physics);
  for (const record of relevant) {
    reasons.push(`Witness ${record.witnessId} is ${record.witnessStatus}; retry assessment is ${record.retry.status}/${record.retry.reason}.`);
    if (record.retry.status === "blocked") reasons.push(`Required action: ${record.retry.requiredAction}.`);
    for (const event of record.events.filter((item) => item.redaction)) {
      reasons.push(`${event.key} at ${event.at} is withheld by representation policy (${event.redaction?.reason}); the historical event remains present.`);
    }
  }

  return {
    version: "0",
    situationId: args.situation.id,
    node: node ? { id: node.id, kind: node.kind, semanticRef: node.semanticRef, salience: node.salience, physics: node.physics, temporal: node.temporal } : undefined,
    semantic: { anchorId: args.snapshot.anchor.id, knowledge, possibility: possibility ? { id: possibility.id, verb: possibility.verb, status: possibility.status, resistance: possibility.resistance, reasons: possibility.reasons } : undefined },
    temporal: { records, relevant },
    representation: { reasons },
  };
}

export function inspectTemporalHistory(snapshot: SemanticSnapshot): InspectorTemporalRecord[] { return snapshot.history.map(projectInspectorRecord); }
export function inspectAllPaths(args: { situation: Situation; snapshot: SemanticSnapshot; document: RIRDocument }): InspectorReport[] {
  return args.document.nodes.filter((node) => node.kind === "path").map((node) => inspectRepresentation({ ...args, nodeId: node.id }));
}

function projectInspectorRecord(record: SnapshotTemporalRecord): InspectorTemporalRecord {
  const facts = [...record.prediction, ...record.observations, ...record.reconciliations];
  return {
    id: record.id,
    transitionId: record.transitionId,
    witnessId: record.witness.id,
    witnessStatus: record.witness.status,
    predictionCount: record.prediction.length,
    observationCount: record.observations.length,
    reconciliationCount: record.reconciliations.length,
    retry: structuredClone(record.retry),
    events: facts.map((fact) => {
      const redaction = readRedaction(fact.value);
      return {
        phase: fact.phase,
        at: fact.at,
        key: `${fact.entity}.${fact.property}`,
        value: redaction ? undefined : structuredClone(fact.value),
        epistemic: fact.epistemic,
        visibility: redaction ? "redacted" as const : "visible" as const,
        redaction,
        sourceIds: [...fact.sourceIds],
        evidenceIds: [...fact.evidenceIds],
      };
    }),
  };
}
function isRelevantRecord(record: InspectorTemporalRecord, semanticRef?: string, witnessId?: string): boolean {
  if (witnessId && record.witnessId === witnessId) return true;
  if (!semanticRef) return false;
  return record.id === semanticRef || record.witnessId === semanticRef || record.events.some((event) => event.key === semanticRef);
}
function appendPhysicsReasons(reasons: string[], physics?: RIRPhysics): void {
  if (physics?.gravity) reasons.push(`Gravity ${physics.gravity.score.toFixed(2)} comes from semantic significance, not visual styling.`);
  if (physics?.distance) reasons.push(`Distance ${physics.distance.score.toFixed(2)} comes from semantic relation strength/context.`);
  if (physics?.depth) reasons.push(`Depth ${physics.depth.score.toFixed(2)} expresses semantic disclosure depth.`);
  if (physics?.trace) reasons.push(`Trace ${physics.trace.score.toFixed(2)} expresses durable outcome-trace demand.`);
  if (physics?.disclosure) reasons.push(`Disclosure ${physics.disclosure.score.toFixed(2)} expresses how much consequence/evidence must remain available.`);
  if (physics?.continuity) reasons.push(`Continuity ${physics.continuity.score.toFixed(2)} expresses preserved orientation across semantic change.`);
  if (physics?.momentum) reasons.push(`Momentum ${physics.momentum.score.toFixed(2)} expresses a transition still semantically underway or unresolved.`);
}
function findKnowledge(snapshot: SemanticSnapshot, key: string): InspectorKnowledge | undefined {
  const buckets = [["known", snapshot.known], ["uncertain", snapshot.uncertain], ["conflicted", snapshot.conflicted], ["unknown", snapshot.unknown]] as const;
  for (const [bucket, values] of buckets) {
    const item = values.find((candidate) => candidate.key === key);
    if (item) {
      const redaction = readRedaction(item.value);
      return {
        key: item.key,
        epistemic: item.epistemic,
        certainty: item.certainty,
        bucket,
        visibility: redaction ? "redacted" : "visible",
        redaction,
      };
    }
  }
  return undefined;
}
function readRedaction(value: unknown): InspectorRedaction | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<InspectorRedaction>;
  return candidate.redacted === true
    && candidate.meaning === "withheld-not-unknown"
    && typeof candidate.reason === "string"
    ? {
        redacted: true,
        meaning: "withheld-not-unknown",
        reason: candidate.reason,
        classification: typeof candidate.classification === "string" ? candidate.classification : undefined,
      }
    : undefined;
}
