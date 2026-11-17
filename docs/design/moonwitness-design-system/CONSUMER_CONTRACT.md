# Consumer Integration Contract

## Dependency direction

```text
moonwitness-design-system
        ↓
frontend integration layers / product apps
        ↓
MoonWitness domain/business data
```

Never introduce a reverse dependency from this repository into an application, API client, database layer, authentication package or domain repository.

## Allowed in design-system

- semantic tokens and themes
- presentation primitives
- interaction behavior
- accessibility contracts
- generic data visualization inputs
- generic map/evidence/observatory compositions
- Storybook specimens

## Forbidden in design-system

- product API endpoints
- database schemas
- user/session/auth contracts
- MoonWitness business workflow state machines
- direct fetch calls to product data
- hard-coded consumer route names as component requirements
- frozen research facts inside reusable runtime components

Storybook may use illustrative/sample values; those values are never production truth.

## Consumer example

```tsx
<MoonWitnessProvider theme="myth-fade">
  <ApplicationShell label="WHERE MYTH FADE TO LEGEND">
    <ResearchInstrument />
  </ApplicationShell>
</MoonWitnessProvider>
```

The consumer may then compose `MapRift`, `EvidenceSpine`, `TruthAperture`, `RevelationLens`, and other primitives around canonical consumer data.

## Migration rule

When an application already owns an equivalent component:

1. audit semantics and behavior
2. keep application business/data binding
3. replace only the visual/interaction primitive
4. preserve tests and accessibility
5. remove the duplicate only after the shared replacement is verified

Do not perform a big-bang rewrite solely for visual consistency.

## Theme & skin isolation rule

Consumers consume `@moonwitness/ui` via `<SkinRoot dnaId="...">` (or route-scoped `<SkinScope dnaId="...">`) and import the scoped CSS skin (`@moonwitness/ui/skins/imperium.css`).

```text
appearance + brand theme (`[data-dna]`) + semantic state
                        ↓
              centralized tokens (`packages/ui`)
                        ↓
           reusable component contract (`@moonwitness/ui/imperium`)
```

To add a new world visual identity:
1. Define its `MasterDnaWorldSpec` in `packages/ui/src/skin/dna-worlds.tsx` and document its DNA file under `docs/dna/`.
2. Scope all CSS overrides under `[data-dna="<id>"]` (never `:root`, `html`, or `body`) to guarantee zero cross-app leakage.
3. Verify WCAG AA contrast ratios via `pnpm ui:contrast` and unit/visual tests via `pnpm --filter @moonwitness/ui test`.

Consumers must never duplicate authoritative token files locally or inject un-scoped global styles that alter sibling skins.
