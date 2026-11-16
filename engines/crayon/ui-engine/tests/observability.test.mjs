import test from "node:test";
import assert from "node:assert/strict";
import {
  createSemanticEvent,
  defaultSecretRedactor,
  emitTelemetrySafely,
  redactSemanticEvent,
} from "../dist/packages/observability/src/index.js";

test("semantic telemetry is deterministic and carries correlation without claiming outcome truth", () => {
  const event = createSemanticEvent({
    id: "event:execute:42",
    kind: "execute",
    at: "2026-08-25T11:00:00Z",
    actorId: "service:executor",
    situationId: "situation:deploy",
    semanticRef: "possibility:deploy",
    correlation: {
      operationId: "operation:42",
      transitionId: "transition:42",
      temporalRecordId: "temporal:42",
      witnessId: "witness:42",
    },
    attributes: {
      phase: "external-pending",
      attempt: 1,
    },
  });

  assert.equal(event.version, "0");
  assert.equal(event.kind, "execute");
  assert.equal(event.correlation.operationId, "operation:42");
  assert.equal(event.attributes.phase, "external-pending");
  assert.equal("success" in event.attributes, false);
  assert.ok(Object.isFrozen(event));
  assert.ok(Object.isFrozen(event.attributes));
});

test("redaction happens before telemetry leaves the runtime boundary", () => {
  const event = createSemanticEvent({
    id: "event:observe:1",
    kind: "observe",
    at: "2026-08-25T11:00:00Z",
    attributes: {
      accountId: "acct-123",
      token: "super-secret",
    },
  });

  const redacted = redactSemanticEvent(event, defaultSecretRedactor(["token"]));
  assert.equal(redacted.attributes.accountId, "acct-123");
  assert.equal(redacted.attributes.token, "[REDACTED]");
  assert.equal(event.attributes.token, "super-secret");
});

test("telemetry sink failure cannot fail or mutate the semantic operation result", async () => {
  const semanticResult = Object.freeze({ status: "unknown", reason: "OUTCOME_UNRESOLVED" });
  const event = createSemanticEvent({
    id: "event:verify:1",
    kind: "verify",
    at: "2026-08-25T11:00:00Z",
    attributes: { result: semanticResult.status },
  });

  const delivery = await emitTelemetrySafely({
    event,
    sink: {
      emit() {
        throw new Error("telemetry backend unavailable");
      },
    },
  });

  assert.equal(delivery.delivered, false);
  assert.equal(delivery.reason, "SINK_FAILED");
  assert.deepEqual(semanticResult, { status: "unknown", reason: "OUTCOME_UNRESOLVED" });
});

test("telemetry requires caller-provided stable identity and clock", () => {
  assert.throws(() => createSemanticEvent({ id: "", kind: "observe", at: "2026-08-25T11:00:00Z" }));
  assert.throws(() => createSemanticEvent({ id: "event:bad-time", kind: "observe", at: "not-a-time" }));
});
