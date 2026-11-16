# MoonWitness Design-Master Component-First Workflow v1

Status: **DESIGN EXECUTION CONTROL / COMPONENT-FIRST GATE**

This document defines the required order for MoonWitness canonical design-master and showcase work. It does not change capability ownership, application ownership, API boundaries, deployment, persistence, or canonical reusable UI ownership.

Core rule:

> **Do not design pages first. Build the visual language once, then compose every page from the same tokens, primitives, components, variants, and templates.**

Canonical production UI ownership remains `moonwitness-frontend-platform`. The single logical design master is `MW-UI-MASTER-V1`, registered in `DESIGN-MASTER-REGISTRY-V1.yaml`. Figma is the primary editor; OpenPencil may be used as a fallback editor for the **same document lineage** when Figma rate/write/automation limits block work. Neither editor may create a competing master. `moonwitness-design-system` remains a public showcase/compatibility bridge.

A Figma/OpenPencil rate limit or automation limitation is **never** authorization to create another master file. Resolve the registered candidate/master lineage first.

## Required execution order

```text
PHASE 0 — VISUAL CONSTITUTION
        ↓
PHASE 1 — TOKENS / VARIABLES
        ↓
PHASE 2 — RAW PRIMITIVES
        ↓
PHASE 3 — COMPONENTS + VARIANTS
        ↓
PHASE 4 — DOMAIN INSTRUMENTS
        ↓
PHASE 5 — PAGE TEMPLATES
        ↓
PHASE 6 — APPLICATION PAGES
        ↓
PHASE 7 — RESPONSIVE STATES
        ↓
PHASE 8 — GENERATED SHOWCASE IMAGES
```

Page-level design-master composition and generated showcase images are **blocked** until Phases 0–4 are sufficiently complete for the page family being designed.

## Phase 0 — visual constitution

Freeze the visual language before individual screens:

- obsidian / carbon primary surfaces;
- smoked-glass secondary surfaces;
- ivory primary text;
- restrained crimson signal/focus accent;
- warm metallic detail only as a secondary physical accent;
- hairline borders, calibration ticks, instrument geometry;
- purposeful asymmetry;
- one dominant instrument per viewport;
- no generic SaaS card-grid identity;
- no cyberpunk/game-HUD excess;
- no brass/steampunk-dominant identity;
- no decorative celestial fantasy replacing data/instrument meaning.

The same constitution must be used by Myth, Command Center, CRAYON Lab target concepts, Storybook, and generated showcase references unless an application-specific theme intentionally overrides a semantic token.

## Phase 1 — design-master variables / tokens

Create variables and styles before component construction.

### Color groups

- `surface/void`
- `surface/base`
- `surface/raised`
- `surface/smoked`
- `border/hairline`
- `border/instrument`
- `text/primary`
- `text/secondary`
- `text/telemetry`
- `signal/crimson`
- `signal/amber`
- `status/success`
- `status/warning`
- `status/error`
- `status/unknown`
- `evidence/high`
- `evidence/medium`
- `evidence/low`
- `map/substrate`
- `map/observation`
- `map/disaster`
- `celestial/orbit`

Semantic names are required. Avoid component-specific raw hex duplication.

### Spacing

Use a constrained scale, preferably based on 4/8 units:

`4, 8, 12, 16, 24, 32, 48, 64`

### Radius

Use minimal radii. Reserve stronger rounding for intentional circular/orbital instruments, not ordinary panels.

### Typography roles

- Display / archival authority
- Page title
- Section title
- Instrument label
- Body
- Caption
- Telemetry
- Coordinate / timestamp
- Evidence ID
- Calibration text

### Motion tokens

- `motion/fast`
- `motion/standard`
- `motion/slow-instrument`
- `motion/reduced`

## Phase 2 — raw primitives

These are the smallest reusable visual building blocks. They must be finalized before high-level screens.

### Layout primitives

- `Raw/Surface`
- `Raw/Panel`
- `Raw/Divider`
- `Raw/Stack`
- `Raw/Inline`
- `Raw/ScrollRegion`
- `Raw/ViewportFrame`

### Typography primitives

- `Raw/Label`
- `Raw/Telemetry`
- `Raw/Coordinate`
- `Raw/EvidenceId`
- `Raw/Timestamp`

### Interaction primitives

- `Raw/Button`
- `Raw/IconButton`
- `Raw/Input`
- `Raw/SearchInput`
- `Raw/Select`
- `Raw/Toggle`
- `Raw/Checkbox`
- `Raw/Segment`
- `Raw/Tab`
- `Raw/Chip`
- `Raw/Tooltip`

### Status primitives

- `Raw/StatusDot`
- `Raw/StatusLabel`
- `Raw/ProgressTrack`
- `Raw/Badge`
- `Raw/SignalMark`

### Instrument primitives

- `Raw/Hairline`
- `Raw/TickMark`
- `Raw/CalibrationRing`
- `Raw/Reticle`
- `Raw/Node`
- `Raw/Connector`
- `Raw/Scale`
- `Raw/LegendItem`

Every primitive must use Auto Layout where applicable and token references rather than copied values.

## Phase 3 — canonical component families

Build components from raw primitives, then define variants.

### Shell and navigation

- `ApplicationShell`
- `MissionRail`
- `InstrumentHeader`
- `ArchiveGate`
- `ActionRail`
- `SegmentedRail`
- `CommandDeck`

### Data and state

- `MetricRail`
- `StatusMatrix`
- `FilterDock`
- `ProgressRail`
- `InspectorRows`
- `LoadingOrbit`
- `EmptySignal`
- warning/degraded/error state panels

### Evidence / provenance

- `EvidenceSpine`
- `ObservationShard`
- `ReliabilityPrism`
- `WitnessThread`
- `ProvenanceRail`
- `SourceSeal`
- `EvidenceRules`
- `InspectorDock`

### Celestial / temporal

- `OrbitalCore`
- `TemporalOrrery`
- `ChronologyTrack`
- `SignalWave`
- `StateVector`
- `EventPulse`

### Geo / causality

- `MapRift`
- `CausalityLattice`
- `CausalityGuardrail`
- map layer control
- map event marker
- map inspector

### Revelation

- `RevelationLens`

Exactly four canonical revelation channels are supported at product level:

1. Al-Qur'an
2. Injil / Gospel
3. Taurat / Torah
4. Zabur / Psalms

## Phase 3 state contract

Interactive components should define the states that apply to them:

- default
- hover
- focus
- active
- selected
- disabled
- loading
- empty
- success
- warning
- error
- partial
- offline

Status must not rely on color alone.

## Phase 4 — domain instruments

A domain instrument is a reusable composition of lower-level components, not yet an application page.

Required instrument masters include:

- `Instrument/ResearchStateCore`
- `Instrument/EvidenceTraversal`
- `Instrument/ObservationLedger`
- `Instrument/CorrelationLattice`
- `Instrument/Chronology`
- `Instrument/SpreadMap`
- `Instrument/DisasterMap`
- `Instrument/PracticeReview`
- `Instrument/FourRevelationLens`
- `Instrument/CandidatePipeline`
- `Instrument/ResearchRunTrajectory`
- `Instrument/SystemPosture`

A screen may use one of these as its dominant viewport instrument.

## Phase 5 — page templates

Only after raw components and domain instruments are stable, build reusable page templates:

- `Template/ObservatoryPage`
- `Template/LedgerPage`
- `Template/MapPage`
- `Template/AnalysisPage`
- `Template/PipelinePage`
- `Template/OperationsPage`
- `Template/SettingsPage`
- `Template/MobileInstrumentPage`

Templates define layout hierarchy, shell slots, inspector behavior, dominant-instrument sizing, and responsive recomposition. Templates do not create routes.

## Phase 6 — application pages

Application pages are compositions of templates + components + authorized application data/contracts.

Rules:

1. Page components must not be redrawn from scratch.
2. Shared navigation must use the same MissionRail/Header masters.
3. Shared status language must use the same semantic variables and variants.
4. Every page must identify its dominant instrument.
5. Application routes remain controlled by `APPLICATION-INFORMATION-ARCHITECTURE-V1.md` and `FIGMA-SHOWCASE-SCREEN-MATRIX-V1.md`.
6. A generated image cannot create a route or capability.

## Phase 7 — responsive system

Do not scale desktop screens down mechanically.

Required reference widths:

- 1440 desktop
- 1280 laptop
- 1024 tablet landscape
- 768 tablet portrait
- 430 mobile
- 390 mobile
- 360 compact mobile

On mobile:

- MissionRail recomposes into mobile navigation;
- InspectorDock becomes a sheet/drawer;
- dominant instruments remain readable;
- telemetry hierarchy is preserved;
- no horizontal overflow is allowed.

## Phase 8 — generated showcase images

Generated images come **last** and are validation/reference artifacts.

Rules:

- exactly one screen per image;
- use the established raw/component/template system;
- no contact-sheet composition as a golden page;
- no newly invented sidebar items;
- no newly invented metrics;
- no newly invented capability state;
- visual output must be compared back to the adopted design master and Storybook implementation.

If generated output changes component geometry, spacing, navigation, typography, or visual language, the image is wrong; the component master does not move to match an inconsistent generation.

## Component-first readiness gate

Before generating application Home or any new golden page, verify:

- token set complete enough for the page;
- required raw primitives exist;
- required component variants exist;
- required domain instrument exists;
- page template exists;
- desktop hierarchy is approved;
- mobile recomposition rule is known;
- the screen is authorized by the screen matrix.

If any required item is missing, status is:

`BLOCKED_BY_COMPONENT_SYSTEM`

## Canonical design-master page structure

Required canonical page ordering:

```text
00 — CONSTITUTION
01 — VARIABLES / TOKENS
02 — RAW PRIMITIVES
03 — COMPONENTS
04 — COMPONENT VARIANTS
05 — DOMAIN INSTRUMENTS
06 — PAGE TEMPLATES
07 — MYTH / ACTIVE PAGES
08 — COMMAND CENTER
09 — CRAYON LAB / GATED FUTURE
10 — MOBILE / RESPONSIVE
11 — STATES
12 — DEPRECATED / ARCHIVE
```

Do not place experimental components among approved masters without an explicit status label. Existing experimental/review files must remain non-canonical unless `DESIGN-MASTER-REGISTRY-V1.yaml` explicitly reclassifies them after audit.

## Design master versus code authority

The intended relationship is:

```text
MW-UI-MASTER-V1
  one logical design specification / component geometry / states
  edited in Figma, or OpenPencil as fallback on the same lineage
        ↓
moonwitness-frontend-platform
  canonical reusable production implementation
        ↓
application repositories
  route and product composition
        ↓
moonwitness-design-system
  public showcase / compatibility reference
```

The design master and code should converge, but neither generated images nor showcase boards override the frozen Blueprint or application contracts.
