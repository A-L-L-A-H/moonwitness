# @moonwitness/core

Core shared TypeScript utilities: environment parsing (`parseEnv` + `z` re-export), `Result` (`ok`, `err`), formatting (`formatDate`, `formatNumber`, `slugify`), and MID OIDC PKCE / JWKS / ES256 JWT verification helpers (`src/oidc.ts`).

## Exports & Dependencies

- `.` -> `./src/index.ts` (`src/env.ts`, `src/format.ts`, `src/result.ts`, `src/oidc.ts`)
- Dependencies: `zod`

## Scripts

```sh
pnpm --filter @moonwitness/core lint       # eslint src
pnpm --filter @moonwitness/core typecheck  # tsc --noEmit
pnpm --filter @moonwitness/core test       # vitest run (index.test.ts, oidc.test.ts)
```

## Ownership

- **Owner:** Shared Platform Core (`packages/core`)
- **Governance:** [DOCUMENTATION_GOVERNANCE_CONTRACT.md](../../docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md)
