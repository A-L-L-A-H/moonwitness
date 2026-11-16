import type {
  Actor,
  AuthorityRule,
  Situation,
  TemporalRecord,
} from "allah-crayon-kernel";
import type { ConsequenceContext } from "allah-crayon-physics";

export interface LabScenario {
  id: string;
  label: string;
  question: string;
  actor: Actor;
  authorityRules: AuthorityRule[];
  situation: Situation;
  temporalRecords?: TemporalRecord[];
  consequenceContext?: Record<string, ConsequenceContext>;
}

const human: Actor = { id: "human:operator", kind: "human" };

export const scenarios: LabScenario[] = [
  transferScenario(),
  simpleScenario({
    id: "file",
    label: "File",
    question: "What does reversible deletion feel like?",
    anchorId: "file:report",
    anchorType: "file",
    anchorLabel: "Quarterly Report",
    relatedId: "folder:archive",
    relation: "contained-in",
    knowledgeKey: "file:report.status",
    value: "active",
    verb: "Move to trash",
    next: "trashed",
    reversibility: "temporarily-reversible",
    risk: 0.22,
    impact: 0.38,
    uncertainty: 0.02,
  }),
  simpleScenario({
    id: "email",
    label: "Email",
    question: "How should an irreversible send disclose consequence?",
    anchorId: "message:draft",
    anchorType: "message",
    anchorLabel: "Launch update",
    relatedId: "recipient:team",
    relation: "addressed-to",
    knowledgeKey: "message:draft.status",
    value: "draft",
    verb: "Send message",
    next: "sent",
    reversibility: "irreversible",
    risk: 0.48,
    impact: 0.62,
    uncertainty: 0.05,
    externalDependency: 0.55,
  }),
  simpleScenario({
    id: "erp",
    label: "ERP",
    question: "Can authority-heavy approval use the same grammar?",
    anchorId: "order:po-42",
    anchorType: "purchase-order",
    anchorLabel: "PO-42",
    relatedId: "vendor:acme",
    relation: "ordered-from",
    knowledgeKey: "order:po-42.status",
    value: "pending",
    verb: "Approve order",
    next: "approved",
    reversibility: "compensatable",
    risk: 0.42,
    impact: 0.58,
    uncertainty: 0.08,
    authorityCost: 0.5,
  }),
  deployScenario(),
  simpleScenario({
    id: "ai",
    label: "AI",
    question: "Can an AI proposal stay separate from human commitment?",
    anchorId: "change:42",
    anchorType: "proposed-change",
    anchorLabel: "Generated refactor",
    relatedId: "agent:builder",
    relation: "proposed-by",
    knowledgeKey: "change:42.reviewState",
    value: "proposed",
    verb: "Accept proposed change",
    next: "accepted",
    reversibility: "reversible",
    risk: 0.32,
    impact: 0.46,
    uncertainty: 0.3,
  }),
];

function transferScenario(): LabScenario {
  const possibilityId = "possibility:transfer-14200";
  const situation: Situation = {
    id: "situation:transfer-14200",
    anchor: { id: "account:A", type: "bank-account" },
    entities: [
      {
        id: "account:A",
        type: "bank-account",
        state: { name: "Operations Account", balance: 50000, currency: "USD" },
      },
      {
        id: "account:B",
        type: "bank-account",
        state: { name: "Settlement Account", balance: 10000, currency: "USD" },
      },
    ],
    relations: [
      {
        from: "account:A",
        type: "transfers-to",
        to: "account:B",
        strength: 0.92,
      },
    ],
    observations: [],
    expectations: [],
    knowledge: [
      {
        id: "knowledge:a-balance",
        key: "account:A.balance",
        value: 50000,
        epistemic: "fact",
        certainty: 1,
      },
      {
        id: "knowledge:b-balance",
        key: "account:B.balance",
        value: 10000,
        epistemic: "fact",
        certainty: 1,
      },
      {
        id: "knowledge:settlement-time",
        key: "transfer.settlement.estimate",
        value: "~10 min",
        epistemic: "estimate",
        certainty: 0.72,
      },
    ],
    possibilities: [
      {
        id: possibilityId,
        verb: "Transfer $14,200",
        subject: { id: "account:A", type: "bank-account" },
        constraints: [
          {
            id: "constraint:sufficient-balance",
            knowledgeKey: "account:A.balance",
            operator: "gte",
            expected: 14212,
          },
        ],
        authority: [{ capability: "intend" }],
        consequence: {
          effects: [
            {
              id: "effect:source-balance",
              entity: "account:A",
              property: "balance",
              from: 50000,
              to: 35788,
              description: "Operations Account balance",
            },
            {
              id: "effect:destination-balance",
              entity: "account:B",
              property: "balance",
              from: 10000,
              to: 24200,
              description: "Settlement Account balance",
            },
            {
              id: "effect:fee",
              entity: "account:A",
              property: "transferFee",
              from: 0,
              to: 12,
              description: "Transfer fee",
            },
          ],
          reversibility: "compensatable",
          risk: 0.55,
          impact: 0.68,
          uncertainty: 0.18,
        },
      },
    ],
    now: "2026-08-25T01:31:00+07:00",
  };

  return {
    id: "banking",
    label: "Banking",
    question: "Can money movement remain truthful under uncertainty?",
    actor: human,
    situation,
    temporalRecords: [ambiguousTransferHistory()],
    authorityRules: [
      {
        id: "rule:human-transfer",
        effect: "allow",
        capabilities: ["intend", "commit"],
        actors: { ids: [human.id] },
        scope: { subjectIds: ["account:A"] },
      },
    ],
    consequenceContext: {
      [possibilityId]: {
        derivedRisk: 0.48,
        policyRisk: 0.35,
        externalDependency: 0.72,
        authorityCost: 0.2,
      },
    },
  };
}

function deployScenario(): LabScenario {
  const scenario = simpleScenario({
    id: "deploy",
    label: "Deploy",
    question: "How does partial external risk increase trace demand?",
    anchorId: "service:api",
    anchorType: "service",
    anchorLabel: "Public API",
    relatedId: "environment:prod",
    relation: "deployed-to",
    knowledgeKey: "service:api.health",
    value: "green",
    verb: "Deploy v42",
    next: "v42",
    reversibility: "compensatable",
    risk: 0.72,
    impact: 0.84,
    uncertainty: 0.28,
    externalDependency: 0.82,
  });

  return {
    ...scenario,
    temporalRecords: [partialDeployHistory()],
  };
}

function ambiguousTransferHistory(): TemporalRecord {
  return {
    version: "0",
    id: "temporal:transfer-14200",
    transitionId: "transition:transfer-14200",
    intentId: "intent:transfer-14200",
    actorId: human.id,
    prediction: [
      temporalFact("prediction:a", "prediction", "2026-08-25T01:32:00+07:00", "account:A", "balance", 35788, "estimate", ["prediction:transfer"], []),
      temporalFact("prediction:b", "prediction", "2026-08-25T01:32:00+07:00", "account:B", "balance", 24200, "estimate", ["prediction:transfer"], []),
    ],
    observations: [
      temporalFact("observation:a", "observation", "2026-08-25T01:32:11+07:00", "account:A", "balance", 35788, "claim", ["obs:ledger-a", "ledger-primary"], ["evidence:ledger-a"]),
      temporalFact("observation:b", "observation", "2026-08-25T01:32:11+07:00", "account:B", "balance", undefined, "unknown", ["obs:settlement-timeout", "settlement-network"], ["evidence:timeout"]),
    ],
    reconciliations: [],
    witness: {
      id: "witness:transfer-14200",
      phase: "witness",
      at: "2026-08-25T01:32:11+07:00",
      status: "partial",
    },
    retry: {
      status: "blocked",
      witnessId: "witness:transfer-14200",
      reason: "OUTCOME_UNRESOLVED",
      requiredAction: "reconcile-before-retry",
    },
    reconciliationIds: [],
  };
}

function partialDeployHistory(): TemporalRecord {
  return {
    version: "0",
    id: "temporal:deploy-v42",
    transitionId: "transition:deploy-v42",
    intentId: "intent:deploy-v42",
    actorId: human.id,
    prediction: [
      temporalFact("prediction:deploy", "prediction", "2026-08-25T01:36:00+07:00", "service:api", "version", "v42", "estimate", ["prediction:deploy-v42"], []),
    ],
    observations: [
      temporalFact("observation:fleet-a", "observation", "2026-08-25T01:37:20+07:00", "service:api", "fleet-a", "v42", "claim", ["obs:fleet-a"], ["evidence:fleet-a"]),
      temporalFact("observation:fleet-b", "observation", "2026-08-25T01:37:20+07:00", "service:api", "fleet-b", "v41", "claim", ["obs:fleet-b"], ["evidence:fleet-b"]),
    ],
    reconciliations: [],
    witness: {
      id: "witness:deploy-v42",
      phase: "witness",
      at: "2026-08-25T01:37:20+07:00",
      status: "partial",
    },
    retry: {
      status: "blocked",
      witnessId: "witness:deploy-v42",
      reason: "OUTCOME_UNRESOLVED",
      requiredAction: "reconcile-before-retry",
    },
    reconciliationIds: [],
  };
}

function temporalFact(
  id: string,
  phase: "prediction" | "observation" | "reconciliation",
  at: string,
  entity: string,
  property: string,
  value: unknown,
  epistemic: "fact" | "derived" | "estimate" | "claim" | "uncertain" | "conflicted" | "unknown",
  sourceIds: string[],
  evidenceIds: string[],
) {
  return {
    id,
    phase,
    at,
    entity,
    property,
    value,
    epistemic,
    sourceIds,
    evidenceIds,
  };
}

function simpleScenario(input: {
  id: string;
  label: string;
  question: string;
  anchorId: string;
  anchorType: string;
  anchorLabel: string;
  relatedId: string;
  relation: string;
  knowledgeKey: string;
  value: string;
  verb: string;
  next: string;
  reversibility:
    | "reversible"
    | "temporarily-reversible"
    | "compensatable"
    | "irreversible";
  risk: number;
  impact: number;
  uncertainty: number;
  externalDependency?: number;
  authorityCost?: number;
}): LabScenario {
  const possibilityId = `possibility:${input.id}`;
  const situation: Situation = {
    id: `situation:${input.id}`,
    anchor: { id: input.anchorId, type: input.anchorType },
    entities: [
      {
        id: input.anchorId,
        type: input.anchorType,
        state: { name: input.anchorLabel, status: input.value },
      },
      {
        id: input.relatedId,
        type: "related-subject",
        state: { name: input.relatedId },
      },
    ],
    relations: [
      {
        from: input.anchorId,
        type: input.relation,
        to: input.relatedId,
        strength: 0.86,
      },
    ],
    observations: [],
    expectations: [],
    knowledge: [
      {
        id: `knowledge:${input.id}`,
        key: input.knowledgeKey,
        value: input.value,
        epistemic: "fact",
        certainty: 1,
      },
    ],
    possibilities: [
      {
        id: possibilityId,
        verb: input.verb,
        subject: { id: input.anchorId, type: input.anchorType },
        constraints: [
          {
            id: `constraint:${input.id}`,
            knowledgeKey: input.knowledgeKey,
            operator: "equals",
            expected: input.value,
          },
        ],
        authority: [{ capability: "intend" }],
        consequence: {
          effects: [
            {
              id: `effect:${input.id}`,
              entity: input.anchorId,
              property: "status",
              from: input.value,
              to: input.next,
              description: `${input.anchorLabel} state`,
            },
          ],
          reversibility: input.reversibility,
          risk: input.risk,
          impact: input.impact,
          uncertainty: input.uncertainty,
        },
      },
    ],
    now: "2026-08-25T01:31:00+07:00",
  };

  return {
    id: input.id,
    label: input.label,
    question: input.question,
    actor: human,
    situation,
    authorityRules: [
      {
        id: `rule:${input.id}:intend`,
        effect: "allow",
        capabilities: ["intend"],
        actors: { ids: [human.id] },
        scope: { subjectIds: [input.anchorId] },
      },
    ],
    consequenceContext: {
      [possibilityId]: {
        externalDependency: input.externalDependency ?? 0,
        authorityCost: input.authorityCost ?? 0,
      },
    },
  };
}
