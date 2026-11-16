import type { RetryAssessment, TemporalRecord } from "allah-crayon-kernel";
export * from "./integrity.js";

export type TemporalStoreErrorCode =
  | "INVALID_RECORD"
  | "DUPLICATE_RECORD_ID";

export class TemporalStoreError extends Error {
  readonly code: TemporalStoreErrorCode;
  readonly recordId?: string;

  constructor(code: TemporalStoreErrorCode, message: string, recordId?: string) {
    super(message);
    this.name = "TemporalStoreError";
    this.code = code;
    this.recordId = recordId;
  }
}

export interface TemporalStoreQuery {
  transitionId?: string;
  intentId?: string;
  actorId?: string;
}

export interface TemporalStore {
  append(record: TemporalRecord): Promise<TemporalRecord>;
  get(recordId: string): Promise<TemporalRecord | undefined>;
  list(query?: TemporalStoreQuery): Promise<readonly TemporalRecord[]>;
}

export function createMemoryTemporalStore(): TemporalStore {
  const records = new Map<string, TemporalRecord>();
  const order: string[] = [];

  return Object.freeze({
    async append(record: TemporalRecord): Promise<TemporalRecord> {
      validateRecord(record);
      if (records.has(record.id)) {
        throw new TemporalStoreError(
          "DUPLICATE_RECORD_ID",
          `Temporal record ${record.id} already exists; append-only history cannot replace it.`,
          record.id,
        );
      }

      const stored = freezeClone(record);
      records.set(stored.id, stored);
      order.push(stored.id);
      return stored;
    },

    async get(recordId: string): Promise<TemporalRecord | undefined> {
      return records.get(recordId);
    },

    async list(query: TemporalStoreQuery = {}): Promise<readonly TemporalRecord[]> {
      const result = order
        .map((id) => records.get(id))
        .filter((record): record is TemporalRecord => record !== undefined)
        .filter((record) =>
          (query.transitionId === undefined || record.transitionId === query.transitionId)
          && (query.intentId === undefined || record.intentId === query.intentId)
          && (query.actorId === undefined || record.actorId === query.actorId),
        );
      return Object.freeze(result);
    },
  });
}

export interface TemporalJournalEntry {
  version: "0";
  sequence: number;
  record: TemporalRecord;
}

export type TemporalJournalInvalidReason =
  | "INCOMPLETE_ENTRY"
  | "SEQUENCE_MISMATCH"
  | "DUPLICATE_RECORD_ID";

export type TemporalJournalVerification =
  | {
      valid: true;
      count: number;
      lastSequence: number | null;
    }
  | {
      valid: false;
      reason: TemporalJournalInvalidReason;
      index: number;
      explanation: string;
    };

export interface TemporalJournal {
  append(record: TemporalRecord): Promise<TemporalJournalEntry>;
  entries(): Promise<readonly TemporalJournalEntry[]>;
  verify(): Promise<TemporalJournalVerification>;
  store: TemporalStore;
}

export interface TemporalReplayTransition {
  transitionId: string;
  recordIds: readonly string[];
  intentIds: readonly string[];
  latestRecordId: string;
  witnessStatus: TemporalRecord["witness"]["status"];
  retry: TemporalRecord["retry"];
  reconciliationIds: readonly string[];
}

export type TemporalReplayResult =
  | {
      valid: true;
      recordCount: number;
      transitions: readonly TemporalReplayTransition[];
    }
  | {
      valid: false;
      verification: Extract<TemporalJournalVerification, { valid: false }>;
    };

export type TemporalRestoreResult =
  | {
      restored: true;
      journal: TemporalJournal;
      replay: Extract<TemporalReplayResult, { valid: true }>;
    }
  | {
      restored: false;
      replay: Extract<TemporalReplayResult, { valid: false }>;
    };

export function createTemporalJournal(store: TemporalStore = createMemoryTemporalStore()): TemporalJournal {
  const journalEntries: TemporalJournalEntry[] = [];

  return Object.freeze({
    store,

    async append(record: TemporalRecord): Promise<TemporalJournalEntry> {
      const stored = await store.append(record);
      const entry = deepFreeze({
        version: "0" as const,
        sequence: journalEntries.length,
        record: stored,
      });
      journalEntries.push(entry);
      return entry;
    },

    async entries(): Promise<readonly TemporalJournalEntry[]> {
      return Object.freeze([...journalEntries]);
    },

    async verify(): Promise<TemporalJournalVerification> {
      return verifyTemporalJournal(journalEntries);
    },
  });
}

export function verifyTemporalJournal(entries: readonly unknown[]): TemporalJournalVerification {
  const recordIds = new Set<string>();

  for (let index = 0; index < entries.length; index += 1) {
    const candidate = entries[index];
    if (!isJournalEntryShape(candidate)) {
      return {
        valid: false,
        reason: "INCOMPLETE_ENTRY",
        index,
        explanation: `Journal entry ${index} is incomplete or has an unsupported version.`,
      };
    }

    if (candidate.sequence !== index) {
      return {
        valid: false,
        reason: "SEQUENCE_MISMATCH",
        index,
        explanation: `Journal entry ${index} declares sequence ${candidate.sequence}; expected ${index}.`,
      };
    }

    if (recordIds.has(candidate.record.id)) {
      return {
        valid: false,
        reason: "DUPLICATE_RECORD_ID",
        index,
        explanation: `Temporal record ${candidate.record.id} appears more than once in the journal.`,
      };
    }
    recordIds.add(candidate.record.id);
  }

  return {
    valid: true,
    count: entries.length,
    lastSequence: entries.length === 0 ? null : entries.length - 1,
  };
}

export function replayTemporalJournal(entries: readonly unknown[]): TemporalReplayResult {
  const verification = verifyTemporalJournal(entries);
  if (!verification.valid) return { valid: false, verification };

  const groups = new Map<string, {
    transitionId: string;
    recordIds: string[];
    intentIds: string[];
    latest: TemporalRecord;
  }>();

  for (const entry of entries as readonly TemporalJournalEntry[]) {
    const current = groups.get(entry.record.transitionId);
    if (!current) {
      groups.set(entry.record.transitionId, {
        transitionId: entry.record.transitionId,
        recordIds: [entry.record.id],
        intentIds: [entry.record.intentId],
        latest: entry.record,
      });
      continue;
    }

    current.recordIds.push(entry.record.id);
    if (!current.intentIds.includes(entry.record.intentId)) current.intentIds.push(entry.record.intentId);
    current.latest = entry.record;
  }

  const transitions = [...groups.values()].map((group) => deepFreeze({
    transitionId: group.transitionId,
    recordIds: [...group.recordIds],
    intentIds: [...group.intentIds],
    latestRecordId: group.latest.id,
    witnessStatus: group.latest.witness.status,
    retry: freezeClone(group.latest.retry),
    reconciliationIds: [...group.latest.reconciliationIds],
  }));

  return deepFreeze({
    valid: true as const,
    recordCount: entries.length,
    transitions,
  });
}

export async function restoreTemporalJournal(entries: readonly unknown[]): Promise<TemporalRestoreResult> {
  const replay = replayTemporalJournal(entries);
  if (!replay.valid) return { restored: false, replay };

  const journal = createTemporalJournal();
  for (const entry of entries as readonly TemporalJournalEntry[]) {
    await journal.append(entry.record);
  }

  return {
    restored: true,
    journal,
    replay,
  };
}

export interface ExternalOperationIdentity {
  version: "0";
  id: string;
  idempotencyKey: string;
  transitionId: string;
  intentId: string;
  createdAt: string;
}

export type ExternalOperationPhase = "reserved" | "dispatched" | "observation-linked";

export interface ExternalOperationRecord {
  identity: ExternalOperationIdentity;
  phase: ExternalOperationPhase;
  dispatchedAt?: string;
  temporalRecordIds: readonly string[];
  latestRetry?: RetryAssessment;
}

export type ExternalOperationRegistryErrorCode =
  | "INVALID_OPERATION_IDENTITY"
  | "OPERATION_ID_CONFLICT"
  | "IDEMPOTENCY_KEY_CONFLICT"
  | "OPERATION_NOT_FOUND"
  | "OPERATION_ALREADY_DISPATCHED"
  | "TEMPORAL_IDENTITY_MISMATCH";

export class ExternalOperationRegistryError extends Error {
  readonly code: ExternalOperationRegistryErrorCode;
  readonly operationId?: string;

  constructor(code: ExternalOperationRegistryErrorCode, message: string, operationId?: string) {
    super(message);
    this.name = "ExternalOperationRegistryError";
    this.code = code;
    this.operationId = operationId;
  }
}

export type ExternalOperationAttemptAssessment =
  | {
      status: "new-operation";
      allowed: true;
      reason: "IDEMPOTENCY_KEY_UNUSED";
    }
  | {
      status: "resume-reservation";
      allowed: true;
      operationId: string;
      reason: "RESERVED_NOT_DISPATCHED";
    }
  | {
      status: "blocked";
      allowed: false;
      operationId: string;
      reason: "AWAITING_OBSERVATION" | "OUTCOME_UNRESOLVED" | "OUTCOME_CONFLICTED";
    }
  | {
      status: "unnecessary";
      allowed: false;
      operationId: string;
      reason: "OUTCOME_VERIFIED";
    }
  | {
      status: "conflict";
      allowed: false;
      operationId: string;
      reason: "IDEMPOTENCY_KEY_CONFLICT";
    };

export interface ExternalOperationRegistry {
  reserve(identity: ExternalOperationIdentity): Promise<ExternalOperationRecord>;
  markDispatched(operationId: string, dispatchedAt: string): Promise<ExternalOperationRecord>;
  linkTemporalRecord(operationId: string, record: TemporalRecord): Promise<ExternalOperationRecord>;
  get(operationId: string): Promise<ExternalOperationRecord | undefined>;
  getByIdempotencyKey(idempotencyKey: string): Promise<ExternalOperationRecord | undefined>;
  assessAttempt(identity: ExternalOperationIdentity): Promise<ExternalOperationAttemptAssessment>;
  list(): Promise<readonly ExternalOperationRecord[]>;
}

export function createMemoryExternalOperationRegistry(): ExternalOperationRegistry {
  const byId = new Map<string, ExternalOperationRecord>();
  const idByKey = new Map<string, string>();
  const order: string[] = [];

  function existingByKey(key: string): ExternalOperationRecord | undefined {
    const id = idByKey.get(key);
    return id ? byId.get(id) : undefined;
  }

  return Object.freeze({
    async reserve(identity: ExternalOperationIdentity): Promise<ExternalOperationRecord> {
      validateExternalOperationIdentity(identity);
      const sameId = byId.get(identity.id);
      if (sameId) {
        if (!sameExternalOperationIdentity(sameId.identity, identity)) {
          throw new ExternalOperationRegistryError(
            "OPERATION_ID_CONFLICT",
            `External operation ${identity.id} is already bound to different semantic identity.`,
            identity.id,
          );
        }
        return sameId;
      }

      const sameKey = existingByKey(identity.idempotencyKey);
      if (sameKey) {
        if (!sameExternalOperationIdentity(sameKey.identity, identity)) {
          throw new ExternalOperationRegistryError(
            "IDEMPOTENCY_KEY_CONFLICT",
            `Idempotency key ${identity.idempotencyKey} is already bound to another operation/transition/intent.`,
            sameKey.identity.id,
          );
        }
        return sameKey;
      }

      const record = deepFreeze({
        identity: freezeClone(identity),
        phase: "reserved" as const,
        temporalRecordIds: [] as string[],
      });
      byId.set(identity.id, record);
      idByKey.set(identity.idempotencyKey, identity.id);
      order.push(identity.id);
      return record;
    },

    async markDispatched(operationId: string, dispatchedAt: string): Promise<ExternalOperationRecord> {
      const existing = byId.get(operationId);
      if (!existing) throw operationNotFound(operationId);
      if (!validTime(dispatchedAt)) {
        throw new ExternalOperationRegistryError(
          "INVALID_OPERATION_IDENTITY",
          "External dispatch time must be a valid timestamp.",
          operationId,
        );
      }
      if (existing.phase !== "reserved") {
        throw new ExternalOperationRegistryError(
          "OPERATION_ALREADY_DISPATCHED",
          `External operation ${operationId} was already dispatched; obtain/reconcile observations before another attempt.`,
          operationId,
        );
      }

      const updated = deepFreeze({
        ...existing,
        phase: "dispatched" as const,
        dispatchedAt,
      });
      byId.set(operationId, updated);
      return updated;
    },

    async linkTemporalRecord(operationId: string, record: TemporalRecord): Promise<ExternalOperationRecord> {
      const existing = byId.get(operationId);
      if (!existing) throw operationNotFound(operationId);
      validateRecord(record);
      if (record.transitionId !== existing.identity.transitionId || record.intentId !== existing.identity.intentId) {
        throw new ExternalOperationRegistryError(
          "TEMPORAL_IDENTITY_MISMATCH",
          `Temporal record ${record.id} does not belong to external operation ${operationId}.`,
          operationId,
        );
      }

      const temporalRecordIds = existing.temporalRecordIds.includes(record.id)
        ? [...existing.temporalRecordIds]
        : [...existing.temporalRecordIds, record.id];
      const updated = deepFreeze({
        ...existing,
        phase: "observation-linked" as const,
        temporalRecordIds,
        latestRetry: freezeClone(record.retry),
      });
      byId.set(operationId, updated);
      return updated;
    },

    async get(operationId: string): Promise<ExternalOperationRecord | undefined> {
      return byId.get(operationId);
    },

    async getByIdempotencyKey(idempotencyKey: string): Promise<ExternalOperationRecord | undefined> {
      return existingByKey(idempotencyKey);
    },

    async assessAttempt(identity: ExternalOperationIdentity): Promise<ExternalOperationAttemptAssessment> {
      validateExternalOperationIdentity(identity);
      const existing = existingByKey(identity.idempotencyKey);
      if (!existing) return { status: "new-operation", allowed: true, reason: "IDEMPOTENCY_KEY_UNUSED" };
      if (!sameExternalOperationIdentity(existing.identity, identity)) {
        return {
          status: "conflict",
          allowed: false,
          operationId: existing.identity.id,
          reason: "IDEMPOTENCY_KEY_CONFLICT",
        };
      }
      if (existing.phase === "reserved") {
        return {
          status: "resume-reservation",
          allowed: true,
          operationId: existing.identity.id,
          reason: "RESERVED_NOT_DISPATCHED",
        };
      }
      if (!existing.latestRetry) {
        return {
          status: "blocked",
          allowed: false,
          operationId: existing.identity.id,
          reason: "AWAITING_OBSERVATION",
        };
      }
      if (existing.latestRetry.status === "unnecessary") {
        return {
          status: "unnecessary",
          allowed: false,
          operationId: existing.identity.id,
          reason: "OUTCOME_VERIFIED",
        };
      }
      return {
        status: "blocked",
        allowed: false,
        operationId: existing.identity.id,
        reason: existing.latestRetry.reason,
      };
    },

    async list(): Promise<readonly ExternalOperationRecord[]> {
      return Object.freeze(order.map((id) => byId.get(id)).filter((record): record is ExternalOperationRecord => Boolean(record)));
    },
  });
}

function validateRecord(record: TemporalRecord): void {
  const candidate = record as Partial<TemporalRecord> | null | undefined;
  const valid = candidate !== null
    && candidate !== undefined
    && candidate.version === "0"
    && nonEmpty(candidate.id)
    && nonEmpty(candidate.transitionId)
    && nonEmpty(candidate.intentId)
    && nonEmpty(candidate.actorId)
    && Array.isArray(candidate.prediction)
    && Array.isArray(candidate.observations)
    && Array.isArray(candidate.reconciliations)
    && candidate.witness !== undefined
    && Array.isArray(candidate.reconciliationIds);

  if (!valid) {
    throw new TemporalStoreError(
      "INVALID_RECORD",
      "TemporalStore accepts only complete TemporalRecord version 0 values.",
      candidate?.id,
    );
  }
}

function validateExternalOperationIdentity(identity: ExternalOperationIdentity): void {
  const valid = identity?.version === "0"
    && nonEmpty(identity.id)
    && nonEmpty(identity.idempotencyKey)
    && nonEmpty(identity.transitionId)
    && nonEmpty(identity.intentId)
    && validTime(identity.createdAt);
  if (!valid) {
    throw new ExternalOperationRegistryError(
      "INVALID_OPERATION_IDENTITY",
      "External operation requires version 0, stable operation/idempotency/transition/intent identities, and valid createdAt.",
      identity?.id,
    );
  }
}

function sameExternalOperationIdentity(left: ExternalOperationIdentity, right: ExternalOperationIdentity): boolean {
  return left.id === right.id
    && left.idempotencyKey === right.idempotencyKey
    && left.transitionId === right.transitionId
    && left.intentId === right.intentId;
}

function operationNotFound(operationId: string): ExternalOperationRegistryError {
  return new ExternalOperationRegistryError(
    "OPERATION_NOT_FOUND",
    `External operation ${operationId} is not reserved in this registry.`,
    operationId,
  );
}

function isJournalEntryShape(value: unknown): value is TemporalJournalEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<TemporalJournalEntry>;
  if (entry.version !== "0" || !Number.isInteger(entry.sequence) || !entry.record) return false;
  try {
    validateRecord(entry.record);
    return true;
  } catch {
    return false;
  }
}

function validTime(value: unknown): value is string {
  return nonEmpty(value) && Number.isFinite(Date.parse(value));
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function freezeClone<T>(value: T): T {
  return deepFreeze(structuredClone(value));
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return value;
}
