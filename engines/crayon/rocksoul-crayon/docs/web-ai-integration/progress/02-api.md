# Progress Report 02 — API Discovery & Mapping

## Objective
Discover and map all backend endpoints provided by Fastify for canonical business resources (`users`, `projects`, `tasks`, `chat`, `mail`) and AI agent execution.

## Implementation
- Documented model endpoints under `/api/v1/models/:model` supporting GET list, GET detail, POST create, PUT update, and DELETE.
- Documented AI endpoints under `/api/v1/ai/` for agent discovery, chat completion, workflow execution, tool approvals, and SSE streaming.
- Documented authentication protocols using operator-provisioned scoped API keys and Bearer tokens.

## Files Changed
- `docs/web-ai-integration/api-map.md`

## Dependencies
- `@rocksoul/api` (Fastify REST service).

## Verification
- HTTP probe against live Docker container `rocksoul_fastify_api` on port 3000.

## Limitations
- Filter expressions must be encoded in URL query params.

## Next
- Map ShadcnStore UX patterns.
