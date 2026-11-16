import type { Effect, Situation } from "allah-crayon-kernel";
import { continuity, depth, disclosure, distance, gravity, momentum, trace } from "allah-crayon-physics";
import type { SemanticSnapshot, SnapshotTemporalFact, SnapshotTemporalRecord } from "allah-crayon-snapshot";
import type { RIRAnchor, RIRDocument, RIRField, RIRLayer, RIRLine, RIRMark, RIRNode, RIRPath, RIRPortal, RIRRegion } from "./model.js";

export function planSituationRepresentation(args: { situation: Situation; snapshot: SemanticSnapshot }): RIRDocument {
  const nodes: RIRNode[] = [];
  const rootId = `field:${args.situation.id}`;
  const anchorId = `anchor:${args.snapshot.anchor.id}`;
  const anchorGravity = gravity({ relevance: 1 });
  const anchorContinuity = continuity({ identityStability: 1, relationStability: 1, semanticChange: 0 });
  const anchor: RIRAnchor = {
    id: anchorId, kind: "anchor", subjectId: args.snapshot.anchor.id, entityType: args.snapshot.anchor.type,
    label: entityLabel(args.situation, args.snapshot.anchor.id), semanticRef: args.snapshot.anchor.id,
    salience: anchorGravity.score, physics: { gravity: signal(anchorGravity), depth: signal(depth({ abstraction: 0 })), continuity: signal(anchorContinuity) },
  };
  nodes.push(anchor);
  const presentMembers: string[] = [anchorId]; const futureMembers: string[] = []; const contextMembers: string[] = []; const historyMembers: string[] = [];

  for (const knowledge of args.snapshot.known) {
    const knowledgeGravity = gravity({ relevance: knowledge.certainty ?? 0.7 });
    const mark: RIRMark = { id: `mark:knowledge:${stableId(knowledge.key)}`, kind: "mark", role: "knowledge", label: knowledge.key, value: knowledge.value, epistemic: knowledge.epistemic, semanticRef: knowledge.key, salience: knowledgeGravity.score, physics: { gravity: signal(knowledgeGravity), depth: signal(depth({ abstraction: 0.25 })), continuity: signal(continuity({ identityStability: 1, relationStability: 0.8, semanticChange: 0 })) } };
    nodes.push(mark); presentMembers.push(mark.id);
  }
  for (const knowledge of [...args.snapshot.uncertain, ...args.snapshot.conflicted, ...args.snapshot.unknown]) {
    const uncertainty = 1 - (knowledge.certainty ?? 0);
    const markGravity = gravity({ relevance: 0.65, uncertainty });
    const mark: RIRMark = { id: `mark:epistemic:${stableId(knowledge.key)}`, kind: "mark", role: "knowledge", label: knowledge.key, value: knowledge.value, epistemic: knowledge.epistemic, semanticRef: knowledge.key, salience: markGravity.score, physics: { gravity: signal(markGravity), depth: signal(depth({ abstraction: 0.4, uncertainty, evidenceDemand: 0.7 })), disclosure: signal(disclosure({ uncertainty, evidenceDemand: 0.7 })) } };
    nodes.push(mark); contextMembers.push(mark.id);
  }
  for (const relation of args.situation.relations) {
    if (relation.from !== args.snapshot.anchor.id && relation.to !== args.snapshot.anchor.id) continue;
    const target = relation.from === args.snapshot.anchor.id ? relation.to : relation.from;
    const portalDistance = distance({ relationStrength: relation.strength ?? 0.5, sharedContext: 0.5 });
    const portalGravity = gravity({ relevance: relation.strength ?? 0.5 });
    const portal: RIRPortal = { id: `portal:${stableId(relation.type)}:${stableId(target)}`, kind: "portal", targetSubjectId: target, label: entityLabel(args.situation, target), relation: relation.type, semanticRef: target, salience: portalGravity.score, physics: { gravity: signal(portalGravity), distance: signal(portalDistance), continuity: signal(continuity({ identityStability: 1, relationStability: relation.strength ?? 0.5, semanticChange: 0 })) } };
    nodes.push(portal); contextMembers.push(portal.id);
    const line: RIRLine = { id: `line:${anchorId}:${portal.id}`, kind: "line", from: anchorId, to: portal.id, relation: relation.type, strength: relation.strength, semanticRef: relation.type, physics: { distance: signal(portalDistance) } };
    nodes.push(line); contextMembers.push(line.id);
  }

  for (const possibility of args.snapshot.possibilities) {
    const semanticPossibility = args.situation.possibilities.find((item) => item.id === possibility.id);
    if (!semanticPossibility) continue;
    const impact = semanticPossibility.consequence.impact;
    const uncertainty = possibility.resistance.factors.find((factor) => factor.kind === "uncertainty")?.score ?? semanticPossibility.consequence.uncertainty ?? 0;
    const external = possibility.resistance.factors.find((factor) => factor.kind === "external-dependency")?.score ?? 0;
    const irreversibility = possibility.resistance.factors.find((factor) => factor.kind === "irreversibility")?.score ?? 0;
    const authority = possibility.resistance.factors.find((factor) => factor.kind === "authority")?.score ?? 0;
    const pathGravity = gravity({ relevance: possibility.status === "available" ? 1 : 0.55, impact, uncertainty });
    const pathTrace = trace({ impact, uncertainty, irreversibility, externalDependency: external });
    const pathDisclosure = disclosure({ impact, irreversibility, uncertainty, authorityCost: authority, evidenceDemand: pathTrace.score });
    const pathDepth = depth({ abstraction: 0.35, evidenceDemand: Math.max(pathTrace.score, pathDisclosure.score), uncertainty });
    const futureId = `mark:future:${stableId(possibility.id)}`;
    const future: RIRMark = { id: futureId, kind: "mark", role: "future", label: `${possibility.verb} · possible future`, value: summarizeFuture(semanticPossibility.consequence.effects), semanticRef: possibility.id, salience: pathGravity.score, physics: { gravity: signal(pathGravity), depth: signal(pathDepth), trace: signal(pathTrace), disclosure: signal(pathDisclosure) } };
    nodes.push(future); futureMembers.push(future.id);
    const effectMarks = semanticPossibility.consequence.effects.map((effect, index) => {
      const mark: RIRMark = { id: `mark:effect:${stableId(possibility.id)}:${index}`, kind: "mark", role: "effect", label: effect.description ?? `${effect.entity}.${effect.property}`, value: effectValue(effect), semanticRef: effect.id, salience: Math.max(0.45, pathGravity.score), physics: { gravity: signal(pathGravity), trace: signal(pathTrace), disclosure: signal(pathDisclosure) } };
      nodes.push(mark); futureMembers.push(mark.id); return mark.id;
    });
    const region: RIRRegion = { id: `region:consequence:${stableId(possibility.id)}`, kind: "region", purpose: "consequence", label: "Consequences", members: effectMarks, semanticRef: possibility.id, salience: pathGravity.score, physics: { gravity: signal(pathGravity), depth: signal(pathDepth), trace: signal(pathTrace), disclosure: signal(pathDisclosure) } };
    nodes.push(region); futureMembers.push(region.id);
    const authorityCapabilities = [...new Set((semanticPossibility.authority?.length ? semanticPossibility.authority.map((requirement) => requirement.capability) : ["intend"]).map(String))].sort();
    const constraintIds = (semanticPossibility.constraints ?? []).map((constraint) => constraint.id).sort();
    const path: RIRPath = {
      id: `path:${stableId(possibility.id)}`, kind: "path", from: anchorId, to: futureId, intent: possibility.verb,
      possibilityId: possibility.id, availability: possibility.status,
      resistance: { score: possibility.resistance.score, mode: possibility.resistance.mode }, consequenceMarks: effectMarks,
      requirements: { constraintIds, authorityCapabilities }, semanticRef: possibility.id, salience: pathGravity.score,
      physics: { gravity: signal(pathGravity), depth: signal(pathDepth), trace: signal(pathTrace), disclosure: signal(pathDisclosure) },
    };
    nodes.push(path); futureMembers.push(path.id);
  }

  for (const record of args.snapshot.history) planTemporalRecord(record, nodes, historyMembers);

  nodes.push({ id: "layer:present", kind: "layer", depth: 0, purpose: "present", members: presentMembers } satisfies RIRLayer);
  nodes.push({ id: "layer:future", kind: "layer", depth: 1, purpose: "possible-future", members: futureMembers } satisfies RIRLayer);
  if (contextMembers.length > 0) nodes.push({ id: "layer:context", kind: "layer", depth: 1, purpose: "context", members: contextMembers } satisfies RIRLayer);
  if (historyMembers.length > 0) nodes.push({ id: "layer:history", kind: "layer", depth: 2, purpose: "history", members: historyMembers } satisfies RIRLayer);
  const field: RIRField = { id: rootId, kind: "field", children: nodes.filter((node) => node.kind === "layer").map((node) => node.id), semanticRef: args.situation.id };
  nodes.unshift(field);
  return {
    version: "0", situationId: args.situation.id, root: rootId, nodes,
    explanation: [
      `Anchor is ${args.snapshot.anchor.id}.`,
      `${args.snapshot.possibilities.length} semantic possibility path(s) planned.`,
      "Present state and possible future are kept in separate semantic layers.",
      `${args.snapshot.history.length} immutable temporal witness record(s) projected into history.`,
      "Constraints and authority requirements remain semantic requirements across renderers.",
      "Gravity, distance, depth, trace, disclosure, continuity, and momentum are derived before renderer-specific representation.",
    ],
  };
}

function planTemporalRecord(record: SnapshotTemporalRecord, nodes: RIRNode[], historyMembers: string[]): void {
  const allFacts = [...record.prediction, ...record.observations, ...record.reconciliations];
  const observedTargets = new Set(record.observations.map((fact) => `${fact.entity}.${fact.property}`));
  const predictedTargets = new Set(record.prediction.map((fact) => `${fact.entity}.${fact.property}`));
  const observationProgress = predictedTargets.size === 0 ? 1 : [...predictedTargets].filter((key) => observedTargets.has(key)).length / predictedTargets.size;
  const unresolved = record.retry.status === "blocked" && record.retry.reason === "OUTCOME_UNRESOLVED";
  const recordMomentum = momentum({ committed: 1, executing: unresolved ? 0.4 : 0, externalPending: unresolved ? 1 : 0, observationProgress });
  const members: string[] = [];
  for (const fact of allFacts) {
    const mark = temporalMark(record, fact, recordMomentum);
    nodes.push(mark); members.push(mark.id); historyMembers.push(mark.id);
  }
  const witnessId = `mark:witness:${stableId(record.witness.id)}`;
  const witnessTrace = trace({ impact: record.witness.status === "verified" ? 0.6 : 0.8, uncertainty: record.witness.status === "unverified" || record.witness.status === "partial" ? 0.8 : 0.2, irreversibility: 0.5 });
  const witness: RIRMark = {
    id: witnessId, kind: "mark", role: "witness", label: `Witness ${record.witness.id}`,
    value: record.witness.status, semanticRef: record.witness.id,
    temporal: { phase: "witness", at: record.witness.at, witnessId: record.witness.id, status: record.witness.status },
    physics: { trace: signal(witnessTrace), momentum: signal(recordMomentum), continuity: signal(continuity({ identityStability: 1, relationStability: 1, semanticChange: record.witness.status === "verified" ? 0.2 : 0.6 })) },
  };
  nodes.push(witness); members.push(witness.id); historyMembers.push(witness.id);
  const retryId = `mark:retry:${stableId(record.id)}`;
  const retry: RIRMark = {
    id: retryId, kind: "mark", role: "retry", label: "Retry / reconciliation",
    value: { status: record.retry.status, reason: record.retry.reason, requiredAction: record.retry.requiredAction },
    semanticRef: record.id, temporal: { phase: "witness", at: record.witness.at, witnessId: record.witness.id, status: record.witness.status },
    physics: { momentum: signal(recordMomentum), disclosure: signal(disclosure({ uncertainty: unresolved ? 1 : 0.2, evidenceDemand: unresolved ? 1 : 0.3 })) },
  };
  nodes.push(retry); members.push(retry.id); historyMembers.push(retry.id);
  const region: RIRRegion = { id: `region:history:${stableId(record.id)}`, kind: "region", purpose: "history", label: `History ${record.transitionId}`, members, semanticRef: record.id, physics: { momentum: signal(recordMomentum), continuity: signal(continuity({ identityStability: 1, relationStability: 1, semanticChange: 0.4 })) } };
  nodes.push(region); historyMembers.push(region.id);
}

function temporalMark(record: SnapshotTemporalRecord, fact: SnapshotTemporalFact, recordMomentum: ReturnType<typeof momentum>): RIRMark {
  const uncertainty = fact.epistemic === "unknown" ? 1 : fact.epistemic === "conflicted" ? 0.9 : fact.epistemic === "uncertain" || fact.epistemic === "estimate" || fact.epistemic === "claim" ? 0.55 : 0.1;
  const change = fact.phase === "prediction" ? 0.6 : fact.phase === "observation" ? 0.45 : 0.25;
  return {
    id: `mark:${fact.phase}:${stableId(fact.id)}`, kind: "mark", role: fact.phase,
    label: `${fact.entity}.${fact.property}`, value: fact.value, epistemic: fact.epistemic,
    semanticRef: `${fact.entity}.${fact.property}`,
    temporal: { phase: fact.phase, at: fact.at, witnessId: record.witness.id, status: record.witness.status, sourceIds: fact.sourceIds, evidenceIds: fact.evidenceIds },
    physics: {
      gravity: signal(gravity({ relevance: 0.7, uncertainty })),
      depth: signal(depth({ abstraction: 0.2, uncertainty, evidenceDemand: fact.evidenceIds.length > 0 ? 0.4 : 0.8 })),
      trace: signal(trace({ impact: 0.5, uncertainty, externalDependency: fact.phase === "observation" ? 0.4 : 0 })),
      disclosure: signal(disclosure({ impact: 0.5, uncertainty, evidenceDemand: 0.7 })),
      continuity: signal(continuity({ identityStability: 1, relationStability: 1, semanticChange: change })),
      momentum: signal(recordMomentum),
    },
  };
}

function signal(value: { score: number; explanation: string[] }) { return { score: value.score, explanation: value.explanation }; }
function entityLabel(situation: Situation, id: string): string { const entity = situation.entities.find((item) => item.id === id); if (!entity) return id; const preferred = entity.state.name ?? entity.state.label ?? entity.state.number; return typeof preferred === "string" ? preferred : id; }
function summarizeFuture(effects: Effect[]): string[] { return effects.map((effect) => `${effect.entity}.${effect.property} ${formatEffect(effect)}`); }
function effectValue(effect: Effect): unknown { if (effect.to !== undefined) return effect.to; if (effect.delta !== undefined) return { delta: effect.delta }; return undefined; }
function formatEffect(effect: Effect): string { if (effect.from !== undefined || effect.to !== undefined) return `${String(effect.from ?? "?")} → ${String(effect.to ?? "?")}`; if (effect.delta !== undefined) return effect.delta >= 0 ? `+${effect.delta}` : String(effect.delta); return "changes"; }
function stableId(value: string): string { return value.replace(/[^a-zA-Z0-9_-]/g, "-"); }
