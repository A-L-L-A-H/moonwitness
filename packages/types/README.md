# @moonwitness/types

Shared leaf TypeScript domain types consumed by UI, assets, schema, contracts, ORM, and apps (`0.0.0`). Zero workspace dependencies to avoid dependency cycles.

## Exports (`src/index.ts`)

Defines core domain interfaces and unions including `ArtKey`, `EraId`, `EventKind`, `Era`, `TimelineEvent`, `Module`, `ModuleStat`, `ProjectStatus`, `Project`, `WorkflowStatus`, `Workflow`, `FeedItem`, `AlertLevel`, `MissionAlert`, `Witness`, `ItemStatus`, `PipelineStage`, `StatTone`, and `UniverseStat`.

## Scripts

```sh
pnpm --filter @moonwitness/types lint       # eslint src
pnpm --filter @moonwitness/types typecheck  # tsc --noEmit
```

## Ownership

- **Owner:** Domain Architecture & Shared Core (`packages/types`)
- **Governance:** [DOCUMENTATION_GOVERNANCE_CONTRACT.md](../../docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md)
