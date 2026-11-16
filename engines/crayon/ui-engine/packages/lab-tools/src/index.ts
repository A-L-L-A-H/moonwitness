import type { Actor, AuthorityRule, Knowledge, Situation, TemporalFact, TemporalRecord } from "allah-crayon-kernel";
import type { RIRDocument, RIRNode } from "allah-crayon-rir";

export interface DeclarativeScenario {
  version: "0";
  id: string;
  label: string;
  question: string;
  actor: Actor;
  authorityRules: AuthorityRule[];
  situation: Situation;
  temporalRecords?: TemporalRecord[];
  tags?: string[];
}

export type ScenarioValidationCode =
  | "UNSUPPORTED_SCENARIO_VERSION"
  | "INVALID_SCENARIO_ID"
  | "INVALID_LABEL"
  | "INVALID_QUESTION"
  | "SITUATION_ID_MISMATCH"
  | "INVALID_NOW";

export function validateDeclarativeScenario(value: DeclarativeScenario): readonly ScenarioValidationCode[] {
  const issues: ScenarioValidationCode[] = [];
  if (value.version !== "0") issues.push("UNSUPPORTED_SCENARIO_VERSION");
  if (!nonEmpty(value.id)) issues.push("INVALID_SCENARIO_ID");
  if (!nonEmpty(value.label)) issues.push("INVALID_LABEL");
  if (!nonEmpty(value.question)) issues.push("INVALID_QUESTION");
  if (!value.situation?.id || value.situation.id !== value.id) issues.push("SITUATION_ID_MISMATCH");
  if (!validTime(value.situation?.now)) issues.push("INVALID_NOW");
  return Object.freeze(issues);
}

export function defineDeclarativeScenario(value: DeclarativeScenario): Readonly<DeclarativeScenario> {
  const issues = validateDeclarativeScenario(value);
  if (issues.length > 0) throw new Error(`INVALID_DECLARATIVE_SCENARIO:${issues.join(",")}`);
  return deepFreeze(structuredClone(value));
}

export interface TemporalFrame {
  at: string;
  recordIds: readonly string[];
  facts: readonly TemporalFact[];
  evidenceIds: readonly string[];
  sourceIds: readonly string[];
  witness: readonly { recordId: string; witnessId: string; status: TemporalRecord["witness"]["status"] }[];
  retry: readonly { recordId: string; assessment: TemporalRecord["retry"] }[];
}

export function createTemporalFrames(records: readonly TemporalRecord[]): readonly TemporalFrame[] {
  const points = [...new Set(records.flatMap((record) => [
    ...record.prediction.map((fact) => fact.at),
    ...record.observations.map((fact) => fact.at),
    ...record.reconciliations.map((fact) => fact.at),
    record.witness.at,
  ]))].sort();
  return Object.freeze(points.map((at) => projectTemporalFrame(records, at)));
}

export function projectTemporalFrame(records: readonly TemporalRecord[], at: string): TemporalFrame {
  if (!validTime(at)) throw new Error("Temporal frame requires a valid timestamp.");
  const facts: TemporalFact[] = [];
  const witness: TemporalFrame["witness"][number][] = [];
  const retry: TemporalFrame["retry"][number][] = [];
  const recordIds: string[] = [];
  for (const record of records) {
    const selected = [...record.prediction, ...record.observations, ...record.reconciliations]
      .filter((fact) => fact.at <= at);
    const witnessVisible = record.witness.at <= at;
    if (selected.length > 0 || witnessVisible) recordIds.push(record.id);
    facts.push(...selected.map((fact) => structuredClone(fact)));
    if (witnessVisible) {
      witness.push({ recordId: record.id, witnessId: record.witness.id, status: record.witness.status });
      retry.push({ recordId: record.id, assessment: structuredClone(record.retry) });
    }
  }
  facts.sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  const evidenceIds = [...new Set(facts.flatMap((fact) => fact.evidenceIds))].sort();
  const sourceIds = [...new Set(facts.flatMap((fact) => fact.sourceIds))].sort();
  return deepFreeze({ at, recordIds, facts, evidenceIds, sourceIds, witness, retry });
}

export interface RIRSemanticChange {
  nodeId: string;
  status: "added" | "removed" | "changed";
  before?: unknown;
  after?: unknown;
  explanation: readonly string[];
}

export function diffRIRSemantics(before: RIRDocument, after: RIRDocument): readonly RIRSemanticChange[] {
  const beforeMap = new Map(before.nodes.map((node) => [node.id, semanticNode(node)]));
  const afterMap = new Map(after.nodes.map((node) => [node.id, semanticNode(node)]));
  const ids = [...new Set([...beforeMap.keys(), ...afterMap.keys()])].sort();
  const changes: RIRSemanticChange[] = [];
  for (const id of ids) {
    const left = beforeMap.get(id);
    const right = afterMap.get(id);
    if (left === undefined) {
      changes.push({ nodeId: id, status: "added", after: right, explanation: [`semantic node ${id} was added`] });
    } else if (right === undefined) {
      changes.push({ nodeId: id, status: "removed", before: left, explanation: [`semantic node ${id} was removed`] });
    } else if (canonical(left) !== canonical(right)) {
      changes.push({ nodeId: id, status: "changed", before: left, after: right, explanation: explainSemanticChange(left, right) });
    }
  }
  return deepFreeze(changes);
}

export type EvidenceGraphNodeKind =
  | "record"
  | "prediction"
  | "observation"
  | "reconciliation-fact"
  | "evidence"
  | "source"
  | "knowledge"
  | "witness"
  | "reconciliation";

export interface EvidenceGraphNode {
  id: string;
  kind: EvidenceGraphNodeKind;
  label: string;
  epistemic?: Knowledge["epistemic"];
  critical?: boolean;
}
export interface EvidenceGraphEdge { from: string; to: string; relation: string; }
export interface EvidenceGraph { nodes: readonly EvidenceGraphNode[]; edges: readonly EvidenceGraphEdge[]; }

export function buildEvidenceGraph(records: readonly TemporalRecord[], knowledge: readonly Knowledge[] = []): EvidenceGraph {
  const nodes = new Map<string, EvidenceGraphNode>();
  const edges: EvidenceGraphEdge[] = [];
  const put = (node: EvidenceGraphNode) => { if (!nodes.has(node.id)) nodes.set(node.id, node); };

  for (const item of knowledge) {
    const id = `knowledge:${item.id}`;
    put({
      id,
      kind: "knowledge",
      label: item.key,
      epistemic: item.epistemic,
      critical: item.epistemic === "conflicted" || item.epistemic === "unknown",
    });
    for (const observationId of item.observations ?? []) {
      edges.push({ from: id, to: observationId, relation: "derived-from-observation" });
    }
    for (const evidence of item.evidence ?? []) {
      put({ id: evidence.id, kind: "evidence", label: evidence.id, critical: true });
      edges.push({ from: id, to: evidence.id, relation: "supported-by" });
      if (evidence.source) {
        put({ id: evidence.source, kind: "source", label: evidence.source });
        edges.push({ from: evidence.id, to: evidence.source, relation: "observed-by" });
      }
    }
  }

  for (const record of records) {
    put({ id: record.id, kind: "record", label: record.id });
    put({ id: record.witness.id, kind: "witness", label: `${record.witness.status} witness`, critical: true });
    edges.push({ from: record.id, to: record.witness.id, relation: "witnessed-by" });
    for (const fact of [...record.prediction, ...record.observations, ...record.reconciliations]) {
      const kind: EvidenceGraphNodeKind = fact.phase === "prediction"
        ? "prediction"
        : fact.phase === "observation"
          ? "observation"
          : "reconciliation-fact";
      put({
        id: fact.id,
        kind,
        label: `${fact.phase}:${fact.entity}.${fact.property}`,
        epistemic: fact.epistemic,
        critical: fact.epistemic === "conflicted" || fact.epistemic === "unknown",
      });
      edges.push({ from: record.id, to: fact.id, relation: "contains" });
      for (const evidenceId of fact.evidenceIds) {
        put({ id: evidenceId, kind: "evidence", label: evidenceId, critical: true });
        edges.push({ from: fact.id, to: evidenceId, relation: "supported-by" });
      }
      for (const sourceId of fact.sourceIds) {
        put({ id: sourceId, kind: "source", label: sourceId });
        edges.push({ from: fact.id, to: sourceId, relation: "derived-from" });
      }
    }
    for (const reconciliationId of record.reconciliationIds) {
      put({ id: reconciliationId, kind: "reconciliation", label: reconciliationId, critical: true });
      edges.push({ from: record.id, to: reconciliationId, relation: "reconciled-by" });
    }
  }
  return deepFreeze({ nodes: [...nodes.values()], edges });
}

export function filterEvidenceGraph(
  graph: EvidenceGraph,
  args: { kinds?: readonly EvidenceGraphNodeKind[]; preserveCritical?: boolean } = {},
): EvidenceGraph {
  const requestedKinds = args.kinds ? new Set(args.kinds) : undefined;
  const preserveCritical = args.preserveCritical ?? true;
  const keep = new Set(graph.nodes
    .filter((node) => requestedKinds === undefined || requestedKinds.has(node.kind) || (preserveCritical && node.critical))
    .map((node) => node.id));
  return deepFreeze({
    nodes: graph.nodes.filter((node) => keep.has(node.id)).map((node) => structuredClone(node)),
    edges: graph.edges.filter((edge) => keep.has(edge.from) && keep.has(edge.to)).map((edge) => structuredClone(edge)),
  });
}

export interface ProfileSample { name: string; durationMs: number; }
export interface PipelineProfile { samples: readonly ProfileSample[]; totalMs: number; }
export interface ProfileStage<Result = unknown> { name: string; run: () => Result | Promise<Result>; }
type ProfileStageResult<Stage> = Stage extends ProfileStage<infer Result> ? Awaited<Result> : never;
export type ProfileStageValues<Stages extends readonly ProfileStage[]> = {
  readonly [Index in keyof Stages]: ProfileStageResult<Stages[Index]>;
};

export async function profilePipeline<const Stages extends readonly ProfileStage[]>(
  stages: Stages,
  monotonicNow: () => number = defaultMonotonicNow,
): Promise<{ values: ProfileStageValues<Stages>; profile: PipelineProfile }> {
  const values: unknown[] = [];
  const samples: ProfileSample[] = [];
  const totalStart = monotonicNow();
  for (const stage of stages) {
    const start = monotonicNow();
    values.push(await stage.run());
    const end = monotonicNow();
    samples.push({ name: stage.name, durationMs: Math.max(0, end - start) });
  }
  const totalMs = Math.max(0, monotonicNow() - totalStart);
  return {
    values: Object.freeze(values) as unknown as ProfileStageValues<Stages>,
    profile: deepFreeze({ samples, totalMs }),
  };
}

function semanticNode(node: RIRNode): unknown {
  const copy = structuredClone(node) as unknown as Record<string, unknown>;
  // Human-facing text may be localized; semantic comparison intentionally ignores labels.
  delete copy.label;
  if (node.kind === "path") delete copy.intent;
  return copy;
}

function explainSemanticChange(left: unknown, right: unknown): readonly string[] {
  if (!isRecord(left) || !isRecord(right)) return ["semantic value changed"];
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
  const changed = keys.filter((key) => canonical(left[key]) !== canonical(right[key]));
  const priority = ["epistemic", "availability", "resistance", "requirements", "consequenceMarks", "temporal", "physics", "semanticRef"];
  const ordered = [
    ...priority.filter((key) => changed.includes(key)),
    ...changed.filter((key) => !priority.includes(key)),
  ];
  return Object.freeze(ordered.map((key) => `semantic field ${key} changed`));
}

function canonical(value: unknown): string {
  return JSON.stringify(sort(value));
}
function sort(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sort);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, sort(record[key])]));
}
function defaultMonotonicNow(): number {
  return globalThis.performance?.now?.() ?? Date.now();
}
function validTime(value: unknown): value is string {
  return nonEmpty(value) && Number.isFinite(Date.parse(value));
}
function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return value;
}
