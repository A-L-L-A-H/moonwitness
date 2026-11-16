import { createHash } from "node:crypto";
import { Queue } from "bullmq";
import { Value } from "@sinclair/typebox/value";
import { JOB_DEFINITIONS, QUEUES } from "@moonwitness/contracts";

const queueNames = new Set(Object.values(QUEUES));

export function validateJobPayload(jobName, payload) {
  const definition = JOB_DEFINITIONS[jobName];

  if (!definition) {
    throw new Error(`Job is not registered: ${jobName}`);
  }

  if (!Value.Check(definition.schema, payload)) {
    const errors = [...Value.Errors(definition.schema, payload)]
      .map((error) => `${error.path || "/"} ${error.message}`)
      .join("; ");

    throw new Error(`Invalid payload for ${jobName}: ${errors}`);
  }

  return definition;
}

function createJobId(jobName, idempotencyKey) {
  const digest = createHash("sha256").update(idempotencyKey).digest("hex");
  return `${jobName}-${digest}`;
}

export function createQueueRegistry({
  connection,
  prefix = "moonwitness",
  defaultJobOptions = {},
  queueFactory = (name, options) => new Queue(name, options)
} = {}) {
  if (!connection) {
    throw new Error("A Redis connection is required to create the queue registry");
  }

  const queues = new Map();
  const baseJobOptions = {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 604800, count: 5000 },
    ...defaultJobOptions
  };

  function getQueue(name) {
    if (!queueNames.has(name)) {
      throw new Error(`Queue is not registered: ${name}`);
    }

    if (!queues.has(name)) {
      queues.set(name, queueFactory(name, { connection, prefix }));
    }

    return queues.get(name);
  }

  async function add(queueName, jobName, payload, options = {}) {
    const definition = validateJobPayload(jobName, payload);

    if (definition.queue !== queueName) {
      throw new Error(`Job ${jobName} does not belong to queue ${queueName}`);
    }

    const { idempotencyKey, delay, priority } = options;
    if (idempotencyKey !== undefined &&
        (typeof idempotencyKey !== "string" || idempotencyKey.length < 1 || idempotencyKey.length > 240)) {
      throw new Error("idempotencyKey must be a non-empty string up to 240 characters");
    }

    if (delay !== undefined && (!Number.isInteger(delay) || delay < 0)) {
      throw new Error("delay must be a non-negative integer");
    }

    if (priority !== undefined && (!Number.isInteger(priority) || priority < 1)) {
      throw new Error("priority must be a positive integer");
    }

    const jobOptions = {
      ...baseJobOptions,
      ...(delay === undefined ? {} : { delay }),
      ...(priority === undefined ? {} : { priority }),
      ...(idempotencyKey ? { jobId: createJobId(jobName, idempotencyKey) } : {})
    };

    return getQueue(queueName).add(jobName, payload, jobOptions);
  }

  async function close() {
    await Promise.all([...queues.values()].map((queue) => queue.close()));
    queues.clear();
  }

  return Object.freeze({ add, close, getQueue });
}
