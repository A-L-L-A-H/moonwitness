# MoonWitness Figma / Showcase Screen Matrix v1

Status: **IMPLEMENTATION-ALIGNED / DESIGN EXECUTION CONTROL**

This matrix controls page-level Figma and generated-showcase work for MoonWitness. It is derived from `APPLICATION-INFORMATION-ARCHITECTURE-V1.md` and does not create product scope.

## Component-first gate

Before any page in this matrix may be redesigned or regenerated, follow `FIGMA-COMPONENT-FIRST-WORKFLOW-V1.md`.

Required component order:

```text
VISUAL CONSTITUTION
  ↓
VARIABLES / TOKENS
  ↓
RAW PRIMITIVES
  ↓
COMPONENTS + VARIANTS
  ↓
DOMAIN INSTRUMENTS
  ↓
PAGE TEMPLATES
```

Until the required masters for a page family are ready, its visual-generation status is:

`BLOCKED_BY_COMPONENT_SYSTEM`

Existing generated images remain archive/reference material only and must not be used to redefine component geometry or navigation.

## UX-flow gate

After component readiness and before application-page composition, follow `USER-FLOW-AND-INTERACTION-MODEL-V1.md`.

Every page must define its authorized entry, primary user task, dominant instrument, selectable object, contextual-detail behavior, return/back path, state preservation, loading/empty/partial/offline/error behavior, evidence/source traversal, responsive recomposition and keyboard/focus behavior.

Until those applicable interaction questions are answered, its design status is:

`BLOCKED_BY_UX_FLOW`

A page may become a golden Storybook/Figma/showcase target only when **both** `BLOCKED_BY_COMPONENT_SYSTEM` and `BLOCKED_BY_UX_FLOW` are cleared.

The active public Web has no separate ninth `Home` route. Its first-view **Observatory Home Experience** is the default Monthly Report landing state (`MYTH-01`) unless a future product decision explicitly creates another route.

Combined execution order:

```text
VISUAL CONSTITUTION
  ↓
VARIABLES / TOKENS
  ↓
RAW PRIMITIVES
  ↓
COMPONENTS + VARIANTS
  ↓
DOMAIN INSTRUMENTS
  ↓
PAGE TEMPLATES
  ↓
USER FLOW / INTERACTION MODEL
  ↓
APPLICATION PAGES
  ↓
RESPONSIVE STATES
  ↓
GENERATED SHOWCASE IMAGES
```

## Authority and interpretation

Use the following order when deciding whether a screen may be treated as canonical product UI:

1. Design Freeze and ADR-025.
2. Canonical API and application contracts.
3. `APPLICATION-INFORMATION-ARCHITECTURE-V1.md`.
4. `FIGMA-COMPONENT-FIRST-WORKFLOW-V1.md`.
5. `USER-FLOW-AND-INTERACTION-MODEL-V1.md`.
6. Actual application implementation.
7. This matrix.
8. Storybook, Figma, and generated showcase images as visual references only.

Core rule:

> **Capabilities power screens. Applications own navigation. Objects own drill-down. Components define visual consistency. Evidence owns trust. Images do not create features.**

## Status vocabulary

### Product maturity

- **EXISTING** — backed by an implemented application surface today.
- **ALIGNED TARGET** — compatible with current application/API contracts but not fully implemented as a page/surface.
- **GATED FUTURE** — requires a later authorized application/capability phase; must never be shown as current functionality.
- **COMPONENT ONLY** — reusable visual/platform reference; not a product page.

### Image status

- **DONE_REFERENCE** — a curated reference image exists and is usable as a visual starting point; implementation fidelity must still be verified.
- **PARTIAL_REFERENCE** — a related image exists, but it does not fully represent the canonical page.
- **NEED_REWORK** — an image exists but should be regenerated/recomposed before becoming a golden page reference.
- **NOT_GENERATED** — no dedicated one-page/one-screen reference exists yet.
- **NOT_REQUIRED** — no page-level image is required.

### Generation priority

- **P0** — first page family after component and UX-flow gates are satisfied.
- **P1** — next contextual/detail surface after both readiness gates are satisfied.
- **P2** — secondary operational/target surface.
- **P3** — gated future concept; do not present as current product.

## Family A — WHERE MYTH FADE TO LEGEND

Application: `moonwitness-wheremythfadetolegend`

Architecture role: primary public Web.

Maturity: **ACTIVE**.

The app is a Counter-Mythos Observatory within MoonWitness, not the entirety of the MoonWitness platform.

| ID | Screen | Maturity | Current authority | Primary capability/data expression | Image status | Existing curated reference | Priority | Design note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MYTH-01 | Monthly Report — August 2026 | EXISTING | `#report/2026-08` | frozen historical report/data adapter | NEED_REWORK | `07_reports.png` | P0 | Default Observatory Home Experience; dedicated August 2026 golden page; distinguish `FROZEN BASELINE` from live state. Do not add a separate Home route. |
| MYTH-02 | Observation Ledger | EXISTING | report contains complete observation ledger | frozen historical observations | NOT_GENERATED | — | P0 | Dense evidence/research instrument, not generic table dashboard. |
| MYTH-03 | Observation Detail / Inspector | EXISTING | implemented detail/drawer pattern | observation + source/revelation context | NOT_GENERATED | — | P1 | Contextual detail, not a new top-level nav item; preserve parent report/map/filter context. |
| MYTH-04 | Spread Map | EXISTING | `#spread-map` | historical observation geography | NOT_GENERATED | — | P0 | Observation geography only; do not confuse with Disaster Map. Selection returns to same map/filter context. |
| MYTH-05 | Disaster Map | EXISTING | `#disaster-map` | independent disaster dataset | DONE_REFERENCE | `06_disaster_map.png` | P0 | Title must remain **Disaster Map**. Preserve causality guardrail and separate event facts, proximity and causal review. |
| MYTH-06 | Correlation Engine | EXISTING | `#correlation` | deterministic temporal/geographic proximity + reviewed causality | PARTIAL_REFERENCE | `05_chronology_track.png` | P0 | Needs a full-page CausalityLattice/Correlation golden screen, not timeline alone. |
| MYTH-07 | Chronology / Timeline Detail | EXISTING | correlation/timeline surface | temporal sequence | DONE_REFERENCE | `05_chronology_track.png` | P1 | Contextual chronology instrument under correlation analysis. |
| MYTH-08 | Practice-Level Review | EXISTING | `#review` | reviewed practice-level issues | NOT_GENERATED | — | P0 | Must state **PRACTICE-LEVEL REVIEW ONLY**; no person/faith judgment. |
| MYTH-09 | Evidence Ledger | EXISTING | `#evidence` | evidence/source ledger | DONE_REFERENCE | `04_evidence_ledger.png` | P0 | Evidence-first traversal; show source quality separately from other scoring. |
| MYTH-10 | Evidence Detail / Inspector | EXISTING | evidence detail/drawer behavior | evidence + source/provenance context | NOT_GENERATED | — | P1 | One evidence object, clear source metadata and analytic use; close/back restores query/filter context. |
| MYTH-11 | Four Revelation Lens | EXISTING | `#revelation` | four source channels | NOT_GENERATED | — | P0 | Exactly four: Al-Qur'an, Injil/Gospel, Taurat/Torah, Zabur/Psalms. |
| MYTH-12 | Revelation Lens Detail | ALIGNED TARGET | contextual detail may be composed from current revelation surface | one selected revelation channel | NOT_GENERATED | — | P1 | Keep all-four orientation visible; detail does not create a fifth lens. |
| MYTH-13 | Candidate Pipeline | EXISTING | `#pipeline` | candidate monitoring/promotion states | NOT_GENERATED | — | P0 | Use actual application candidate states; do not invent a prettier lifecycle or imply automatic publication. |
| MYTH-14 | Candidate Detail / Witness Inspector | ALIGNED TARGET | contextual candidate detail | candidate evidence + status | NOT_GENERATED | — | P1 | Drill-down from pipeline; not a new top-level route; return preserves pipeline filter/state. |
| MYTH-15 | Archive Search | ALIGNED TARGET | read-only `/api/search` exists; no canonical top-level route today | application historical search | NOT_GENERATED | — | P1 | Search surface is compatible, but must not be claimed as current top-level navigation until implemented. |

### Public-Web mandatory visual contracts

- Historical/frozen state and live operational state must remain visibly different.
- August 2026 frozen data must not be rewritten for visual convenience.
- Exact causality guardrail where relevant: **`Temporal/geographic proximity does not establish causation.`**
- Disaster Map and observation Spread Map remain independent concepts.
- Four Revelation Lens remains exactly four.
- Practice review remains practice-level only.
- Default public entry is `MYTH-01`; do not invent a separate `Home` top-level route.
- Contextual detail must have a clear return path and preserve parent task state where practical.

## Family B — COMMAND CENTER

Application: `moonwitness-commandcenter`

Architecture role: operations/research application.

Maturity: **HOLD; deployable boundary shell implemented**.

Current top-level navigation is exactly: **Overview, Research Runs, Operations, Settings**.

| ID | Screen | Maturity | Current authority | Capability/object expression | Image status | Existing curated reference | Priority | Design note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CC-01 | Overview | EXISTING | current shell route | service posture + research control summary | NEED_REWORK | `02_command_center.png` | P0 | Regenerate to match the actual four-route Command Center contract. |
| CC-02 | Research Runs | EXISTING | current shell route | Research Run list/queue boundary | NOT_GENERATED | — | P0 | Current actions remain capability-gated; empty/ready state is legitimate. |
| CC-03 | Operations | EXISTING | current shell route | health/operational posture | NOT_GENERATED | — | P0 | Boundary/health view, not a fake full SRE console. |
| CC-04 | Settings | EXISTING | current shell route | API origin/environment boundary settings | NOT_GENERATED | — | P1 | Do not reuse Theme Lab image as if it were this product page. |
| CC-05 | Research Run Detail | ALIGNED TARGET | canonical Research Run get operation | Research Run object | NOT_GENERATED | — | P1 | Object-first workspace; entry point for contextual operational detail. |
| CC-06 | Research Run Events / Timeline | ALIGNED TARGET | canonical Research Run SSE events | run events / trace sequence | NOT_GENERATED | — | P1 | Timeline attached to a run, not a top-level repository menu. |
| CC-07 | Workflow Detail | ALIGNED TARGET | canonical workflow create/get/cancel | Workflow object/state | NOT_GENERATED | — | P2 | Contextual drill-down under a run/operation. |
| CC-08 | Job Detail / Retry State | ALIGNED TARGET | canonical jobs get/list | Job state/retry execution | NOT_GENERATED | — | P2 | Use canonical job state machine; do not invent arbitrary statuses. |
| CC-09 | Analysis Result | ALIGNED TARGET | canonical analysis submission via Research Run | Cosmic analysis result + evidence | NOT_GENERATED | — | P1 | Semantic/Temporal/Mizan/Explanation are result instruments, not global engine menus. |
| CC-10 | Evidence + Provenance Drill-down | ALIGNED TARGET | evidence get/list + provenance contract | Evidence/Provenance objects | NOT_GENERATED | — | P1 | Evidence-first contextual view attached to execution/result. |
| CC-11 | Knowledge Search / Document | ALIGNED TARGET | knowledge search/get operations | Corpus-backed knowledge view | NOT_GENERATED | — | P2 | Legitimate target because canonical API exposes knowledge search/get. |

### Command Center exclusions

Do not create top-level menus named `Cosmic`, `Corpus`, `Runtime`, `Worker`, `API`, `SDK`, or `Prophetic` merely because those repositories/capabilities exist.

Prophetic-specific Command Center routes remain gated because there is no canonical prophetic API resource today.

Research Run drill-down must follow the object-first UX in `USER-FLOW-AND-INTERACTION-MODEL-V1.md`, including canonical Research Run and Job state machines, return paths and evidence/provenance traversal.

## Family C — CRAYON LAB

Application: `moonwitness-crayon-lab`

Architecture role: methodology/research application.

Maturity: **FOUNDATION / TARGET UX**.

Every frame in this family must visibly carry **TARGET / FUTURE** until implementation and capability integration exist.

| ID | Screen | Maturity | Capability expression | Image status | Priority | Design note |
| --- | --- | --- | --- | --- | --- | --- |
| CRAYON-01 | Laboratory Home | GATED FUTURE | methodology workspace entry | NOT_GENERATED | P3 | Do not present as deployed/current product. |
| CRAYON-02 | Research Workspace | GATED FUTURE | task/input/run composition | NOT_GENERATED | P3 | UI owns composition; methodology computation remains in `moonwitness-crayon`. |
| CRAYON-03 | Methodology | GATED FUTURE | research method | NOT_GENERATED | P3 | Method definition/version context. |
| CRAYON-04 | Measurement | GATED FUTURE | measurement | NOT_GENERATED | P3 | Measurement instrument, not generic KPI cards. |
| CRAYON-05 | Evaluation | GATED FUTURE | evaluation/scoring | NOT_GENERATED | P3 | Must preserve evaluation provenance/versioning once implemented. |
| CRAYON-06 | Robustness | GATED FUTURE | robustness | NOT_GENERATED | P3 | Scientific/research treatment, not a decorative confidence meter. |
| CRAYON-07 | Run Result | GATED FUTURE | methodology result | NOT_GENERATED | P3 | Result surface requires implemented integration before becoming active. |
| CRAYON-08 | Comparison | GATED FUTURE | run/method comparison | NOT_GENERATED | P3 | Future comparative research workspace. |

## Family D — SHARED PLATFORM / SHOWCASE REFERENCES

These references help Figma/Storybook/component development but do not automatically become application pages.

| ID | Reference | Maturity | Image status | Existing curated reference | Priority | Classification note |
| --- | --- | --- | --- | --- | --- | --- |
| SHARED-01 | Login / Archive Access | GATED FUTURE | DONE_REFERENCE | `01_login_archive_access.png` | P2 | Authentication concept only; no canonical global login/app-launcher page is defined today. |
| SHARED-02 | Celestial Observatory | COMPONENT ONLY | DONE_REFERENCE | `03_celestial_observatory.png` | P2 | Useful OrbitalCore/TemporalOrrery showcase; not a current public route. |
| SHARED-03 | Mobile Instrument Mode | COMPONENT ONLY | DONE_REFERENCE | `08_mobile_instrument_mode.png` | P1 | Responsive composition reference, not an independent product route. |
| SHARED-04 | Component Library | COMPONENT ONLY | DONE_REFERENCE | `09_component_library.png` | P2 | Platform/showcase primitive reference. |
| SHARED-05 | Data Visualizations | COMPONENT ONLY | DONE_REFERENCE | `10_data_visualizations.png` | P2 | Signature data-instrument reference only. |
| SHARED-06 | Theme / Visual Lab | COMPONENT ONLY | NEED_REWORK | `11_settings_theme_lab.png` | P2 | Keep as showcase/theme exploration; never substitute it for Command Center Settings. |
| SHARED-07 | Loading | COMPONENT ONLY | NOT_GENERATED | — | P1 | Required reusable state. |
| SHARED-08 | Empty | COMPONENT ONLY | NOT_GENERATED | — | P1 | Required reusable state. |
| SHARED-09 | Error | COMPONENT ONLY | NOT_GENERATED | — | P1 | Required reusable state. |
| SHARED-10 | Partial / Offline | COMPONENT ONLY | NOT_GENERATED | — | P1 | Required by UI-platform state contract. |
| SHARED-11 | Warning / Degraded | COMPONENT ONLY | NOT_GENERATED | — | P1 | Operational state must not rely on color alone. |
| SHARED-12 | Inspector / Drawer | COMPONENT ONLY | NOT_GENERATED | — | P1 | Reusable contextual-detail pattern across applications. |

## Current curated-image classification

The current `moonwitness-design-system/dev/docs/showcase/` set maps as follows:

| Curated file | Matrix use | Decision |
| --- | --- | --- |
| `01_login_archive_access.png` | SHARED-01 | keep as gated authentication concept only |
| `02_command_center.png` | CC-01 | keep as reference, but regenerate to current four-route IA after readiness gates |
| `03_celestial_observatory.png` | SHARED-02 | keep as component/showcase reference only |
| `04_evidence_ledger.png` | MYTH-09 | keep as current Evidence Ledger reference, subject to component + UX verification |
| `05_chronology_track.png` | MYTH-06 / MYTH-07 | keep for chronology; insufficient as full Correlation Engine page |
| `06_disaster_map.png` | MYTH-05 | keep as Disaster Map reference, subject to component + UX verification |
| `07_reports.png` | MYTH-01 | keep as reference but regenerate dedicated August 2026 golden page after readiness gates |
| `08_mobile_instrument_mode.png` | SHARED-03 | keep as responsive component/showcase reference |
| `09_component_library.png` | SHARED-04 | keep as component-only reference |
| `10_data_visualizations.png` | SHARED-05 | keep as component-only reference |
| `11_settings_theme_lab.png` | SHARED-06 | reclassify as Theme/Visual Lab; do not use as Command Center Settings |

## Generation queue — currently gated

The queue below is the order **after both component-system and UX-flow readiness gates are satisfied**. It is not authorization to generate pages immediately.

Generate exactly one screen per image. No contact-sheet/collage output is accepted as the golden reference for an individual screen.

### Wave 1 — active public surfaces

1. `MYTH-04` — Spread Map.
2. `MYTH-08` — Practice-Level Review.
3. `MYTH-11` — Four Revelation Lens.
4. `MYTH-13` — Candidate Pipeline.
5. `MYTH-02` — Observation Ledger.
6. `MYTH-06` — full Correlation Engine.
7. `MYTH-01` — dedicated August 2026 Monthly Report / Observatory Home Experience rework.

### Wave 2 — public detail surfaces

8. `MYTH-03` — Observation Detail / Inspector.
9. `MYTH-10` — Evidence Detail / Inspector.
10. `MYTH-12` — Revelation Lens Detail.
11. `MYTH-14` — Candidate Detail.
12. `MYTH-15` — Archive Search target.

### Wave 3 — current Command Center

13. `CC-01` — Overview rework against actual four-route IA.
14. `CC-02` — Research Runs.
15. `CC-03` — Operations.
16. `CC-04` — Settings.

### Wave 4 — contract-aligned Command Center drill-downs

17. `CC-05` — Research Run Detail.
18. `CC-06` — Research Run Events / Timeline.
19. `CC-09` — Analysis Result.
20. `CC-10` — Evidence + Provenance.
21. `CC-07` — Workflow Detail.
22. `CC-08` — Job Detail.
23. `CC-11` — Knowledge Search / Document.

### Wave 5 — reusable state references

24. `SHARED-07` — Loading.
25. `SHARED-08` — Empty.
26. `SHARED-09` — Error.
27. `SHARED-10` — Partial / Offline.
28. `SHARED-11` — Warning / Degraded.
29. `SHARED-12` — Inspector / Drawer.

### Wave 6 — gated future concepts

CRAYON Lab screens and authentication/cross-application concepts may be generated for exploration only after they are clearly marked **TARGET / FUTURE**. They must not displace active-public or current-Command-Center work.

## Figma / Storybook organization

Figma and Storybook page structure must follow both `FIGMA-COMPONENT-FIRST-WORKFLOW-V1.md` and `USER-FLOW-AND-INTERACTION-MODEL-V1.md`. Raw primitives, components, variants, domain instruments, templates, UX-flow specimens, application pages and deprecated/experimental work must remain distinguishable.
