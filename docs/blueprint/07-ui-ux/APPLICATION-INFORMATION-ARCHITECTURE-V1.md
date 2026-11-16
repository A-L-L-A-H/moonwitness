# MoonWitness Application Information Architecture v1

Status: **IMPLEMENTATION-ALIGNED / POST-FREEZE CLARIFICATION**

This artifact clarifies how the frozen MoonWitness Gen2 architecture maps to application navigation and Figma/showcase work. It does **not** change capability ownership, repository topology, network boundaries, persistence boundaries, deployment architecture, or canonical UI-platform ownership.

Authority order for conflicts:

1. `00-constitution/DESIGN-FREEZE-DECLARATION-V1.md`
2. `00-constitution/ADR-025-PRIMARY-PUBLIC-WEB-OWNERSHIP.md`
3. `00-constitution/ARCHITECTURE-TRUTH-V1.md`
4. canonical section contracts in `02-domain/`, `06-api/`, `07-ui-ux/`, and `16-repositories/`
5. this implementation-aligned IA clarification

## Core IA rule

> **Capabilities power screens. Applications own navigation.**

Repository names and capability names are not automatically top-level menu items.

Examples:

- `moonwitness-cosmic` owns intelligence capabilities, but `Cosmic` is not automatically a global navigation destination.
- `moonwitness-corpus` owns knowledge capabilities, but internal ingestion/materialization is not automatically public navigation.
- `moonwitness-runtime` and `moonwitness-worker` own workflow/job behavior, but their objects should normally appear in the Command Center as contextual operational views.
- `moonwitness-prophetic` is a bounded domain capability; it does not become an active application route unless an authorized application/API surface exposes it.

## Application maturity matrix

| Application | Architecture role | Current maturity | Navigation authority |
| --- | --- | --- | --- |
| `moonwitness-wheremythfadetolegend` | primary public Web | **ACTIVE** | current public routes + app composition |
| `moonwitness-commandcenter` | operations/research application | **HOLD; boundary shell implemented** | current implemented shell; future drill-downs gated by canonical API capability |
| `moonwitness-crayon-lab` | methodology/research application | **FOUNDATION / TARGET UX** | future Figma/application design must not be presented as implemented behavior |
| `moonwitness-web` | legacy public Web | **PAUSED** | no active product-navigation authority |

## Primary public Web — current active surface

The canonical public Web is `moonwitness-wheremythfadetolegend` under ADR-025.

Current top-level product routes are:

- Monthly Report
- Spread Map
- Disaster Map
- Correlation / Timeline
- Practice-Level Review
- Evidence
- Four Revelation Lens
- Candidate Pipeline

Application-specific detail views may be composed around these routes, but new live capability routes must not be invented unless the canonical API exposes the required capability.

The public Web is a counter-mythos observatory application within MoonWitness; it must not be presented as the entirety of the MoonWitness platform.

## Command Center — current and target surface

Current implemented top-level navigation is exactly:

1. Overview
2. Research Runs
3. Operations
4. Settings

The architecture status remains **HOLD** even though the boundary shell exists.

Future operational objects should prefer contextual drill-down from Research Runs or Operations rather than turning repository/capability names into a flat sidebar. When supported by canonical API operations, a Research Run detail may expose:

- run overview
- run events / timeline
- workflow state
- jobs and retry state
- analysis result
- evidence
- provenance

Knowledge Search / Knowledge Document views are legitimate future application surfaces because the canonical API exposes knowledge search/get operations. Analysis submission/result is legitimate because the canonical API exposes analysis submission through Research Runs.

Prophetic-specific routes are **not** current active Command Center navigation because there is no canonical prophetic API resource today.

## CRAYON Lab — target only

`moonwitness-crayon-lab` is a real application boundary but currently remains foundation-stage.

Figma may explore target surfaces such as:

- Laboratory Home
- Research Workspace
- Methodology
- Measurement
- Evaluation
- Robustness
- Run Result
- Comparison

Every such frame must be labeled **TARGET / FUTURE** until corresponding application behavior and canonical capability integration are implemented.

Scoring, evaluation, methodology, and robustness remain owned by `moonwitness-crayon`; the Lab application owns user experience and composition only.

## Capability-to-UI mapping

| Capability owner | UI expression | Navigation guidance |
| --- | --- | --- |
| Core | IDs, contracts, errors, provenance semantics | component/state semantics, not top-level nav |
| Corpus | knowledge search/document/source support | expose only through authorized application/API views |
| Cosmic | semantic, temporal, Mizan, explanation, analysis | analysis-result instruments; not automatic global nav |
| Crayon | methodology, measurement, scoring, robustness, evaluation | CRAYON Lab target surfaces; engine remains outside UI |
| Prophetic | bounded prophetic research | gated domain workspace only when an application/API surface authorizes it |
| Runtime | Research Run / Workflow orchestration | Command Center contextual operational views |
| Worker | Job / retry / async execution | Command Center operations and run-detail views |
| API / SDK | canonical transport/client | never presented as ordinary public product navigation |
| Frontend Platform | tokens, primitives, patterns, domain kits | shared component layer, not an application page |

## Object-first navigation

Operational UX should follow domain objects instead of repository topology.

Preferred relationship:

```text
Research Run
    ↓
Workflow
    ↓
Job
    ↓
Evidence
    ↓
Provenance
```

A Research Run detail may therefore expose Workflow, Job, Analysis, Evidence, and Provenance as tabs/panels/inspector states without requiring all of them to be top-level navigation entries.

Canonical state-machine states must be represented faithfully rather than replaced by arbitrary UI status names.

## Historical versus live data

The primary public Web has two explicit data paths:

```text
HISTORICAL / FROZEN
GitHub-versioned data
→ StaticDataAdapter
→ Web

LIVE / OPERATIONAL
MoonClient / moonwitness-sdk
→ moonwitness-api
→ platform capabilities
```

The UI must make these states distinguishable. Recommended semantic labels include:

- `FROZEN BASELINE`
- `LIVE`
- `CANDIDATE`
- `VERIFIED`

A frozen historical record must not be visually confused with live operational state.

## Figma and showcase status labels

Every page-level Figma/showcase reference should carry one of these maturity labels:

- **EXISTING** — backed by an implemented application surface.
- **ALIGNED TARGET** — compatible with current contracts but not fully implemented.
- **GATED FUTURE** — requires a future authorized capability/application phase.
- **COMPONENT ONLY** — reusable platform/showcase primitive, not a product page.

Generated showcase images are visual references only and do not create product scope.

## Cross-application navigation

A global MoonWitness App Switcher, SSO launcher, or unified cross-application portal is **not currently a canonical requirement**.

It may be explored as a future product concept, but it must not be represented as current architecture truth. If a future implementation changes identity, authorization, deployment, application ownership, or routing boundaries, it requires the appropriate architecture/product decision process and ADR where applicable.

## UI ownership

Canonical reusable UI ownership remains:

```text
moonwitness-frontend-platform
  → tokens
  → primitives
  → patterns
  → reusable domain UI kits

application repositories
  → routes
  → page composition
  → product-specific presentation
```

`moonwitness-design-system` is a public showcase/compatibility bridge and experimental visual reference. It is not a second canonical UI owner.

## Design-system / showcase rule

Storybook, Figma, and curated generated images may explore or demonstrate visual fidelity, but reusable production primitives that become canonical must be promoted to `moonwitness-frontend-platform` under the normal issue/PR/verification workflow.

The exact causality guardrail remains:

> Temporal/geographic proximity does not establish causation.

## Figma / showcase execution control

The page-by-page execution checklist, curated-image classification, maturity state, and one-screen-per-image generation queue are maintained in:

- `FIGMA-SHOWCASE-SCREEN-MATRIX-V1.md`

That matrix is an implementation/design control artifact. It must remain subordinate to this IA and the frozen architecture, and generated images listed there remain references rather than architecture or product-scope authority.
