# ADR-021 — Latest-Supported Runtime Compatibility

Status: LOCKED
Date: 2026-08-30

## Decision

MoonWitness adopts a **latest-supported production runtime** policy, not a blind "latest release everywhere" policy.

For the current Vercel target:

- Node.js 24.x is the production/serverless baseline.
- Node.js 26.x is the current Node.js release line, but is not the production baseline until Vercel Functions officially exposes it as a supported Node runtime for the target projects.

Exact patch versions are upgraded through CI compatibility checks.

## Rationale

The ecosystem must remain portable across Vercel serverless and Docker/VPS production. A runtime that is newer but unsupported by a mandatory deployment target is not an architecture improvement.

## Consequences

- Local development should match the production baseline by default.
- Newer runtime testing may run as a non-blocking compatibility matrix.
- Domain packages remain runtime-neutral where practical.
- Every runtime upgrade requires typecheck, unit, integration, contract, build and deployment verification.

## Exit condition

When Vercel Functions officially supports Node 26.x for the target deployment path, the baseline may be promoted by a routine ADR update after compatibility verification.
