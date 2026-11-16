# Central Contracts Standard

## Ownership

@moonwitness/contracts owns:
- API request and response JSON Schemas.
- Shared success/error envelopes.
- API and add-on SDK version constants.
- Queue names, job names, and payload schemas.
- Event names and versioned payload schemas.
- Common identifiers, pagination, timestamps, and provenance labels.

Database mappings are not frontend transport types. The frontend never imports MikroORM entities.

## Rules

1. One canonical runtime schema per payload.
2. Validate all untrusted boundaries.
3. Serialize responses using declared schemas.
4. No route-specific undocumented error format.
5. Async payloads include a version and correlation ID.
6. Breaking API changes require a new API version or documented migration window.
7. Events are append-only facts; commands request work.
8. Persisted values use stable machine identifiers.
9. Reject unknown fields on privileged write commands unless allowed explicitly.
10. Never expose secrets, session credentials, raw WhatsApp keys, or internal stack traces in public DTOs.

## HTTP envelopes

Success:

    { "data": {}, "meta": { "requestId": "..." } }

Error:

    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "The request is invalid.",
        "details": []
      },
      "requestId": "..."
    }

HTTP status remains authoritative. Error codes are stable identifiers; human messages may change.

## Route conventions

- Prefix: /api/v1
- Resource names: plural nouns.
- Collection endpoints define pagination, filtering, and sorting.
- Mutations with external side effects support idempotency.
- Authenticated endpoints declare required permission scopes and tests.
- Avoid arbitrary ORM relation traversal through URL nesting.

## Contract change checklist

- [ ] Update TypeBox schema.
- [ ] Add valid/invalid payload tests.
- [ ] Update Fastify request and response schema.
- [ ] Update OpenAPI generation.
- [ ] Update generated/API client adapter.
- [ ] Update event/job consumers.
- [ ] Document compatibility and rollout order.
