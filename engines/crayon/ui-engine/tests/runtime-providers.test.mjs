import test from "node:test";
import assert from "node:assert/strict";
import {
  createFixedClock,
  createRuntimeProviders,
  createRuntimeStamp,
  createSequenceIdentityProvider,
} from "../dist/packages/runtime/src/index.js";
import { createSemanticEvent } from "../dist/packages/observability/src/index.js";

test("fixed providers reproduce identical semantic records byte-for-byte", () => {
  function build() {
    const providers = createRuntimeProviders({
      clock: createFixedClock("2026-08-25T12:00:00Z"),
      identity: createSequenceIdentityProvider("fixture", 1),
    });
    const stamp = createRuntimeStamp(providers, "observe");
    return createSemanticEvent({
      id: stamp.id,
      kind: "observe",
      at: stamp.at,
      correlation: { operationId: "operation:fixture" },
      attributes: { source: "fixture" },
    });
  }

  assert.equal(JSON.stringify(build()), JSON.stringify(build()));
});

test("sequence identities are scope-explicit and deterministic", () => {
  const ids = createSequenceIdentityProvider("test", 7);
  assert.equal(ids.next("witness"), "test:witness:7");
  assert.equal(ids.next("witness"), "test:witness:8");
  assert.equal(ids.next("transition"), "test:transition:9");
});

test("invalid fixed clock values are rejected at provider creation", () => {
  assert.throws(() => createFixedClock("not-a-time"));
});
