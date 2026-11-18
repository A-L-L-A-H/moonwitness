# @moonwitness/mid

MoonWitness Identity (MID) OIDC / OAuth provider module (`createMidHandler`, `midFastifyPlugin`, crypto, audience & portal helpers), consolidated from retired `apps/mid` into a reusable workspace package mounted inside `apps/api` ([ADR-006](../../docs/architecture/adr-006-three-app-topology-and-trust-zones.md)).

## Exports (`src/index.ts`)

- Default Worker-compatible handler (`createMidHandler`)
- Fastify mount plugin (`midFastifyPlugin`, `MidFastifyPluginOptions`) configured with `createD1DatabaseFromOrm(getDb())`
- Crypto, DB helpers, audience policy helpers, and TypeScript types (`./crypto`, `./db`, `./types`, `./audience`)

## Scripts

```sh
pnpm --filter @moonwitness/mid build      # tsup
pnpm --filter @moonwitness/mid lint       # eslint src
pnpm --filter @moonwitness/mid typecheck  # tsc --noEmit
pnpm --filter @moonwitness/mid test       # vitest run (crypto.test.ts, mid.test.ts, plugin.test.ts)
```

## Ownership & References

- **Owner:** Identity & Security Platform (`packages/mid`)
- **Policy:** [MID-AUDIENCE-POLICY.md](../../docs/engineering/MID-AUDIENCE-POLICY.md), [SECURITY.md](../../docs/engineering/SECURITY.md)
