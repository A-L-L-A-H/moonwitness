import { Type } from "@sinclair/typebox";

export const QUEUES = Object.freeze({
  system: "moonwitness.system",
  events: "moonwitness.events",
  notifications: "moonwitness.notifications",
  media: "moonwitness.media",
  integrations: "moonwitness.integrations"
});

export const JOBS = Object.freeze({
  system: Object.freeze({
    ping: "system.ping",
    outboxDispatch: "system.outbox.dispatch"
  }),
  notifications: Object.freeze({
    deliver: "notifications.deliver"
  }),
  media: Object.freeze({
    process: "media.process"
  }),
  integrations: Object.freeze({
    dispatch: "integrations.dispatch"
  }),
  events: Object.freeze({
    consume: "events.consume"
  })
});

export const SystemPingJobSchema = Type.Object({
  schemaVersion: Type.Literal(1),
  correlationId: Type.String({ minLength: 1, maxLength: 120 })
}, { additionalProperties: false });

export const OutboxDispatchJobSchema = Type.Object({
  schemaVersion: Type.Literal(1),
  outboxId: Type.String({ pattern: "^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$" }),
  eventType: Type.String({ minLength: 3, maxLength: 120 }),
  eventVersion: Type.Integer({ minimum: 1 }),
  correlationId: Type.String({ minLength: 1, maxLength: 120 })
}, { additionalProperties: false });

export const EventConsumeJobSchema = Type.Object({
  schemaVersion: Type.Literal(1),
  outboxId: Type.String({ pattern: "^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$" }),
  eventType: Type.String({ minLength: 3, maxLength: 120 }),
  eventVersion: Type.Integer({ minimum: 1 }),
  correlationId: Type.String({ minLength: 1, maxLength: 120 })
}, { additionalProperties: false });

export const JOB_DEFINITIONS = Object.freeze({
  [JOBS.system.ping]: Object.freeze({
    queue: QUEUES.system,
    schemaVersion: 1,
    schema: SystemPingJobSchema
  }),
  [JOBS.system.outboxDispatch]: Object.freeze({
    queue: QUEUES.system,
    schemaVersion: 1,
    schema: OutboxDispatchJobSchema
  }),
  [JOBS.events.consume]: Object.freeze({
    queue: QUEUES.events,
    schemaVersion: 1,
    schema: EventConsumeJobSchema
  })
});
