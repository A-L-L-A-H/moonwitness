import test from "node:test";
import assert from "node:assert/strict";
import { Value } from "@sinclair/typebox/value";
import {
  ErrorEnvelopeSchema,
  SuccessEnvelopeSchema,
  errorEnvelope,
  successEnvelope
} from "../src/envelopes.js";

test("success and error envelopes conform to the shared contract", () => {
  assert.equal(Value.Check(SuccessEnvelopeSchema, successEnvelope({ id: "story-1" }, { requestId: "req-1" })), true);
  assert.equal(Value.Check(ErrorEnvelopeSchema, errorEnvelope("NOT_FOUND", "Not found.", "req-1")), true);
  assert.equal(Value.Check(ErrorEnvelopeSchema, { error: { code: "NOT_FOUND", message: "Not found." } }), false);
});

test("error envelope never omits the request correlation identifier", () => {
  assert.equal(errorEnvelope("INTERNAL_ERROR", "Unexpected error.", undefined).requestId, "unknown");
});
