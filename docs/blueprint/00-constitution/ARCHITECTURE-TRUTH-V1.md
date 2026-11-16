# MoonWitness Architecture Truth v1

Status: ACTIVE / PRE-IMPLEMENTATION
Date: 2026-08-30

This document is the compact architectural constitution. Detailed domain and implementation specifications belong in their canonical section artifacts.

## Non-negotiable rules

1. One owner per capability.
2. One canonical contract per capability.
3. One canonical network door: HTTPS + OpenAPI.
4. Same-process composition uses typed package interfaces.
5. SSE is a mode of the HTTP API, not a second API.
6. Async execution is durable and internal behind application/API boundaries.
7. Packages are the reusable unit.
8. Repositories are development boundaries, not import shortcuts.
9. Databases remain private to their owning capability/service.
10. Adapters translate transport or hosting concerns; they never duplicate business logic.
11. UI never reads domain databases directly.
12. Legacy code is migrated by capability and evidence, never copied wholesale.
13. New dependencies require a demonstrated need and an explicit ownership/lifecycle decision.
14. tRPC and GraphQL are not platform standards.
15. gRPC, MCP, and WebSocket are conditional adapters only.
16. Serverless and container execution must use the same application logic through thin host adapters.
17. Architecture changes require an explicit ADR; workers may not reinterpret locked decisions.

## Canonical boundary

```text
External App / Web / SDK
          |
       HTTPS
          |
    OpenAPI contract
          |
    moonwitness-api
          |
 application capability
          |
        domain
```

## Reuse boundary

```text
repository
   contains
packages
   are consumed/versioned independently
```

Git submodules are not the dependency mechanism. Cross-repository reuse must use published/versioned packages or the canonical HTTP API.

## Change control

A locked decision can change only through a new ADR documenting motivation, impact, migration, rollback, affected repositories, and compatibility risk.

## Canonicality

This constitution is active. Section-specific artifacts may elaborate it but may not contradict it. Historical/superseded artifacts must be explicitly marked.
