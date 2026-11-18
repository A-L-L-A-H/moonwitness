# @moonwitness/cli

MoonWitness internal CLI workspace (`0.1.0`), consolidated from retired `apps/cli` (`tsup` build).

## Exports (`src/index.ts`)

- Argument parser and runner: `parseCliArgs`, `runCli`
- Auth & status commands: `runLoginCommand`, `runLogoutCommand`, `runStatusCommand`, `runTokenCommand`, `runWhoamiCommand`, `resolveValidCredentials`, `openSystemBrowser`
- Loopback OAuth callback & credential store: `startLoopbackCallbackServer`, `loadCredentials`, `saveCredentials`, `clearCredentials`, `resolveCredentialsPath`
- Dependencies: `@moonwitness/core`

## Scripts

```sh
pnpm --filter @moonwitness/cli build      # tsup
pnpm --filter @moonwitness/cli lint       # eslint src
pnpm --filter @moonwitness/cli typecheck  # tsc --noEmit
pnpm --filter @moonwitness/cli test       # vitest run (cli.test.ts)
```

## Ownership

- **Owner:** Developer Experience & Platform CLI (`packages/cli`)
- **Governance:** [DOCUMENTATION_GOVERNANCE_CONTRACT.md](../../docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md)
