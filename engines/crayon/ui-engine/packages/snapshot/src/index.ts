import { assessPossibility } from "allah-crayon-kernel";
import type { Actor, AuthorityRule, Knowledge, PossibilityReason, RetryAssessment, Situation, TemporalFact, TemporalRecord, Witness } from "allah-crayon-kernel";
import { explainCommitment, type ConsequenceContext, type ConsequenceSignal } from "allah-crayon-physics";

export interface SnapshotKnowledgeItem {
  key: string;
  value?: unknown;
  epistemic: Knowledge["epistemic"];
  certainty?: number;
  observationIds: string[];
}
export interface SnapshotPossibilityItem {
  id: string;
  verb: string;
  subjectId: string;
  status: "available" | "unavailable" | "unknown";
  reasons: PossibilityReason[];
  resistance: { score: number; mode: string; factors: ConsequenceSignal[]; explanation: string[] };
}
export interface SnapshotTemporalFact {
  id: string;
  phase: TemporalFact["phase"];
  at: string;
  entity: string;
  property: string;
  value?: unknown;
  epistemic?: Knowledge["epistemic"];
  sourceIds: string[];
  evidenceIds: string[];
}
export interface SnapshotTemporalRecord {
  id: string;
  transitionId: string;
  intentId: string;
  actorId: string;
  prediction: SnapshotTemporalFact[];
  observations: SnapshotTemporalFact[];
  reconciliations: SnapshotTemporalFact[];
  witness: { id: string; at: string; status: Witness["status"] };
  retry: RetryAssessment;
  reconciliationIds: string[];
}
export interface SemanticSnapshot {
  version: "0";
  situationId: string;
  at: string;
  anchor: { id: string; type?: string };
  known: SnapshotKnowledgeItem[];
  uncertain: SnapshotKnowledgeItem[];
  conflicted: SnapshotKnowledgeItem[];
  unknown: SnapshotKnowledgeItem[];
  possibilities: SnapshotPossibilityItem[];
  witnesses: string[];
  history: SnapshotTemporalRecord[];
  context: { entityCount: number; relationCount: number; observationCount: number };
}
export interface SemanticDiff {
  fromSituationId: string;
  toSituationId: string;
  knowledge: Array<{ key: string; before?: SnapshotKnowledgeItem; after?: SnapshotKnowledgeItem }>;
  possibilities: Array<{ id: string; before?: SnapshotPossibilityItem; after?: SnapshotPossibilityItem }>;
  history: Array<{ id: string; before?: SnapshotTemporalRecord; after?: SnapshotTemporalRecord }>;
}

export function createSemanticSnapshot(args: {
  situation: Situation;
  actor: Actor;
  authorityRules: AuthorityRule[];
  witnesses?: Witness[];
  temporalRecords?: TemporalRecord[];
  consequenceContext?: Record<string, ConsequenceContext>;
}): SemanticSnapshot {
  const buckets = bucketKnowledge(args.situation.knowledge);
  const possibilities = args.situation.possibilities.map((possibility) => {
    const assessment = assessPossibility({ possibility, actor: args.actor, knowledge: args.situation.knowledge, authorityRules: args.authorityRules, situationId: args.situation.id });
    const resistance = explainCommitment(possibility.consequence, args.consequenceContext?.[possibility.id]);
    return {
      id: possibility.id,
      verb: possibility.verb,
      subjectId: possibility.subject.id,
      status: assessment.status,
      reasons: assessment.reasons,
      resistance: { score: resistance.score, mode: resistance.mode, factors: resistance.factors, explanation: resistance.explanation },
    } satisfies SnapshotPossibilityItem;
  });
  const history = (args.temporalRecords ?? []).map(projectTemporalRecord).sort((left, right) => left.witness.at.localeCompare(right.witness.at));
  const witnessIds = new Set([...(args.witnesses ?? []).map((witness) => witness.id), ...history.map((record) => record.witness.id)]);
  return {
    version: "0",
    situationId: args.situation.id,
    at: args.situation.now,
    anchor: { id: args.situation.anchor.id, type: args.situation.anchor.type },
    ...buckets,
    possibilities,
    witnesses: [...witnessIds].sort(),
    history,
    context: { entityCount: args.situation.entities.length, relationCount: args.situation.relations.length, observationCount: args.situation.observations.length },
  };
}

export function diffSemanticSnapshots(before: SemanticSnapshot, after: SemanticSnapshot): SemanticDiff {
  const beforeKnowledge = indexKnowledge(before);
  const afterKnowledge = indexKnowledge(after);
  const knowledgeKeys = new Set([...beforeKnowledge.keys(), ...afterKnowledge.keys()]);
  const knowledge = [...knowledgeKeys].sort().flatMap((key) => {
    const previous = beforeKnowledge.get(key); const next = afterKnowledge.get(key);
    return semanticEqual(previous, next) ? [] : [{ key, before: previous, after: next }];
  });
  const beforePossibilities = new Map(before.possibilities.map((item) => [item.id, item]));
  const afterPossibilities = new Map(after.possibilities.map((item) => [item.id, item]));
  const possibilityIds = new Set([...beforePossibilities.keys(), ...afterPossibilities.keys()]);
  const possibilities = [...possibilityIds].sort().flatMap((id) => {
    const previous = beforePossibilities.get(id); const next = afterPossibilities.get(id);
    return semanticEqual(previous, next) ? [] : [{ id, before: previous, after: next }];
  });
  const beforeHistory = new Map(before.history.map((item) => [item.id, item]));
  const afterHistory = new Map(after.history.map((item) => [item.id, item]));
  const historyIds = new Set([...beforeHistory.keys(), ...afterHistory.keys()]);
  const history = [...historyIds].sort().flatMap((id) => {
    const previous = beforeHistory.get(id); const next = afterHistory.get(id);
    return semanticEqual(previous, next) ? [] : [{ id, before: previous, after: next }];
  });
  return { fromSituationId: before.situationId, toSituationId: after.situationId, knowledge, possibilities, history };
}

function projectTemporalRecord(record: TemporalRecord): SnapshotTemporalRecord {
  return {
    id: record.id,
    transitionId: record.transitionId,
    intentId: record.intentId,
    actorId: record.actorId,
    prediction: record.prediction.map(projectTemporalFact),
    observations: record.observations.map(projectTemporalFact),
    reconciliations: record.reconciliations.map(projectTemporalFact),
    witness: { id: record.witness.id, at: record.witness.at, status: record.witness.status },
    retry: structuredClone(record.retry),
    reconciliationIds: [...record.reconciliationIds],
  };
}
function projectTemporalFact(fact: TemporalFact): SnapshotTemporalFact {
  return { ...structuredClone(fact), sourceIds: [...fact.sourceIds], evidenceIds: [...fact.evidenceIds] };
}
function bucketKnowledge(knowledge: Knowledge[]): Pick<SemanticSnapshot, "known" | "uncertain" | "conflicted" | "unknown"> {
  const result = { known: [] as SnapshotKnowledgeItem[], uncertain: [] as SnapshotKnowledgeItem[], conflicted: [] as SnapshotKnowledgeItem[], unknown: [] as SnapshotKnowledgeItem[] };
  for (const item of knowledge) {
    const normalized: SnapshotKnowledgeItem = { key: item.key, value: item.value, epistemic: item.epistemic, certainty: item.certainty, observationIds: item.observations ?? [] };
    if (item.epistemic === "fact" || item.epistemic === "derived") result.known.push(normalized);
    else if (item.epistemic === "conflicted") result.conflicted.push(normalized);
    else if (item.epistemic === "unknown") result.unknown.push(normalized);
    else result.uncertain.push(normalized);
  }
  for (const values of Object.values(result)) values.sort((left, right) => left.key.localeCompare(right.key));
  return result;
}
function indexKnowledge(snapshot: SemanticSnapshot): Map<string, SnapshotKnowledgeItem> {
  return new Map([...snapshot.known, ...snapshot.uncertain, ...snapshot.conflicted, ...snapshot.unknown].map((item) => [item.key, item]));
}
function semanticEqual(left: unknown, right: unknown): boolean { return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right)); }
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => [key, canonicalize(nested)]));
  return value;
}

export * from "./version.js";
