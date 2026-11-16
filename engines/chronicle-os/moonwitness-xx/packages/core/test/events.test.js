import test from "node:test";
import assert from "node:assert/strict";
import { createDomainEventBus } from "../src/events.js";

const event = {
  eventId: "00000000-0000-4000-8000-000000000001",
  eventType: "story.created",
  schemaVersion: 1,
  occurredAt: "2026-11-11T00:00:00.000Z",
  correlationId: "request-1",
  payload: {
    storyId: "00000000-0000-4000-8000-000000000002",
    authorId: "00000000-0000-4000-8000-000000000003"
  }
};

test("event bus validates and dispatches registered handlers", async () => {
  const calls = [];
  const bus = createDomainEventBus();
  const unregister = bus.register("story.created", async (received, context) => {
    calls.push({ received, context });
    return "stored";
  }, { id: "test-handler" });

  const result = await bus.dispatch(event, { source: "test" });
  assert.equal(result.handlerCount, 1);
  assert.equal(result.unhandled, false);
  assert.equal(calls[0].received.eventId, event.eventId);
  assert.equal(calls[0].context.source, "test");
  unregister();
  assert.deepEqual(bus.listHandlers(), []);
});

test("event bus exposes unhandled events without inventing consumers", async () => {
  const bus = createDomainEventBus();
  const result = await bus.dispatch(event);
  assert.equal(result.handlerCount, 0);
  assert.equal(result.unhandled, true);
});

test("event bus rejects unknown events and malformed payloads", async () => {
  const bus = createDomainEventBus();
  assert.throws(() => bus.register("unknown.event", async () => {}), /not registered/);
  await assert.rejects(() => bus.dispatch({
    ...event,
    payload: { storyId: "invalid", authorId: "invalid" }
  }), /Invalid payload/);
});

test("event bus surfaces handler failures for queue retry", async () => {
  const bus = createDomainEventBus({ logger: { error() {} } });
  bus.register("story.created", async () => { throw new Error("database unavailable"); }, { id: "failing-handler" });

  await assert.rejects(() => bus.dispatch(event), /database unavailable/);
});
