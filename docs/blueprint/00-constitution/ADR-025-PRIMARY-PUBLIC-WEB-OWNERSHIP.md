# ADR-025 — Primary Public Web Ownership Transition

Status: **APPROVED / IMPLEMENTATION-ALIGNED**
Date: 2026-08-31

## Decision

The primary public Web application for the MoonWitness ecosystem is:

`ArsyBelovedLabs/moonwitness-wheremythfadetolegend`

`ArsyBelovedLabs/moonwitness-web` becomes the legacy public Web repository and remains paused unless a future ADR reactivates it.

## Context

`moonwitness-wheremythfadetolegend` is the current mature public observatory application. It is independently deployable as a public Web application and owns substantial observatory presentation functionality, historical repository-backed data, a browser runtime, and a public Web deployment target.

The prior blueprint assigned the public-application role to `moonwitness-web`. That no longer reflects the intended active product topology.

## Web integration boundary

The primary Web uses two explicit data paths:

```text
Historical / frozen
  → versioned GitHub data
  → StaticDataAdapter
  → Web

Live / operational
  → moonwitness-sdk / MoonClient
  → moonwitness-api
  → platform services and persistence
```

The Web must not access PostgreSQL directly and must not depend on Coolify internals or private registry credentials.

## UI ownership

`moonwitness-frontend-platform` remains the canonical owner of reusable UI tokens, primitives, and domain UI kits.

The primary Web repository owns application composition and product-specific presentation only.

`moonwitness-design-system` remains a public showcase/compatibility bridge and is not a second canonical UI owner.

## Deployment

The backend platform remains:

```text
GitHub → GitHub Actions → GHCR → Coolify → Docker Compose → moonwitness-api
```

The primary public Web target is:

```text
GitHub public repository → Vercel → moonwitness-wheremythfadetolegend
```

Deployment target declarations are architecture intent; live deployment evidence remains separate.

## Migration / cutover

The Web cutover is additive and capability-scoped:

1. Preserve the existing observatory experience.
2. Keep frozen historical data repository-backed and versioned.
3. Introduce MoonClient for live capabilities already exposed by the canonical API.
4. Do not invent frontend endpoints for capabilities not present in the API contract.
5. Replace legacy Web ownership references only in canonical blueprint maps and contracts.

## Rollback

Rollback is ownership/documentation-level rather than runtime data migration. If implementation cutover is not viable, the previous `moonwitness-web` application may remain paused while `wheremythfadetolegend` continues as the public product candidate under an explicit corrective ADR.

## Affected repositories

- `moonwitness-wheremythfadetolegend`
- `moonwitness-web`
- `moonwitness-frontend-platform`
- `moonwitness-sdk`
- `moonwitness-api`
- `moonwitness-blueprint`

No domain capability owner is changed by this ADR.

## Compatibility risk

Primary risks are public Web dependency reproducibility, public consumption of reusable UI packages, and incremental mapping of live API capabilities. These are implementation concerns and must not weaken the canonical network or database boundaries.
