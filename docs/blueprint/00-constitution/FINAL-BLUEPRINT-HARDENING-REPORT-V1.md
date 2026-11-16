# Final Blueprint Hardening Report V1

Date: 2026-08-30
Status: ARCHITECTURE-MATURE / IMPLEMENTATION-GATED

## Re-audited legacy sources

| Repository | Ref | Finding | Gen2 consequence |
|---|---|---|---|
| bjo163/moonwitness | dev | large Turborepo with web, command-center and API; pnpm; Node >=20 | split application, API and core responsibilities |
| bjo163/moonwitness-corpus | dev | ingestion, validation, materialization, release and API are all present | preserve corpus build system; isolate transport |
| bjo163/cosmic | dev | npm workspace; Node >=26; engine, orchestration, persistence, jobs, witness and API concerns coexist | extract capability; normalize toolchain; isolate runtime/transport |
| bjo163/ALLAH-CRAYON-RGBL-ENGINE | dev | npm workspace; engine, LAB and web integration mixed | preserve methodology; separate LAB/application layer |
| bjo163/propetic | main | core + web + API, SQLite/offline, scoring and E2E | bounded domain/application; private persistence |

## Locked architecture conclusions

1. One canonical network door: HTTPS + OpenAPI.
2. Same-process consumers use package interfaces.
3. SSE is an HTTP streaming mode, not a second API.
4. Long work is durable/asynchronous and never depends on process memory.
5. gRPC is exceptional internal adapter only.
6. tRPC and GraphQL are not ecosystem standards.
7. MCP is an optional agent adapter.
8. Every capability has exactly one canonical owner.
9. Every canonical contract has exactly one owner.
10. Database schemas remain private to their owner.
11. Legacy code is a read-only source for migration workers.
12. Serverless and Docker execute the same application logic through thin adapters.
13. Runtime policy is latest-supported-by-target, verified in CI.

## Remaining implementation gates

- request/response-specific JSON schemas
- executable OpenAPI operation schemas and examples
- generated SDK pipeline validation
- repository provisioning and governance
- Plan/GitHub integration verification
- Vercel/Neon/Supabase environment wiring
- golden fixture extraction from legacy repositories
- actual dual-runtime smoke tests

## Exit condition

Genesis implementation may start only when all required implementation gates are recorded as PASS in GENESIS-READINESS-CHECKLIST.md. Architecture decisions themselves are considered mature and should not be reopened by workers unless a new ADR is approved.
