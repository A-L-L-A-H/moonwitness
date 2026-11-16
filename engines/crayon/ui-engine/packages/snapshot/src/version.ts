import type { SemanticSnapshot } from "./index.js";

export interface VersionCheck { supported: boolean; version?: string; reason?: string; }

export function checkSemanticSnapshotVersion(value: unknown): VersionCheck {
  if (!value || typeof value !== "object") return { supported: false, reason: "SNAPSHOT_NOT_OBJECT" };
  const version = String((value as { version?: unknown }).version ?? "");
  if (version !== "0") return { supported: false, version, reason: "UNSUPPORTED_SEMANTIC_SNAPSHOT_VERSION" };
  return { supported: true, version };
}

export function assertSemanticSnapshotV0(value: unknown): asserts value is SemanticSnapshot {
  const check = checkSemanticSnapshotVersion(value);
  if (!check.supported) throw new Error(`${check.reason}:${check.version ?? "missing"}`);
}
