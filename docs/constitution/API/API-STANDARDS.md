# HTTP API Standards

**Status:** PROPOSED v1  
**Base path:** `/api/v1`

## Conventions

- JSON request and response bodies.
- Stable resource IDs (UUID/ULID; final choice in implementation ADR).
- ISO 8601 UTC timestamps.
- Cursor pagination for growing collections.
- Explicit filters and bounded page sizes.
- Idempotency keys for retryable writes.
- Correlation ID on every response.
- OpenAPI document generated from validated route schemas.

## Response envelope

Success responses expose `data`, optional `meta`, and `request_id`. Errors expose `error.code`, `error.message`, optional field details, and `request_id`. Never return stack traces or secrets.

## Initial resource groups

- `/workspaces`
- `/projects`, `/initiatives`, `/milestones`
- `/tasks`, `/tasks/:id/dependencies`, `/tasks/:id/comments`, `/tasks/:id/artifacts`
- `/knowledge/sources`, `/knowledge/documents`, `/knowledge/search`
- `/agents`, `/agent-runs`
- `/approvals`, `/decisions`
- `/health`

## Security

Authentication precedes resource lookup. Authorization is enforced server-side on every request. Never trust client-provided actor IDs, workspace IDs, roles, approval flags, or classification. Validate content size, type, and shape. Rate-limit authentication, search, ingestion, and mutation routes.

## OpenAPI and MCP parity

The HTTP API and MCP tools call the same domain services and share validation schemas. MCP is not a second implementation of business logic.
