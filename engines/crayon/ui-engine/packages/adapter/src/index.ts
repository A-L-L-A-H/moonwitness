export * from "./ingestion.js";
export * from "./connector.js";
export * from "./reference.js";

import type { Situation } from "allah-crayon-kernel";

export interface DomainAdapterContext {
  now: string;
}

export interface DomainAdapter<Input> {
  id: string;
  adapt(input: Input, context: DomainAdapterContext): Situation;
}

export type AdapterValidationReasonCode =
  | "INVALID_ADAPTER_ID"
  | "INVALID_CONTEXT_TIME"
  | "ADAPTER_EXCEPTION"
  | "INVALID_SITUATION_ID"
  | "INVALID_SITUATION_TIME"
  | "ANCHOR_ENTITY_MISSING"
  | "DUPLICATE_ENTITY_ID"
  | "DANGLING_RELATION"
  | "INVALID_OBSERVATION_TIME"
  | "MISSING_OBSERVATION_SOURCE"
  | "INVALID_RELIABILITY"
  | "FACT_WITHOUT_PROVENANCE";

export interface AdapterValidationIssue {
  code: AdapterValidationReasonCode;
  path: string;
  explanation: string;
}

export interface AdapterValidationReport {
  valid: boolean;
  issues: AdapterValidationIssue[];
}

export class DomainAdapterError extends Error {
  readonly code: "ADAPTER_VALIDATION_FAILED";
  readonly adapterId: string;
  readonly issues: readonly AdapterValidationIssue[];

  constructor(adapterId: string, issues: readonly AdapterValidationIssue[]) {
    super(`Domain adapter ${adapterId || "<unknown>"} produced invalid CRAYON input.`);
    this.name = "DomainAdapterError";
    this.code = "ADAPTER_VALIDATION_FAILED";
    this.adapterId = adapterId;
    this.issues = Object.freeze([...issues]);
  }
}

export function defineDomainAdapter<Input>(adapter: DomainAdapter<Input>): DomainAdapter<Input> {
  if (!nonEmpty(adapter.id)) {
    throw new DomainAdapterError(adapter.id ?? "", [{
      code: "INVALID_ADAPTER_ID",
      path: "adapter.id",
      explanation: "Adapter identity must be a non-empty string.",
    }]);
  }

  return Object.freeze({
    id: adapter.id,
    adapt(input: Input, context: DomainAdapterContext): Situation {
      const contextIssues = validateContext(context);
      if (contextIssues.length > 0) throw new DomainAdapterError(adapter.id, contextIssues);

      const situation = adapter.adapt(input, context);
      const report = validateAdaptedSituation(situation);
      if (!report.valid) throw new DomainAdapterError(adapter.id, report.issues);
      return deepFreeze(structuredClone(situation));
    },
  });
}

export function validateAdaptedSituation(situation: Situation): AdapterValidationReport {
  const issues: AdapterValidationIssue[] = [];
  const candidate = situation as Partial<Situation> | null | undefined;

  if (!candidate || !nonEmpty(candidate.id)) {
    issues.push(issue("INVALID_SITUATION_ID", "situation.id", "Situation identity must be a non-empty string."));
  }
  if (!candidate || !validTime(candidate.now)) {
    issues.push(issue("INVALID_SITUATION_TIME", "situation.now", "Situation.now must be a valid timestamp."));
  }

  const entities = Array.isArray(candidate?.entities) ? candidate.entities : [];
  const entityIds = new Set<string>();
  for (let index = 0; index < entities.length; index += 1) {
    const entity = entities[index];
    if (entityIds.has(entity.id)) {
      issues.push(issue("DUPLICATE_ENTITY_ID", `situation.entities[${index}].id`, `Entity identity ${entity.id} appears more than once.`));
    }
    entityIds.add(entity.id);
  }

  if (!candidate?.anchor || !nonEmpty(candidate.anchor.id) || !entityIds.has(candidate.anchor.id)) {
    issues.push(issue("ANCHOR_ENTITY_MISSING", "situation.anchor", "Situation anchor must reference an entity present in the same situation."));
  }

  const relations = Array.isArray(candidate?.relations) ? candidate.relations : [];
  for (let index = 0; index < relations.length; index += 1) {
    const relation = relations[index];
    if (!entityIds.has(relation.from) || !entityIds.has(relation.to)) {
      issues.push(issue("DANGLING_RELATION", `situation.relations[${index}]`, "Relation endpoints must reference entities present in the situation."));
    }
  }

  const observations = Array.isArray(candidate?.observations) ? candidate.observations : [];
  for (let index = 0; index < observations.length; index += 1) {
    const observation = observations[index];
    if (!validTime(observation.observedAt)) {
      issues.push(issue("INVALID_OBSERVATION_TIME", `situation.observations[${index}].observedAt`, "Observation timestamp must be valid."));
    }
    if (!nonEmpty(observation.source)) {
      issues.push(issue("MISSING_OBSERVATION_SOURCE", `situation.observations[${index}].source`, "Observation provenance source is required."));
    }
    if (observation.reliability !== undefined && !unitInterval(observation.reliability)) {
      issues.push(issue("INVALID_RELIABILITY", `situation.observations[${index}].reliability`, "Observation reliability must be within 0..1 when supplied."));
    }
  }

  const knowledge = Array.isArray(candidate?.knowledge) ? candidate.knowledge : [];
  for (let index = 0; index < knowledge.length; index += 1) {
    const item = knowledge[index];
    if (item.epistemic === "fact" && (item.observations?.length ?? 0) === 0 && (item.evidence?.length ?? 0) === 0) {
      issues.push(issue("FACT_WITHOUT_PROVENANCE", `situation.knowledge[${index}]`, "Adapter-produced fact knowledge must cite observation or evidence provenance."));
    }
    for (let evidenceIndex = 0; evidenceIndex < (item.evidence?.length ?? 0); evidenceIndex += 1) {
      const evidence = item.evidence?.[evidenceIndex];
      if (evidence?.reliability !== undefined && !unitInterval(evidence.reliability)) {
        issues.push(issue("INVALID_RELIABILITY", `situation.knowledge[${index}].evidence[${evidenceIndex}].reliability`, "Evidence reliability must be within 0..1 when supplied."));
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function runDomainAdapterConformance<Input>(args: {
  adapter: DomainAdapter<Input>;
  input: Input;
  context: DomainAdapterContext;
}): { situation?: Situation; report: AdapterValidationReport } {
  const contextIssues = validateContext(args.context);
  if (!nonEmpty(args.adapter.id)) {
    contextIssues.unshift(issue("INVALID_ADAPTER_ID", "adapter.id", "Adapter identity must be a non-empty string."));
  }
  if (contextIssues.length > 0) return { report: { valid: false, issues: contextIssues } };

  try {
    const situation = args.adapter.adapt(args.input, args.context);
    const report = validateAdaptedSituation(situation);
    return report.valid ? { situation: deepFreeze(structuredClone(situation)), report } : { report };
  } catch (error) {
    return {
      report: {
        valid: false,
        issues: [issue(
          "ADAPTER_EXCEPTION",
          "adapter.adapt",
          `Adapter threw before producing a valid situation: ${error instanceof Error ? error.message : String(error)}`,
        )],
      },
    };
  }
}

function validateContext(context: DomainAdapterContext): AdapterValidationIssue[] {
  return validTime(context?.now)
    ? []
    : [issue("INVALID_CONTEXT_TIME", "context.now", "Adapter context requires a valid deterministic current timestamp.")];
}

function validTime(value: unknown): value is string {
  return nonEmpty(value) && Number.isFinite(Date.parse(value));
}

function unitInterval(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function issue(code: AdapterValidationReasonCode, path: string, explanation: string): AdapterValidationIssue {
  return { code, path, explanation };
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return value;
}
