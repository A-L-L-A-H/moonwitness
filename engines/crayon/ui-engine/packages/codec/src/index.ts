import {
  assertSemanticSnapshotV0,
  type SemanticSnapshot,
} from "allah-crayon-snapshot";
import { assertRIRV0, type RIRDocument } from "allah-crayon-rir";

export type SemanticArtifactKind = "snapshot" | "rir";
export type SemanticEnvelopeVersion = "0" | "1";

export interface SemanticEnvelope<T> {
  envelopeVersion: SemanticEnvelopeVersion;
  kind: SemanticArtifactKind;
  semanticVersion: string;
  payload: T;
}

export interface CodecResourcePolicy {
  maxBytes?: number;
  maxDepth?: number;
  maxCollectionItems?: number;
  maxObjectKeys?: number;
}

const DEFAULT_RESOURCE_POLICY = Object.freeze({
  maxBytes: 2 * 1024 * 1024,
  maxDepth: 64,
  maxCollectionItems: 100_000,
  maxObjectKeys: 100_000,
});

export type CodecReasonCode =
  | "INVALID_JSON"
  | "ENVELOPE_NOT_OBJECT"
  | "UNSUPPORTED_ENVELOPE_VERSION"
  | "UNSUPPORTED_ARTIFACT_KIND"
  | "KIND_MISMATCH"
  | "SEMANTIC_VERSION_MISMATCH"
  | "UNSUPPORTED_SEMANTIC_VERSION"
  | "PAYLOAD_TOO_LARGE"
  | "PAYLOAD_TOO_DEEP"
  | "COLLECTION_TOO_LARGE"
  | "OBJECT_TOO_LARGE"
  | "UNSUPPORTED_CANONICAL_VALUE"
  | "CYCLIC_CANONICAL_VALUE"
  | "INVALID_CANONICAL_NODE"
  | "MIGRATION_PATH_MISSING"
  | "MIGRATION_OUTPUT_INVALID";

export class SemanticCodecError extends Error {
  readonly code: CodecReasonCode;
  readonly path?: string;

  constructor(code: CodecReasonCode, message: string, path?: string) {
    super(message);
    this.name = "SemanticCodecError";
    this.code = code;
    this.path = path;
  }
}

type CanonicalValue =
  | { type: "undefined" }
  | { type: "null" }
  | { type: "boolean"; value: boolean }
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "array"; value: CanonicalValue[] }
  | { type: "object"; value: Array<[string, CanonicalValue]> };

/**
 * Envelope v1 uses a fully tagged value tree. Because every semantic value is
 * encoded as a node, ordinary domain objects cannot collide with codec tags and
 * explicit `undefined` survives round-trip instead of disappearing through JSON.
 * Decoder support for v0 remains for already-persisted experimental fixtures.
 */
export function encodeSemanticSnapshot(snapshot: SemanticSnapshot): string {
  assertSemanticSnapshotV0(snapshot);
  return canonicalStringify({
    envelopeVersion: "1",
    kind: "snapshot",
    semanticVersion: snapshot.version,
    payload: encodeCanonicalValue(snapshot, "$.payload", new WeakSet<object>()),
  });
}

export function decodeSemanticSnapshot(serialized: string, policy: CodecResourcePolicy = {}): SemanticSnapshot {
  const envelope = decodeEnvelope(serialized, "snapshot", policy);
  if (envelope.semanticVersion !== String((envelope.payload as { version?: unknown }).version ?? "")) {
    throw new SemanticCodecError("SEMANTIC_VERSION_MISMATCH", "Snapshot envelope semanticVersion does not match payload.version.");
  }
  try {
    assertSemanticSnapshotV0(envelope.payload);
  } catch (error) {
    throw new SemanticCodecError("UNSUPPORTED_SEMANTIC_VERSION", error instanceof Error ? error.message : String(error));
  }
  return deepFreeze(structuredClone(envelope.payload));
}

export function encodeRIR(document: RIRDocument): string {
  assertRIRV0(document);
  return canonicalStringify({
    envelopeVersion: "1",
    kind: "rir",
    semanticVersion: document.version,
    payload: encodeCanonicalValue(document, "$.payload", new WeakSet<object>()),
  });
}

export function decodeRIR(serialized: string, policy: CodecResourcePolicy = {}): RIRDocument {
  const envelope = decodeEnvelope(serialized, "rir", policy);
  if (envelope.semanticVersion !== String((envelope.payload as { version?: unknown }).version ?? "")) {
    throw new SemanticCodecError("SEMANTIC_VERSION_MISMATCH", "RIR envelope semanticVersion does not match payload.version.");
  }
  try {
    assertRIRV0(envelope.payload);
  } catch (error) {
    throw new SemanticCodecError("UNSUPPORTED_SEMANTIC_VERSION", error instanceof Error ? error.message : String(error));
  }
  return deepFreeze(structuredClone(envelope.payload));
}

export interface MigrationStep<T = unknown> {
  kind: SemanticArtifactKind;
  from: string;
  to: string;
  migrate(value: T): unknown;
}

export interface MigrationRequest {
  kind: SemanticArtifactKind;
  from: string;
  to: string;
  value: unknown;
  validateTarget: (value: unknown) => void;
}

export interface MigrationRegistry {
  register(step: MigrationStep): void;
  migrate(args: MigrationRequest): unknown;
  list(kind?: SemanticArtifactKind): readonly Readonly<Pick<MigrationStep, "kind" | "from" | "to">>[];
}

export function createMigrationRegistry(): MigrationRegistry {
  const steps = new Map<string, MigrationStep>();

  return Object.freeze({
    register(step: MigrationStep): void {
      if (!nonEmpty(step.from) || !nonEmpty(step.to) || step.from === step.to) {
        throw new Error("Migration requires distinct non-empty from/to versions.");
      }
      const key = migrationKey(step.kind, step.from);
      if (steps.has(key)) throw new Error(`Migration from ${step.kind}@${step.from} is already registered.`);
      steps.set(key, Object.freeze({ ...step }));
    },

    migrate(args: MigrationRequest): unknown {
      if (args.from === args.to) {
        args.validateTarget(args.value);
        return deepFreeze(structuredClone(args.value));
      }
      let currentVersion = args.from;
      let currentValue = structuredClone(args.value);
      const visited = new Set<string>();
      while (currentVersion !== args.to) {
        if (visited.has(currentVersion)) {
          throw new SemanticCodecError("MIGRATION_PATH_MISSING", `Migration cycle detected at ${args.kind}@${currentVersion}.`);
        }
        visited.add(currentVersion);
        const step = steps.get(migrationKey(args.kind, currentVersion));
        if (!step) {
          throw new SemanticCodecError("MIGRATION_PATH_MISSING", `No explicit migration path from ${args.kind}@${currentVersion} to ${args.to}.`);
        }
        currentValue = step.migrate(currentValue);
        currentVersion = step.to;
      }
      try {
        args.validateTarget(currentValue);
      } catch (error) {
        throw new SemanticCodecError("MIGRATION_OUTPUT_INVALID", error instanceof Error ? error.message : String(error));
      }
      return deepFreeze(structuredClone(currentValue));
    },

    list(kind?: SemanticArtifactKind) {
      return Object.freeze([...steps.values()]
        .filter((step) => kind === undefined || step.kind === kind)
        .map((step) => Object.freeze({ kind: step.kind, from: step.from, to: step.to })));
    },
  });
}

/** Deterministic JSON for JSON-safe values. Unsupported/lossy JS values fail closed. */
export function canonicalStringify(value: unknown): string {
  assertCanonicalJsonSafe(value, "$", new WeakSet<object>());
  return JSON.stringify(sortCanonical(value));
}

function decodeEnvelope(serialized: string, expectedKind: SemanticArtifactKind, requestedPolicy: CodecResourcePolicy): SemanticEnvelope<unknown> {
  const policy = { ...DEFAULT_RESOURCE_POLICY, ...requestedPolicy };
  const bytes = new TextEncoder().encode(serialized).byteLength;
  if (bytes > policy.maxBytes) throw new SemanticCodecError("PAYLOAD_TOO_LARGE", `Serialized semantic artifact is ${bytes} bytes; limit is ${policy.maxBytes}.`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    throw new SemanticCodecError("INVALID_JSON", error instanceof Error ? error.message : String(error));
  }
  assertResourceLimits(parsed, policy);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SemanticCodecError("ENVELOPE_NOT_OBJECT", "Semantic envelope must be an object.");
  }
  const candidate = parsed as Partial<SemanticEnvelope<unknown>>;
  if (candidate.envelopeVersion !== "0" && candidate.envelopeVersion !== "1") {
    throw new SemanticCodecError("UNSUPPORTED_ENVELOPE_VERSION", `Unsupported envelope version ${String(candidate.envelopeVersion)}.`);
  }
  if (candidate.kind !== "snapshot" && candidate.kind !== "rir") {
    throw new SemanticCodecError("UNSUPPORTED_ARTIFACT_KIND", `Unsupported semantic artifact kind ${String(candidate.kind)}.`);
  }
  if (candidate.kind !== expectedKind) {
    throw new SemanticCodecError("KIND_MISMATCH", `Expected ${expectedKind} envelope, received ${candidate.kind}.`);
  }
  if (!nonEmpty(candidate.semanticVersion)) {
    throw new SemanticCodecError("SEMANTIC_VERSION_MISMATCH", "Semantic envelope requires semanticVersion.");
  }

  const payload = candidate.envelopeVersion === "1"
    ? decodeCanonicalValue(candidate.payload, "$.payload")
    : candidate.payload;
  return {
    envelopeVersion: candidate.envelopeVersion,
    kind: candidate.kind,
    semanticVersion: candidate.semanticVersion,
    payload,
  };
}

function encodeCanonicalValue(value: unknown, path: string, ancestors: WeakSet<object>): CanonicalValue {
  if (value === undefined) return { type: "undefined" };
  if (value === null) return { type: "null" };
  if (typeof value === "boolean") return { type: "boolean", value };
  if (typeof value === "string") return { type: "string", value };
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw unsupportedCanonical(path, "Non-finite numbers cannot be persisted canonically.");
    return { type: "number", value };
  }
  if (typeof value === "bigint" || typeof value === "function" || typeof value === "symbol") {
    throw unsupportedCanonical(path, `Unsupported canonical semantic value type: ${typeof value}.`);
  }
  if (!value || typeof value !== "object") throw unsupportedCanonical(path, "Unsupported canonical semantic value.");
  if (ancestors.has(value)) {
    throw new SemanticCodecError("CYCLIC_CANONICAL_VALUE", `Cyclic semantic value at ${path}.`, path);
  }
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    throw unsupportedCanonical(path, "Canonical semantic persistence accepts only arrays and plain objects.");
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return {
        type: "array",
        value: value.map((item, index) => encodeCanonicalValue(item, `${path}[${index}]`, ancestors)),
      };
    }
    return {
      type: "object",
      value: Object.keys(value as Record<string, unknown>)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, encodeCanonicalValue((value as Record<string, unknown>)[key], `${path}.${key}`, ancestors)]),
    };
  } finally {
    ancestors.delete(value);
  }
}

function decodeCanonicalValue(node: unknown, path: string): unknown {
  if (!node || typeof node !== "object" || Array.isArray(node) || typeof (node as { type?: unknown }).type !== "string") {
    throw invalidCanonicalNode(path);
  }
  const candidate = node as { type: string; value?: unknown };
  switch (candidate.type) {
    case "undefined":
      if (Object.hasOwn(candidate, "value")) throw invalidCanonicalNode(path);
      return undefined;
    case "null":
      if (Object.hasOwn(candidate, "value")) throw invalidCanonicalNode(path);
      return null;
    case "boolean":
      if (typeof candidate.value === "boolean") return candidate.value;
      break;
    case "number":
      if (typeof candidate.value === "number" && Number.isFinite(candidate.value)) return candidate.value;
      break;
    case "string":
      if (typeof candidate.value === "string") return candidate.value;
      break;
    case "array":
      if (Array.isArray(candidate.value)) {
        return candidate.value.map((item, index) => decodeCanonicalValue(item, `${path}[${index}]`));
      }
      break;
    case "object":
      if (Array.isArray(candidate.value)) {
        const result: Record<string, unknown> = {};
        const keys = new Set<string>();
        for (let index = 0; index < candidate.value.length; index += 1) {
          const entry = candidate.value[index];
          if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string" || keys.has(entry[0])) {
            throw invalidCanonicalNode(`${path}.value[${index}]`);
          }
          keys.add(entry[0]);
          Object.defineProperty(result, entry[0], {
            value: decodeCanonicalValue(entry[1], `${path}.${entry[0]}`),
            enumerable: true,
            configurable: true,
            writable: true,
          });
        }
        return result;
      }
      break;
  }
  throw invalidCanonicalNode(path);
}

function assertResourceLimits(value: unknown, policy: Required<CodecResourcePolicy>): void {
  let collectionItems = 0;
  let objectKeys = 0;
  const stack: { value: unknown; depth: number }[] = [{ value, depth: 0 }];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current.depth > policy.maxDepth) {
      throw new SemanticCodecError("PAYLOAD_TOO_DEEP", `Semantic artifact exceeds depth limit ${policy.maxDepth}.`);
    }
    if (Array.isArray(current.value)) {
      collectionItems += current.value.length;
      if (collectionItems > policy.maxCollectionItems) {
        throw new SemanticCodecError("COLLECTION_TOO_LARGE", `Semantic artifact exceeds collection item limit ${policy.maxCollectionItems}.`);
      }
      for (const nested of current.value) stack.push({ value: nested, depth: current.depth + 1 });
    } else if (current.value && typeof current.value === "object") {
      const entries = Object.entries(current.value as Record<string, unknown>);
      objectKeys += entries.length;
      if (objectKeys > policy.maxObjectKeys) {
        throw new SemanticCodecError("OBJECT_TOO_LARGE", `Semantic artifact exceeds object-key limit ${policy.maxObjectKeys}.`);
      }
      for (const [, nested] of entries) stack.push({ value: nested, depth: current.depth + 1 });
    }
  }
}

function assertCanonicalJsonSafe(value: unknown, path: string, ancestors: WeakSet<object>): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw unsupportedCanonical(path, "Non-finite numbers are lossy in JSON.");
    return;
  }
  if (value === undefined || typeof value === "bigint" || typeof value === "function" || typeof value === "symbol") {
    throw unsupportedCanonical(path, `Value type ${typeof value} is lossy or unsupported in plain canonical JSON.`);
  }
  if (!value || typeof value !== "object") throw unsupportedCanonical(path, "Unsupported canonical JSON value.");
  if (ancestors.has(value)) throw new SemanticCodecError("CYCLIC_CANONICAL_VALUE", `Cyclic canonical JSON value at ${path}.`, path);
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    throw unsupportedCanonical(path, "Plain canonical JSON accepts only arrays and plain objects.");
  }
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      value.forEach((item, index) => assertCanonicalJsonSafe(item, `${path}[${index}]`, ancestors));
    } else {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        assertCanonicalJsonSafe(nested, `${path}.${key}`, ancestors);
      }
    }
  } finally {
    ancestors.delete(value);
  }
}

function sortCanonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortCanonical);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, sortCanonical(record[key])]));
}

function invalidCanonicalNode(path: string): SemanticCodecError {
  return new SemanticCodecError("INVALID_CANONICAL_NODE", `Malformed canonical semantic node at ${path}.`, path);
}

function unsupportedCanonical(path: string, message: string): SemanticCodecError {
  return new SemanticCodecError("UNSUPPORTED_CANONICAL_VALUE", message, path);
}

function migrationKey(kind: SemanticArtifactKind, from: string): string {
  return `${kind}:${from}`;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return value;
}
