# 13 — Deployment

MoonWitness uses separate deployment targets for the canonical platform API and the public Web application.

## Canonical deployment paths

```text
BACKEND / PLATFORM API
GitHub
  ↓
GitHub Actions CI
  ↓
GHCR immutable image
  ↓
Coolify
  ↓
Docker Compose
  ↓
moonwitness-api

PRIMARY PUBLIC WEB
GitHub public repository
  ↓
Vercel
  ↓
moonwitness-wheremythfadetolegend
```

The platform API uses Coolify as the current production deployment target. PostgreSQL is a private persistence dependency behind `moonwitness-api`; applications and browser clients do not access the database directly.

The primary public Web is `moonwitness-wheremythfadetolegend`. It is independently deployable and may consume the canonical API through `moonwitness-sdk` / MoonClient. Historical frozen observatory data remains repository-backed and versioned.

`moonwitness-web` is the legacy public Web application and is currently paused. VPS deployment is paused and is not the active production target.

The runtime must not depend on Vercel-specific APIs. Production deployment must remain reproducible from versioned artifacts and explicit environment configuration.