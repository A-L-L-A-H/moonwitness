# 00 — Constitution

Non-negotiable platform rules. Any implementation that conflicts with this section requires an approved ADR before coding.

## Core invariants

- One owner per capability.
- One canonical contract per capability.
- One canonical network entry point: HTTPS + OpenAPI.
- Reusable code is distributed as versioned packages.
- Database schemas are private implementation details.
- UI never becomes the domain source of truth.
- Transport adapters never duplicate business logic.
- Research output must retain provenance and reproducibility metadata.
- Security and authorization apply consistently across API and adapters.
- Architecture changes are explicit, reviewable, and versioned.

## Exception rule

An exception is not a convenience. It must identify the problem, explain why the baseline cannot solve it, quantify the operational cost, name the owner, and define rollback/deprecation conditions.
