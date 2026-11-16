import test from "node:test";
import assert from "node:assert/strict";
import { createQueueRegistry, validateJobPayload } from "../src/registry.js";
import { JOBS, QUEUES } from "@moonwitness/contracts";

const validPing = {
  schemaVersion: 1,
  correlationId: "request-123"
};

test("job payload validator accepts only declared payloads", () => {
  assert.equal(validateJobPayload(JOBS.system.ping, validPing).queue, QUEUES.system);
  assert.throws(() => validateJobPayload(JOBS.system.ping, {
    correlationId: "request-123"
  }), /Invalid payload/);
  assert.throws(() => validateJobPayload("system.unknown", {}), /not registered/);
});

test("producer rejects a job assigned to the wrong queue", async () => {
  const registry = createQueueRegistry({
    connection: {},
    queueFactory: () => ({ add: async () => ({ id: "unused" }), close: async () => {} })
  });

  await assert.rejects(
    () => registry.add(QUEUES.media, JOBS.system.ping, validPing),
    /does not belong to queue/
  );

  await registry.close();
});

test("producer validates input, hashes idempotency keys, and reuses queue instances", async () => {
  const calls = [];
  let queueCreations = 0;
  const registry = createQueueRegistry({
    connection: {},
    queueFactory: (name, options) => {
      queueCreations += 1;
      return {
        add: async (jobName, payload, jobOptions) => {
          calls.push({ name, jobName, payload, jobOptions });
          return { id: jobOptions.jobId ?? "job-1" };
        },
        close: async () => {}
      };
    }
  });

  const first = await registry.add(QUEUES.system, JOBS.system.ping, validPing, {
    idempotencyKey: "unique-request-key",
    priority: 2
  });
  const second = await registry.add(QUEUES.system, JOBS.system.ping, validPing, {
    idempotencyKey: "unique-request-key",
    priority: 2
  });

  assert.equal(queueCreations, 1);
  assert.equal(first.id, second.id);
  assert.match(first.id, /^system\.ping-[a-f0-9]{64}$/);
  assert.equal(calls[0].jobOptions.attempts, 3);
  await registry.close();
});

test("registry refuses arbitrary queue names and invalid producer options", async () => {
  const registry = createQueueRegistry({
    connection: {},
    queueFactory: () => ({ add: async () => ({}), close: async () => {} })
  });

  await assert.rejects(
    () => registry.add("unregistered.queue", JOBS.system.ping, validPing),
    /does not belong to queue/
  );

  await assert.rejects(
    () => registry.add(QUEUES.system, JOBS.system.ping, validPing, { delay: -1 }),
    /delay must be/
  );

  await registry.close();
});
