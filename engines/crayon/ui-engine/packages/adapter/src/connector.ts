import type { Observation } from "allah-crayon-kernel";
import { ingestObservation, type ObservationIngestionPolicy, type ObservationIngestionResult } from "./ingestion.js";

export type ConnectorMode = "poll" | "webhook" | "stream";

export interface ConnectorDelivery<T = unknown> {
  version: "0";
  deliveryId: string;
  connectorId: string;
  mode: ConnectorMode;
  receivedAt: string;
  cursor?: string;
  payload: T;
}

export type ConnectorReasonCode =
  | "INVALID_DELIVERY_ID"
  | "INVALID_CONNECTOR_ID"
  | "INVALID_RECEIVED_AT"
  | "DUPLICATE_DELIVERY"
  | "CURSOR_REGRESSION"
  | "OBSERVATION_REJECTED";

export interface ConnectorFinding {
  code: ConnectorReasonCode;
  explanation: string;
}

export interface ConnectorDeliveryState {
  connectorId: string;
  seenDeliveryIds: ReadonlySet<string>;
  latestCursor?: string;
}

export interface ConnectorDeliveryResult<T = unknown> {
  accepted: boolean;
  delivery: Readonly<ConnectorDelivery<T>>;
  findings: readonly ConnectorFinding[];
}

export function createConnectorDeliveryTracker(connectorId: string): {
  accept<T>(delivery: ConnectorDelivery<T>): ConnectorDeliveryResult<T>;
  state(): ConnectorDeliveryState;
} {
  if (!nonEmpty(connectorId)) throw new Error("Connector identity must be non-empty.");
  const seen = new Set<string>();
  let latestCursor: string | undefined;

  return Object.freeze({
    accept<T>(delivery: ConnectorDelivery<T>): ConnectorDeliveryResult<T> {
      const findings: ConnectorFinding[] = [];
      if (!nonEmpty(delivery.deliveryId)) findings.push(finding("INVALID_DELIVERY_ID", "Delivery identity is required."));
      if (delivery.connectorId !== connectorId) findings.push(finding("INVALID_CONNECTOR_ID", "Delivery connectorId must match tracker identity."));
      if (!validTime(delivery.receivedAt)) findings.push(finding("INVALID_RECEIVED_AT", "Delivery receivedAt must be a valid timestamp."));
      if (seen.has(delivery.deliveryId)) findings.push(finding("DUPLICATE_DELIVERY", `Delivery ${delivery.deliveryId} was already accepted.`));
      if (delivery.cursor !== undefined && latestCursor !== undefined && compareCursor(delivery.cursor, latestCursor) < 0) {
        findings.push(finding("CURSOR_REGRESSION", `Cursor ${delivery.cursor} is behind ${latestCursor}.`));
      }
      const accepted = findings.length === 0;
      if (accepted) {
        seen.add(delivery.deliveryId);
        if (delivery.cursor !== undefined) latestCursor = delivery.cursor;
      }
      return deepFreeze({ accepted, delivery: structuredClone(delivery), findings });
    },

    state(): ConnectorDeliveryState {
      return Object.freeze({ connectorId, seenDeliveryIds: new Set(seen), latestCursor });
    },
  });
}

export function ingestConnectorObservation<T>(args: {
  delivery: ConnectorDelivery<Observation<T>>;
  tracker: ReturnType<typeof createConnectorDeliveryTracker>;
  policy?: Omit<ObservationIngestionPolicy, "receivedAt">;
}): {
  delivery: ConnectorDeliveryResult<Observation<T>>;
  observation?: ObservationIngestionResult<T>;
  findings: readonly ConnectorFinding[];
} {
  const delivery = args.tracker.accept(args.delivery);
  if (!delivery.accepted) return { delivery, findings: delivery.findings };
  const observation = ingestObservation(args.delivery.payload, {
    ...(args.policy ?? {}),
    receivedAt: args.delivery.receivedAt,
  });
  if (!observation.accepted) {
    return {
      delivery,
      observation,
      findings: [finding("OBSERVATION_REJECTED", "Transport delivery was accepted but the contained Observation failed ingestion policy.")],
    };
  }
  return { delivery, observation, findings: [] };
}

function compareCursor(left: string, right: string): number {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber - rightNumber;
  return left.localeCompare(right);
}

function finding(code: ConnectorReasonCode, explanation: string): ConnectorFinding {
  return { code, explanation };
}

function validTime(value: unknown): value is string {
  return nonEmpty(value) && Number.isFinite(Date.parse(value));
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
