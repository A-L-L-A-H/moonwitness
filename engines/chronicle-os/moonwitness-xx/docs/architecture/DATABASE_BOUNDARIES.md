# Database Access Boundaries

## Request scope

When database access is enabled, the Fastify `onRequest` hook creates a new MikroORM EntityManager fork for every request:

```text
HTTP request
  -> request context (request ID + auth context + EntityManager fork)
    -> route validates and translates HTTP input
      -> application/repository operation
        -> explicit MikroORM transaction for multi-write use cases
          -> PostgreSQL
```

The root EntityManager is owned by the application runtime and is never used as a request identity map. A request must not share its fork with another request. The fork is cleared on creation so it cannot inherit managed entities from earlier work.

## Repository convention

- Repository factories accept the request-scoped EntityManager explicitly.
- Repository methods own persistence queries and map database constraints to stable domain errors.
- Route handlers do not issue raw SQL or serialize MikroORM managed entities directly.
- Multi-step domain writes use `em.transactional(async tx => ...)`.
- The transaction callback uses only its transaction-scoped EntityManager (`tx`) for reads, writes, audit rows, and outbox rows.
- HTTP responses are explicit DTOs, never entity instances.

## Unit-of-work boundary

A transaction is scoped to one use case. Domain mutation, audit record, and transactional outbox insertion are committed together when they are part of the same business operation. External side effects are dispatched only after commit through the outbox/worker pipeline.

## Verification

`apps/api/test/request-context.test.js` verifies that two independent HTTP requests receive two distinct forks with `clear: true`.
