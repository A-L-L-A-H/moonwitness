export const SEMANTIC_EVENT_VERSION = "0" as const;

export type SemanticEventKind =
  | "observe"
  | "propose"
  | "intend"
  | "commit"
  | "execute"
  | "verify"
  | "reconcile"
  | "render";

export type TelemetryScalar = string | number | boolean | null;
export type TelemetryValue = TelemetryScalar | readonly TelemetryScalar[];

export interface SemanticEventCorrelation {
  operationId?: string;
  transitionId?: string;
  temporalRecordId?: string;
  witnessId?: string;
  rendererTraceId?: string;
}

export interface SemanticEvent {
  version: typeof SEMANTIC_EVENT_VERSION;
  id: string;
  kind: SemanticEventKind;
  at: string;
  actorId?: string;
  situationId?: string;
  semanticRef?: string;
  correlation: SemanticEventCorrelation;
  attributes: Readonly<Record<string, TelemetryValue>>;
}

export interface SemanticEventInput {
  id: string;
  kind: SemanticEventKind;
  at: string;
  actorId?: string;
  situationId?: string;
  semanticRef?: string;
  correlation?: SemanticEventCorrelation;
  attributes?: Record<string, TelemetryValue>;
}

export interface TelemetrySink {
  emit(event: SemanticEvent): void | Promise<void>;
}

export type TelemetryRedactionDecision =
  | { action: "keep" }
  | { action: "drop" }
  | { action: "replace"; value: TelemetryValue };

export type TelemetryRedactor = (args: {
  key: string;
  value: TelemetryValue;
  event: SemanticEvent;
}) => TelemetryRedactionDecision;

export type TelemetryDeliveryResult =
  | { delivered: true }
  | { delivered: false; reason: "NO_SINK" | "SINK_FAILED"; error?: unknown };

export function createSemanticEvent(input: SemanticEventInput): SemanticEvent {
  if (!nonEmpty(input.id)) throw new Error("Semantic telemetry event requires a stable id.");
  if (!validTime(input.at)) throw new Error("Semantic telemetry event requires an explicit valid timestamp.");

  return deepFreeze({
    version: SEMANTIC_EVENT_VERSION,
    id: input.id,
    kind: input.kind,
    at: input.at,
    actorId: optionalNonEmpty(input.actorId),
    situationId: optionalNonEmpty(input.situationId),
    semanticRef: optionalNonEmpty(input.semanticRef),
    correlation: sanitizeCorrelation(input.correlation ?? {}),
    attributes: sanitizeAttributes(input.attributes ?? {}),
  });
}

export function redactSemanticEvent(
  event: SemanticEvent,
  redactor: TelemetryRedactor,
): SemanticEvent {
  const attributes: Record<string, TelemetryValue> = {};
  for (const [key, value] of Object.entries(event.attributes)) {
    const decision = redactor({ key, value, event });
    if (decision.action === "drop") continue;
    attributes[key] = decision.action === "replace" ? decision.value : value;
  }
  return deepFreeze({ ...event, attributes });
}

export async function emitTelemetrySafely(args: {
  event: SemanticEvent;
  sink?: TelemetrySink;
  redactor?: TelemetryRedactor;
}): Promise<TelemetryDeliveryResult> {
  if (!args.sink) return { delivered: false, reason: "NO_SINK" };
  const event = args.redactor ? redactSemanticEvent(args.event, args.redactor) : args.event;
  try {
    await args.sink.emit(event);
    return { delivered: true };
  } catch (error) {
    return { delivered: false, reason: "SINK_FAILED", error };
  }
}

export function defaultSecretRedactor(keys: readonly string[]): TelemetryRedactor {
  const blocked = new Set(keys.map((key) => key.toLowerCase()));
  return ({ key }) => blocked.has(key.toLowerCase())
    ? { action: "replace", value: "[REDACTED]" }
    : { action: "keep" };
}

function sanitizeCorrelation(input: SemanticEventCorrelation): SemanticEventCorrelation {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => nonEmpty(value)),
  ) as SemanticEventCorrelation;
}

function sanitizeAttributes(input: Record<string, TelemetryValue>): Record<string, TelemetryValue> {
  const output: Record<string, TelemetryValue> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!nonEmpty(key)) continue;
    if (!validTelemetryValue(value)) throw new Error(`Unsupported telemetry value for ${key}.`);
    output[key] = Array.isArray(value) ? Object.freeze([...value]) : value;
  }
  return output;
}

function validTelemetryValue(value: TelemetryValue): boolean {
  if (Array.isArray(value)) return value.every(isScalar);
  return isScalar(value);
}

function isScalar(value: unknown): value is TelemetryScalar {
  return value === null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value));
}

function validTime(value: unknown): value is string {
  return nonEmpty(value) && Number.isFinite(Date.parse(value));
}

function optionalNonEmpty(value: string | undefined): string | undefined {
  return nonEmpty(value) ? value : undefined;
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
