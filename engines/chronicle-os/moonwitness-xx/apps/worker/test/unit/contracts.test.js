import test from "node:test";
import assert from "node:assert/strict";
import { JOBS, QUEUES } from "@moonwitness/contracts";
import { validateJobPayload } from "@moonwitness/queue";

test("worker receives only centrally registered queue and job identifiers", () => {
  assert.equal(QUEUES.events, "moonwitness.events");
  assert.equal(JOBS.events.consume, "events.consume");
  assert.throws(() => validateJobPayload("events.unknown", {}), /not registered/);
});

test("event consume job requires a versioned outbox reference", () => {
  assert.equal(validateJobPayload(JOBS.events.consume, {
    schemaVersion: 1,
    outboxId: "00000000-0000-4000-8000-000000000001",
    eventType: "story.created",
    eventVersion: 1,
    correlationId: "request-1"
  }).queue, QUEUES.events);

  assert.throws(() => validateJobPayload(JOBS.events.consume, {
    outboxId: "not-a-uuid",
    eventType: "story.created",
    eventVersion: 1,
    correlationId: "request-1"
  }), /Invalid payload/);
});
