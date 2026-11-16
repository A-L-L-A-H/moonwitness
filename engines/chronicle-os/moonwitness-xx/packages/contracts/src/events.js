import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const commonId = Type.String({ minLength: 1, maxLength: 120 });
const uuid = () => Type.String({ pattern: "^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$" });

export const DOMAIN_EVENT_DEFINITIONS = Object.freeze({
  "story.created": {
    schemaVersion: 1,
    schema: Type.Object({
      storyId: uuid(),
      authorId: uuid()
    }, { additionalProperties: false })
  },
  "story.updated": {
    schemaVersion: 1,
    schema: Type.Object({
      storyId: uuid(),
      authorId: uuid()
    }, { additionalProperties: false })
  },
  "story.submitted_for_review": {
    schemaVersion: 1,
    schema: Type.Object({
      storyId: uuid(),
      authorId: uuid(),
      previousStatus: Type.String({ maxLength: 32 })
    }, { additionalProperties: false })
  },
  "story.status_changed": {
    schemaVersion: 1,
    schema: Type.Object({
      storyId: uuid(),
      actorId: uuid(),
      from: Type.String({ maxLength: 32 }),
      to: Type.String({ maxLength: 32 })
    }, { additionalProperties: false })
  },
  "research.created": {
    schemaVersion: 1,
    schema: Type.Object({
      dossierId: uuid(),
      authorId: uuid(),
      claimsCount: Type.Integer({ minimum: 0, maximum: 500 })
    }, { additionalProperties: false })
  },
  "user.role.granted": {
    schemaVersion: 1,
    schema: Type.Object({
      userId: uuid(),
      actorId: uuid(),
      roleName: Type.String({ minLength: 2, maxLength: 64 })
    }, { additionalProperties: false })
  },
  "user.role.revoked": {
    schemaVersion: 1,
    schema: Type.Object({
      userId: uuid(),
      actorId: uuid(),
      roleName: Type.String({ minLength: 2, maxLength: 64 })
    }, { additionalProperties: false })
  }
});

export const DomainEventEnvelopeSchema = Type.Object({
  eventId: uuid(),
  eventType: Type.String({ minLength: 3, maxLength: 120 }),
  schemaVersion: Type.Integer({ minimum: 1 }),
  occurredAt: Type.String({ format: "date-time" }),
  correlationId: commonId,
  payload: Type.Record(Type.String(), Type.Unknown())
}, { additionalProperties: false });

export function validateDomainEvent(eventType, schemaVersion, payload) {
  const definition = DOMAIN_EVENT_DEFINITIONS[eventType];
  if (!definition) throw new Error(`Domain event is not registered: ${eventType}`);
  if (definition.schemaVersion !== schemaVersion) {
    throw new Error(`Unsupported schema version ${schemaVersion} for ${eventType}`);
  }
  if (!Value.Check(definition.schema, payload)) {
    const issues = [...Value.Errors(definition.schema, payload)]
      .slice(0, 10)
      .map((error) => `${error.path || "/"} ${error.message}`)
      .join("; ");
    throw new Error(`Invalid payload for ${eventType}: ${issues}`);
  }
  return definition;
}
