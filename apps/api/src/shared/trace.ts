import { randomBytes } from "node:crypto";

const TRACEPARENT_PATTERN = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;
const ZERO_TRACE_ID = "00000000000000000000000000000000";
const ZERO_SPAN_ID = "0000000000000000";

export interface TraceContext {
  traceparent: string;
  traceId: string;
  spanId: string;
  sampled: boolean;
}

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

/**
 * Parses an incoming W3C `traceparent` header or mints a fresh trace context,
 * returning the active trace identifiers and child-span header value.
 */
export function resolveTraceContext(incoming?: string | string[]): TraceContext {
  const raw = firstHeaderValue(incoming)?.trim();
  const match = raw ? TRACEPARENT_PATTERN.exec(raw) : null;
  if (match) {
    const traceId = match[1]!.toLowerCase();
    const spanId = match[2]!.toLowerCase();
    const flags = match[3]!.toLowerCase();
    if (traceId !== ZERO_TRACE_ID && spanId !== ZERO_SPAN_ID) {
      return {
        traceparent: `00-${traceId}-${spanId}-${flags}`,
        traceId,
        spanId,
        sampled: (Number.parseInt(flags, 16) & 0x01) === 1,
      };
    }
  }

  const traceId = randomHex(16);
  const spanId = randomHex(8);
  return {
    traceparent: `00-${traceId}-${spanId}-01`,
    traceId,
    spanId,
    sampled: true,
  };
}

/** Creates a child `traceparent` span under an existing trace context for upstream propagation. */
export function buildChildTraceparent(ctx: TraceContext): string {
  const childSpan = randomHex(8);
  const flags = ctx.sampled ? "01" : "00";
  return `00-${ctx.traceId}-${childSpan}-${flags}`;
}
