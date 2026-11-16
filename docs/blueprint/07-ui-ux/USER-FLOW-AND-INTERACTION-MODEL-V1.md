# MoonWitness User Flow and Interaction Model v1

Status: **IMPLEMENTATION-ALIGNED / UX EXECUTION CONTROL**

This document binds the existing application information architecture, component-first workflow, screen matrix, state machines, and implemented application behavior into explicit user flows. It is a UX clarification artifact only. It does **not** create new capabilities, API routes, authentication behavior, application boundaries, cross-application launchers, or product scope.

Authority order remains:

1. `00-constitution/DESIGN-FREEZE-DECLARATION-V1.md`
2. `00-constitution/ADR-025-PRIMARY-PUBLIC-WEB-OWNERSHIP.md`
3. `00-constitution/ARCHITECTURE-TRUTH-V1.md`
4. canonical domain/API/security/UI contracts
5. `APPLICATION-INFORMATION-ARCHITECTURE-V1.md`
6. this UX-flow clarification
7. Storybook, Figma, and generated images as downstream design/review artifacts

## Core UX rules

> **Capabilities power screens. Applications own navigation. Objects own drill-down. Evidence owns trust.**

MoonWitness UX must be:

- **task-first** — navigation starts from the user's product task, not repository names;
- **object-first** — detail follows the selected observation, evidence item, Research Run, workflow, job, candidate, or other authorized object;
- **evidence-first** — claims and analysis must expose source/evidence context without forcing the user through implementation topology;
- **progressively disclosed** — top-level screens stay stable while contextual detail opens inside inspectors, drawers, tabs, or object workspaces;
- **reversible** — every drill-down has a visible return path and must not strand the user;
- **state-explicit** — frozen, live, candidate, verified, loading, partial, offline, error, and disabled states remain distinguishable;
- **guardrail-visible** — proximity or visual adjacency must never be rendered as causal proof;
- **component-first** — UX is composed from canonical primitives, instruments, and templates rather than page-local controls.

## Shared interaction grammar

### 1. Application entry

Each application owns its own entry surface and top-level navigation.

A global MoonWitness App Switcher or universal launcher is not currently canonical.

### 2. Top-level navigation

Top-level navigation changes the user's **task context** and may update the URL/route.

Examples:

- public Web: Monthly Report, Spread Map, Disaster Map, Correlation, Practice-Level Review, Evidence, Four Revelation Lens, Candidate Pipeline;
- Command Center: Overview, Research Runs, Operations, Settings.

Capability/repository names such as Cosmic, Corpus, Runtime, Worker, SDK, API, or Prophetic must not appear as automatic top-level destinations.

### 3. Primary instrument

Every page has one dominant primary instrument or task surface. Supporting metrics, filters, context, evidence and status belong around that instrument rather than competing as equal dashboard cards.

### 4. Contextual drill-down

Selecting an object should normally open contextual detail without changing the product's top-level information architecture.

Preferred forms:

- desktop: right inspector, bounded drawer, object workspace, contextual tabs;
- mobile: bottom sheet / full-height inspector with an explicit back affordance;
- deep-link route: allowed only when the application already supports or intentionally implements a stable object route.

A detail surface must preserve the user's parent context whenever practical: selected month, filters, scroll/viewport context, sort, selected map layer, and previous route.

### 5. Return path

Every contextual surface must provide one clear return operation:

```text
DETAIL / INSPECTOR
      ↓ close / back
PARENT TASK SURFACE
      ↓
prior filter + selection context preserved
```

Browser Back must remain meaningful for route-level transitions. Closing a local inspector must not unexpectedly navigate to another top-level task.

### 6. Evidence traversal

Whenever a screen presents an analytical or review finding, evidence traversal should follow:

```text
FINDING / OBSERVATION / RESULT
          ↓
EVIDENCE OBJECT
          ↓
SOURCE + PROVENANCE
          ↓
external source only when explicitly requested/opened
```

Source reliability, analysis score, practice-review severity, and causality score must remain separate concepts.

### 7. Data-state language

Use explicit semantic state labels where applicable:

- `FROZEN BASELINE`
- `LIVE`
- `CANDIDATE`
- `VERIFIED`
- `PARTIAL`
- `OFFLINE`
- `ERROR`
- `DISABLED`

The current public Web's August 2026 historical dataset must remain visually distinct from live operational data.

## Home / default-entry decision

There is **no separate canonical Home route today** for the primary public Web.

The current default public-Web entry resolves to the Monthly Report / Observatory report experience, with the current implementation defaulting to `report/2026-08` when no valid route is supplied.

For design purposes this may be described as the **Observatory Home Experience**, but it must be implemented/composed as the default Monthly Report landing state unless a future product decision explicitly adds a separate Home route.

Therefore:

```text
PUBLIC ENTRY
   ↓
MONTHLY REPORT / OBSERVATORY LANDING
   ↓
Overview + current dataset state
   ↓
route/task navigation to the eight current public surfaces
```

Do not add a ninth `Home` menu item merely to satisfy a mockup.

---

# Family A — Where Myth Fade to Legend

Application maturity: **ACTIVE**.

## UX-MYTH-00 — Default entry / Observatory Home Experience

**User intent:** understand the current report context and choose the next research task.

```text
Open public Web
   ↓
Resolve requested month or default August 2026
   ↓
Show dataset state: FROZEN BASELINE / repository-grounded
   ↓
Monthly Report overview
   ↓
Primary choices:
Report sections / Spread Map / Disaster Map / Correlation /
Practice Review / Evidence / Four Revelation Lens / Candidate Pipeline
```

The landing screen should answer, without scrolling through the entire report:

1. What dataset/time window am I viewing?
2. Is it frozen historical data or live operational data?
3. What is the dominant research state?
4. What are the available next tasks?
5. Where is the evidence/causality boundary?

The exact guardrail remains:

> Temporal/geographic proximity does not establish causation.

## UX-MYTH-01 — Monthly Report → observation/evidence

```text
Monthly Report
   ↓
Overview / section navigation
   ↓
Observation Ledger
   ↓ select observation
Observation context / inspector when available
   ↓
Evidence / source context
   ↓
Open external source only by explicit user action
   ↓
Back / close → same report section and context
```

The report is an integrated research surface. In-page section navigation may jump between overview, observations, review, geography, disaster context, correlation, evidence and revelation sections without pretending each subsection is a separate application.

## UX-MYTH-02 — Spread Map → observation

**User intent:** locate where published observations are geographically represented.

```text
Spread Map
   ↓
Map instrument + legend + time/month context
   ↓ filter / inspect geography
Select observation marker
   ↓
Observation context
   ↓
Evidence / source
   ↓
Back → same map viewport/filter when practical
```

Rules:

- Spread Map contains observation geography, not disaster semantics.
- Non-local/online observations must not be falsely pinned to a precise location.
- Map information must have a non-map textual/list equivalent for accessibility and verification.

## UX-MYTH-03 — Disaster Map → correlation → evidence

**User intent:** inspect independently sourced disaster context and, if relevant, review measured proximity without turning proximity into causality.

```text
Disaster Map
   ↓
Select independently sourced event
   ↓
Event context / source
   ↓ optional
View measured temporal/geographic relation
   ↓
Correlation / chronology context
   ↓
Reviewed causal finding
   ↓
Evidence / provenance
   ↓
Back → Disaster Map or Correlation parent context
```

Mandatory rule:

> **Temporal/geographic proximity does not establish causation.**

Disaster event facts, proximity measurements, and causal findings must remain separate visual objects.

## UX-MYTH-04 — Correlation / Timeline

**User intent:** examine measured relationships and reviewed causal findings.

```text
Correlation
   ↓
Relation list / lattice / chronology
   ↓ select relation
Relation detail
   ├─ temporal distance
   ├─ geographic distance
   ├─ competing/context explanation
   ├─ reviewed causal finding
   └─ evidence links
   ↓
Evidence / source / provenance
   ↓
Back → same relation set
```

The chronology may be a contextual detail within correlation; it does not need to become another global navigation category.

## UX-MYTH-05 — Practice-Level Review

**User intent:** inspect a practice-level review issue and its supporting context.

```text
Practice-Level Review
   ↓
Issue/severity register
   ↓ select issue
Issue detail
   ↓
Practice/context evidence
   ↓
Relevant Four Revelation references when provided
   ↓
Resolution / review note
   ↓
Back → same review filter/state
```

Mandatory scope language:

> **PRACTICE-LEVEL REVIEW ONLY**

The UI must not infer a judgment on a religion, ethnicity, community, person's faith, or ultimate status.

## UX-MYTH-06 — Evidence Ledger

**User intent:** verify what source material supports the application's published observations/findings.

```text
Evidence
   ↓
Search / filter / source-class view
   ↓ select evidence
Evidence detail
   ├─ title / publisher / date / type
   ├─ source grade / reliability metadata
   ├─ bounded description / analytic use
   └─ provenance/context
   ↓
Open source externally by explicit action
   ↓
Back → evidence query/filter state
```

Evidence Detail is contextual; it does not require another top-level navigation item.

## UX-MYTH-07 — Four Revelation Lens

**User intent:** compare the four authorized textual lenses without collapsing them into one undifferentiated source.

```text
Four Revelation Lens
   ↓
All-four orientation remains visible
   ↓ select one lens/reference
Selected lens context
   ↓
Reference / comparison note
   ↓
Return to all-four orientation
```

Exactly four channels remain visible in the system:

1. Al-Qur'an
2. Injil / Gospel
3. Taurat / Torah
4. Zabur / Psalms

Selecting one lens must not visually create a fifth lens or imply that the others disappeared from the comparison model.

## UX-MYTH-08 — Candidate Pipeline

**User intent:** inspect candidate research signals and their evidence-gated progress.

```text
Candidate Pipeline
   ↓
Candidate register / actual application status
   ↓ select candidate
Candidate context
   ↓
Source/evidence check
   ↓
Analysis/review context when available
   ↓
Publication state only if actually authorized/implemented
   ↓
Back → same pipeline filter/status
```

Rules:

- use the candidate states actually emitted/stored by the application; do not invent attractive workflow labels in Figma;
- automation may surface candidate signals, but a generated design must not imply automatic publication if the application does not provide it;
- empty candidate months are legitimate `EMPTY` states, not a design failure.

## UX-MYTH-09 — Archive/Search target

Maturity: **ALIGNED TARGET**.

The public application exposes read-only search capability, but Archive Search is not currently an authorized top-level route.

Target flow:

```text
Search entry from an authorized surface
   ↓
Query + filters
   ↓
Results grouped by actual object type
   ↓ select result
Existing owning screen / contextual detail
   ↓
Back → search query retained
```

Do not add Archive/Search to global public navigation until the application intentionally implements it.

---

# Family B — Command Center

Application maturity: **HOLD; boundary shell implemented**.

Current top-level navigation remains exactly:

1. Overview
2. Research Runs
3. Operations
4. Settings

## UX-CC-00 — Overview

```text
Enter Command Center
   ↓
Overview
   ├─ service/research posture
   ├─ actionable run summary
   └─ operational warnings
   ↓
Primary next task:
Research Runs or Operations
```

Overview must not become a directory of repositories/capabilities.

## UX-CC-01 — Research Run object workspace

Maturity beyond the current list shell: **ALIGNED TARGET**, gated by canonical API operations.

```text
Research Runs
   ↓ select Research Run
Research Run Detail
   ├─ Overview
   ├─ Events / Timeline
   ├─ Workflow
   ├─ Jobs
   ├─ Analysis Result
   ├─ Evidence
   └─ Provenance
   ↓
contextual child object
   ↓
Back → same Research Run workspace
   ↓
Back → Research Runs list/filter
```

This is the canonical object-first relationship:

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

These objects should normally be contextual tabs/panels/workspaces rather than five new sidebar items.

### Research Run state UX

Represent the locked state machine faithfully:

```text
CREATED → QUEUED → RUNNING → COMPLETED
                        ↘ FAILED
CREATED / QUEUED / RUNNING → CANCELLED
```

`COMPLETED`, `FAILED`, and `CANCELLED` are terminal and must not be visually presented as resumable states unless a separate new object is actually created.

### Job state UX

```text
PENDING → RUNNING → SUCCEEDED
            ↓
         RETRYING → RUNNING
            ↓
          FAILED
PENDING / RUNNING / RETRYING → CANCELLED
```

Do not replace canonical states with decorative status names.

## UX-CC-02 — Operations

```text
Operations
   ↓
System/worker/API posture summary
   ↓ select supported operational object
Context detail
   ↓
logs/trace/health evidence only when exposed by authorized capability
   ↓
Back → Operations
```

Do not design a fake full SRE console where no contract exists.

## UX-CC-03 — Settings

```text
Settings
   ↓
Current implemented environment/API boundary settings
   ↓ change setting
Validation / save result
   ↓
remain in Settings with explicit success/error state
```

Theme Lab showcase imagery must not be substituted for the actual Command Center Settings product surface.

## UX-CC-04 — Knowledge Search target

Maturity: **ALIGNED TARGET** because canonical API knowledge search/get operations exist.

```text
Authorized Command Center entry
   ↓
Knowledge Search
   ↓ query
Knowledge Results
   ↓ select document
Knowledge Document
   ↓ evidence/source/provenance as supported
   ↓
Back → results + query preserved
```

It is not a reason to create a top-level `Corpus` menu.

---

# Family C — CRAYON Lab

Application maturity: **FOUNDATION / GATED FUTURE UX**.

The target UX sequence may be explored as:

```text
Laboratory Home
   ↓
Research Workspace
   ↓
Methodology
   ↓
Measurement
   ↓
Evaluation
   ↓
Robustness
   ↓
Run Result
   ↓
Comparison
```

This is a target design flow, **not implemented product behavior**. Every CRAYON Lab Storybook/Figma frame must carry `TARGET / FUTURE` until the corresponding application integration exists.

The UI owns composition and interaction; `moonwitness-crayon` remains the capability owner for methodology, measurement, scoring, evaluation and robustness.

---

# Shared state flow

Every task surface must support the relevant state progression without changing information architecture:

```text
INITIAL
  ↓
LOADING
  ├─ SUCCESS / CONTENT
  ├─ EMPTY
  ├─ PARTIAL
  ├─ OFFLINE
  └─ ERROR
```

Rules:

- loading must identify what is being synchronized rather than showing decorative indefinite motion only;
- empty must explain whether there are no records, no results for the current filters, or no published data for the selected period;
- partial/offline must preserve already available read-only context when safe;
- error must expose a recovery action where one exists;
- disabled controls must communicate why the action is unavailable when that reason matters to the task;
- state must not rely on color alone.

# Filter and selection behavior

For list, ledger, map, and pipeline surfaces:

- filters belong to the current task surface, not global application state unless explicitly designed that way;
- selecting an object must not silently clear filters;
- closing contextual detail should restore the parent selection/filter state;
- route-level month changes may reset object selection if the selected object does not exist in the new dataset;
- the URL should represent stable route-level context; transient hover/focus state does not need URL representation.

# Responsive UX

## Desktop / wide

Preferred structure:

```text
Application Shell
├─ persistent/stable task navigation
├─ Instrument Header
├─ Primary Instrument
├─ contextual Inspector / Evidence Dock
└─ secondary rails / filters / status
```

## Mobile / narrow

Do not shrink the desktop composition proportionally.

Recompose:

```text
Compact Application Header
   ↓
Current Task / Primary Instrument
   ↓
Context actions
   ↓
Inspector as bottom sheet / full-height detail
   ↓
bounded navigation dock / menu
```

Requirements:

- current task and back action remain visible;
- touch targets remain at least the canonical accessible control size;
- tables gain a readable object/list representation rather than horizontal compression that hides semantics;
- map interaction has list/text alternatives;
- reduced-motion preference disables nonessential animated orbit/reveal transitions.

# Keyboard and accessibility flow

Every canonical UX flow must be executable without a pointing device where the underlying interaction is not inherently map-only.

Minimum requirements:

- visible `:focus-visible` treatment;
- predictable tab order: navigation → page controls → primary instrument → inspector/detail → secondary actions;
- `Escape` closes a non-destructive modal/drawer/inspector when appropriate;
- focus returns to the control/object that opened a dismissed contextual surface;
- current navigation item exposes current-state semantics;
- selected/pressed/filter states expose programmatic semantics;
- status is not communicated by color alone;
- external navigation is visually distinguishable from internal drill-down.

# UX readiness gate

Page/showcase generation is allowed only after both gates pass:

```text
COMPONENT READINESS
      ↓
UX FLOW READINESS
      ↓
PAGE COMPOSITION
      ↓
RESPONSIVE REVIEW
      ↓
SHOWCASE IMAGE
```

A page is `UX_READY` only when all applicable questions are answered:

1. What is the user's primary task?
2. What is the authorized entry route/surface?
3. What is the dominant primary instrument?
4. What object can the user select?
5. Where does contextual detail open?
6. What is the return/back path?
7. Which filters/selection state must be preserved?
8. What are loading, empty, partial/offline and error states?
9. Is the data `FROZEN`, `LIVE`, `CANDIDATE`, or another explicit state?
10. Where are evidence/source/provenance exposed?
11. Where must the causality or practice-level guardrail remain visible?
12. How does the same task recompose on mobile?
13. Is keyboard/focus behavior defined?
14. Does the design avoid inventing a capability, route, state, metric, or navigation item?

If any required answer is missing, the design status is:

`BLOCKED_BY_UX_FLOW`

This status is independent of `BLOCKED_BY_COMPONENT_SYSTEM`; a page must clear both before becoming a golden Figma/Storybook/showcase target.

# Storybook / Figma execution

Storybook is the executable visual workbench while Figma availability is constrained. Figma remains a visual specification/review workspace when available.

Required design order is now:

```text
CONSTITUTION
  ↓
TOKENS
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
APPLICATION PAGE
  ↓
RESPONSIVE STATES
  ↓
SHOWCASE IMAGE
```

A generated image is rejected if it creates a different navigation hierarchy, drill-down model, component geometry, state vocabulary, or evidence relationship from the approved component + UX flow contract.