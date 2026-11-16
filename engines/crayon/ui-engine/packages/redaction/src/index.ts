export interface RedactionMarker {
  redacted: true;
  meaning: "withheld-not-unknown";
  reason: string;
  classification?: string;
}

export interface RedactionEvent {
  path: string;
  reason: string;
  classification?: string;
}

export interface RedactedView<T = unknown> {
  value: T;
  redactions: readonly RedactionEvent[];
}

export type RedactionDecision =
  | { action: "keep" }
  | { action: "redact"; reason: string; classification?: string };

export type RedactionPolicy = (args: { path: string; key: string; value: unknown }) => RedactionDecision;

export interface PathRedactionRule {
  path: string;
  reason: string;
  classification?: string;
}

/**
 * Produces an explicit derived view. The source object is never mutated and a
 * redacted field remains present as a RedactionMarker so callers cannot confuse
 * secrecy with semantic unknown/missing data.
 */
export function redactView<T>(source: T, policy: RedactionPolicy): RedactedView<T> {
  const redactions: RedactionEvent[] = [];
  const value = walk(structuredClone(source), "$", policy, redactions) as T;
  return deepFreeze({ value, redactions });
}

/**
 * Recommended production policy helper. Rules target exact semantic paths,
 * making redaction metadata explicit instead of guessing sensitivity from key
 * names or values. `protectedPaths` allows identity/provenance fields to remain
 * available even when a broader application rule set would otherwise redact
 * them.
 */
export function redactPaths(
  rules: readonly PathRedactionRule[],
  protectedPaths: readonly string[] = [],
): RedactionPolicy {
  const byPath = new Map(rules.map((rule) => [rule.path, Object.freeze({ ...rule })]));
  const protectedSet = new Set(protectedPaths);
  return ({ path }) => {
    if (protectedSet.has(path)) return { action: "keep" };
    const rule = byPath.get(path);
    return rule
      ? { action: "redact", reason: rule.reason, classification: rule.classification }
      : { action: "keep" };
  };
}

/**
 * Convenience helper retained only for non-semantic transport/debug payloads.
 * Production semantic surfaces should prefer redactPaths() because key-name
 * matching is not sufficient redaction metadata.
 */
export function redactKeys(keys: readonly string[], reason = "sensitive", classification = "secret"): RedactionPolicy {
  const normalized = new Set(keys.map((key) => key.toLowerCase()));
  return ({ key }) => normalized.has(key.toLowerCase())
    ? { action: "redact", reason, classification }
    : { action: "keep" };
}

export function isRedactionMarker(value: unknown): value is RedactionMarker {
  return Boolean(
    value
    && typeof value === "object"
    && (value as { redacted?: unknown }).redacted === true
    && (value as { meaning?: unknown }).meaning === "withheld-not-unknown",
  );
}

function walk(value: unknown, path: string, policy: RedactionPolicy, events: RedactionEvent[]): unknown {
  if (Array.isArray(value)) return value.map((item, index) => walk(item, `${path}[${index}]`, policy, events));
  if (!value || typeof value !== "object") return value;
  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = `${path}.${key}`;
    const decision = policy({ path: nextPath, key, value: nested });
    if (decision.action === "redact") {
      const marker: RedactionMarker = {
        redacted: true,
        meaning: "withheld-not-unknown",
        reason: decision.reason,
        classification: decision.classification,
      };
      output[key] = marker;
      events.push({ path: nextPath, reason: decision.reason, classification: decision.classification });
    } else {
      output[key] = walk(nested, nextPath, policy, events);
    }
  }
  return output;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return value;
}
