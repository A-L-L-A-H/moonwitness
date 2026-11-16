import type { Consequence, Situation } from "allah-crayon-kernel";
import { defineDomainAdapter, type DomainAdapter } from "./index.js";

interface ReferenceBaseInput {
  situationId: string;
  entityId: string;
  entityType: string;
  state: Record<string, unknown>;
  observationProperty: string;
  observationValue?: unknown;
  observationSource: string;
  possibilityId: string;
  verb: string;
  consequence: Consequence;
}

function situationFromReference(input: ReferenceBaseInput, now: string): Situation {
  const observationId = `observation:${input.situationId}`;
  return {
    id: input.situationId,
    anchor: { id: input.entityId, type: input.entityType },
    entities: [{ id: input.entityId, type: input.entityType, state: structuredClone(input.state) }],
    relations: [],
    observations: [{
      id: observationId,
      subject: { id: input.entityId, type: input.entityType },
      property: input.observationProperty,
      value: input.observationValue,
      observedAt: now,
      source: input.observationSource,
      reliability: 1,
    }],
    expectations: [],
    knowledge: [{
      id: `knowledge:${input.situationId}`,
      key: `${input.entityId}.${input.observationProperty}`,
      value: input.observationValue,
      epistemic: "fact",
      certainty: 1,
      observations: [observationId],
    }],
    possibilities: [{
      id: input.possibilityId,
      verb: input.verb,
      subject: { id: input.entityId, type: input.entityType },
      consequence: structuredClone(input.consequence),
    }],
    now,
  };
}

export interface BankingReferenceInput {
  accountId: string;
  balance: number;
  transferAmount: number;
  destinationId: string;
}

export const bankingReferenceAdapter: DomainAdapter<BankingReferenceInput> = defineDomainAdapter({
  id: "reference:banking",
  adapt(input, context) {
    return situationFromReference({
      situationId: `situation:banking:${input.accountId}`,
      entityId: input.accountId,
      entityType: "account",
      state: { balance: input.balance, destinationId: input.destinationId },
      observationProperty: "balance",
      observationValue: input.balance,
      observationSource: "banking-reference",
      possibilityId: `possibility:transfer:${input.accountId}`,
      verb: "transfer",
      consequence: {
        effects: [{ id: `effect:debit:${input.accountId}`, entity: input.accountId, property: "balance", from: input.balance, to: input.balance - input.transferAmount, delta: -input.transferAmount }],
        reversibility: "compensatable",
        risk: 0.6,
        impact: 0.7,
        uncertainty: 0.2,
      },
    }, context.now);
  },
});

export interface FileReferenceInput { path: string; exists: boolean; recursive: boolean; }
export const fileReferenceAdapter: DomainAdapter<FileReferenceInput> = defineDomainAdapter({
  id: "reference:files",
  adapt(input, context) {
    return situationFromReference({
      situationId: `situation:file:${input.path}`,
      entityId: `file:${input.path}`,
      entityType: "file",
      state: { path: input.path, exists: input.exists, recursive: input.recursive },
      observationProperty: "exists",
      observationValue: input.exists,
      observationSource: "filesystem-reference",
      possibilityId: `possibility:delete:${input.path}`,
      verb: "delete",
      consequence: {
        effects: [{ id: `effect:delete:${input.path}`, entity: `file:${input.path}`, property: "exists", from: input.exists, to: false }],
        reversibility: "temporarily-reversible",
        risk: input.recursive ? 0.8 : 0.4,
        impact: input.recursive ? 0.8 : 0.4,
        uncertainty: 0.1,
      },
    }, context.now);
  },
});

export interface EmailReferenceInput { messageId: string; draft: boolean; recipient: string; }
export const emailReferenceAdapter: DomainAdapter<EmailReferenceInput> = defineDomainAdapter({
  id: "reference:email",
  adapt(input, context) {
    return situationFromReference({
      situationId: `situation:email:${input.messageId}`,
      entityId: `message:${input.messageId}`,
      entityType: "message",
      state: { draft: input.draft, recipient: input.recipient },
      observationProperty: "draft",
      observationValue: input.draft,
      observationSource: "mail-reference",
      possibilityId: `possibility:send:${input.messageId}`,
      verb: "send",
      consequence: {
        effects: [{ id: `effect:sent:${input.messageId}`, entity: `message:${input.messageId}`, property: "draft", from: input.draft, to: false }],
        reversibility: "irreversible",
        risk: 0.5,
        impact: 0.5,
        uncertainty: 0.05,
      },
    }, context.now);
  },
});

export interface ERPReferenceInput { requestId: string; stage: string; approved: boolean; }
export const erpReferenceAdapter: DomainAdapter<ERPReferenceInput> = defineDomainAdapter({
  id: "reference:erp",
  adapt(input, context) {
    return situationFromReference({
      situationId: `situation:erp:${input.requestId}`,
      entityId: `approval:${input.requestId}`,
      entityType: "approval-request",
      state: { stage: input.stage, approved: input.approved },
      observationProperty: "stage",
      observationValue: input.stage,
      observationSource: "erp-reference",
      possibilityId: `possibility:advance:${input.requestId}`,
      verb: "advance-approval",
      consequence: {
        effects: [{ id: `effect:stage:${input.requestId}`, entity: `approval:${input.requestId}`, property: "stage", from: input.stage, to: "next" }],
        reversibility: "compensatable",
        risk: 0.4,
        impact: 0.6,
        uncertainty: 0.2,
      },
    }, context.now);
  },
});

export interface DevOpsReferenceInput { serviceId: string; version: string; targetVersion: string; healthy: boolean; }
export const devopsReferenceAdapter: DomainAdapter<DevOpsReferenceInput> = defineDomainAdapter({
  id: "reference:devops",
  adapt(input, context) {
    return situationFromReference({
      situationId: `situation:deploy:${input.serviceId}`,
      entityId: `service:${input.serviceId}`,
      entityType: "service",
      state: { version: input.version, healthy: input.healthy },
      observationProperty: "version",
      observationValue: input.version,
      observationSource: "deploy-reference",
      possibilityId: `possibility:deploy:${input.serviceId}`,
      verb: "deploy",
      consequence: {
        effects: [{ id: `effect:version:${input.serviceId}`, entity: `service:${input.serviceId}`, property: "version", from: input.version, to: input.targetVersion }],
        reversibility: "compensatable",
        risk: 0.6,
        impact: 0.8,
        uncertainty: input.healthy ? 0.15 : 0.5,
      },
    }, context.now);
  },
});

export interface AIReferenceInput { proposalId: string; proposedAction: string; humanCommitted: boolean; }
export const aiReferenceAdapter: DomainAdapter<AIReferenceInput> = defineDomainAdapter({
  id: "reference:ai",
  adapt(input, context) {
    return situationFromReference({
      situationId: `situation:ai:${input.proposalId}`,
      entityId: `proposal:${input.proposalId}`,
      entityType: "proposal",
      state: { proposedAction: input.proposedAction, humanCommitted: input.humanCommitted },
      observationProperty: "humanCommitted",
      observationValue: input.humanCommitted,
      observationSource: "ai-reference",
      possibilityId: `possibility:accept:${input.proposalId}`,
      verb: "accept-proposal",
      consequence: {
        effects: [{ id: `effect:commit:${input.proposalId}`, entity: `proposal:${input.proposalId}`, property: "humanCommitted", from: input.humanCommitted, to: true }],
        reversibility: "compensatable",
        risk: 0.5,
        impact: 0.6,
        uncertainty: 0.3,
      },
    }, context.now);
  },
});

export const referenceDomainAdapters = Object.freeze([
  bankingReferenceAdapter,
  fileReferenceAdapter,
  emailReferenceAdapter,
  erpReferenceAdapter,
  devopsReferenceAdapter,
  aiReferenceAdapter,
]);
