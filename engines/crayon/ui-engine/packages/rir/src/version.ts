import type { RIRDocument } from "./model.js";

export interface RIRVersionCheck { supported: boolean; version?: string; reason?: string; }

export function checkRIRVersion(value: unknown): RIRVersionCheck {
  if (!value || typeof value !== "object") return { supported: false, reason: "RIR_NOT_OBJECT" };
  const version = String((value as { version?: unknown }).version ?? "");
  if (version !== "0") return { supported: false, version, reason: "UNSUPPORTED_RIR_VERSION" };
  return { supported: true, version };
}

export function assertRIRV0(value: unknown): asserts value is RIRDocument {
  const check = checkRIRVersion(value);
  if (!check.supported) throw new Error(`${check.reason}:${check.version ?? "missing"}`);
}
