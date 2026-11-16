# MoonWitness Blueprint — Design Freeze Declaration v1

Status: **DESIGN FROZEN / IMPLEMENTATION GATED**
Date: 2026-08-30

## Purpose

This declaration freezes the architectural design of the MoonWitness Gen2 ecosystem. It does not certify implementation, runtime behavior, production performance, or deployment evidence.

## Frozen decisions

- `ArsyBelovedLabs/moonwitness-blueprint` is the architecture source of truth.
- Five legacy repositories remain evidence only: `bjo163/moonwitness@dev`, `bjo163/moonwitness-corpus@dev`, `bjo163/cosmic@dev`, `bjo163/ALLAH-CRAYON-RGBL-ENGINE@dev`, `bjo163/propetic@main`.
- One capability has one canonical owner.
- One capability has one canonical contract.
- External network access uses one canonical door: HTTPS + OpenAPI through `moonwitness-api`.
- SSE is an HTTP streaming mode; gRPC, MCP, WebSocket are conditional adapters only; tRPC and GraphQL are not ecosystem standards.
- Reuse is package-first. Git submodules are not a dependency mechanism.
- Domain/data ownership is private to the owning capability/service.
- Serverless and Docker execute the same application/domain behavior through thin host adapters.
- The backend platform production target is Coolify + Docker Compose; the primary public Web deployment target is Vercel for `moonwitness-wheremythfadetolegend`.
- The primary public Web application is `ArsyBelovedLabs/moonwitness-wheremythfadetolegend`; `ArsyBelovedLabs/moonwitness-web` is the legacy public Web application and is paused. See ADR-025.
- The primary public Web may combine frozen historical repository-backed data with live platform data. Historical data uses versioned GitHub data through an application data adapter; live capabilities use `moonwitness-sdk` / MoonClient through `moonwitness-api`.
- The primary Web must not access PostgreSQL directly and must not depend on Coolify internals or private backend credentials.
- Toolchain follows latest-supported-by-target policy, not blind latest.
- Delivery/work management uses GitHub Issues, branches, pull requests, and GitHub Actions; Plane is not part of the architecture.
- Canonical JSON contract wire fields use camelCase; the event envelope includes producer capability, subject, correlation, and trace identity; canonical Problem Details includes required boolean retryability. See ADR-023.
- Reusable private `@arsybelovedlabs/*` packages are distributed through the GitHub Packages npm registry. See ADR-024.
- Canonical API inventory includes bounded readiness and idempotent ResearchRun cancellation in addition to the design-locked operation catalog. See ADR-026.
- Architecture changes after this freeze require a new ADR with impact, migration, rollback, affected repositories, and compatibility risk.

## Allowed post-freeze changes

Post-freeze work may add implementation evidence, fixtures, tests, generated artifacts, benchmarks, and operational configuration without changing architectural decisions.

Any change that alters ownership, public contract, repository topology, protocol strategy, database boundary, deployment architecture, or design-system boundary is an architecture change and requires a new ADR.

ADR-023 is an approved contract correction within the existing ownership/protocol architecture and supersedes the conflicting event/error wire-field definitions identified during Wave 1 pre-implementation validation. It does not introduce a new network door, repository boundary, or persistence boundary.

ADR-024 is an approved package-distribution decision within the existing package-first architecture. It introduces no additional application network door or persistence boundary; GitHub Packages is a delivery mechanism for versioned package artifacts.

ADR-025 is an approved ownership/deployment alignment decision that promotes `moonwitness-wheremythfadetolegend` as the primary public Web application and pauses `moonwitness-web` as the legacy public Web. It does not change domain capability ownership, the canonical HTTPS/OpenAPI network boundary, or the private database boundary.

ADR-026 is an approved additive API-contract reconciliation. It adopts `GET /v1/readiness` and idempotent `POST /v1/research-runs/{researchRunId}/cancel`, keeps HTTPS + OpenAPI as the one network door, and requires executable catalog-to-OpenAPI parity so SDK generation has one complete machine contract.

## Readiness distinction

```text
DESIGN FROZEN
     !=
IMPLEMENTATION READY
     !=
PRODUCTION CERTIFIED
```

Implementation may begin only after the readiness gate says the required preconditions are satisfied. Production certification requires executable evidence.
