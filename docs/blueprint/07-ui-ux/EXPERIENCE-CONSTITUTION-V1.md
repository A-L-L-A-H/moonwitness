# MoonWitness Experience Constitution V1

Status: **CANONICAL EXPERIENCE GOVERNANCE / DESIGN FROZEN**

This document formalizes already-agreed MoonWitness experience principles. It does not change repository ownership, application navigation, network boundaries, domain contracts, or capability ownership; therefore it does not create a new architecture decision by itself. Any future change that crosses those boundaries still requires normal Blueprint change governance and, where applicable, an ADR.

## 1. Purpose

MoonWitness is not a generic website shell with decorative effects. It is a serious research system whose interface behaves like a precise scientific instrument.

The experience north star is:

> **MoonWitness is a cinematic scientific experience engine that brings console-grade interaction, spatial composition, sound, motion, state, and instrument design to research software on the Web.**

Two rules govern every implementation:

> **Cinematic behavior must communicate system state, not decorate it.**

> **MoonWitness should never animate what it does not know.**

Visual intensity, motion, audio, haptics, depth, and effects are therefore outputs of known semantic state. They must never imply causality, certainty, liveness, completion, verification, or freshness that the underlying system has not established.

## 2. Experience pipeline

MoonWitness experience work follows this semantic pipeline:

```text
TRUTH / DATA STATE
  ↓
EPISTEMIC GRAMMAR
  ↓
VISUAL GEOMETRY
  ↓
INTERACTION PHYSICS
  ↓
RESPONSE ENGINE
  ↓
INSTRUMENTS
  ↓
SCENES
  ↓
APPLICATION
```

The pipeline replaces an effect-first model such as `CSS → component → page → effects`.

Applications continue to own navigation. Capabilities continue to power screens. Objects continue to own drill-down. Evidence continues to own trust. This constitution does not authorize new routes, menus, application ownership, or API resources.

## 3. Scene model

Every important screen is treated as a **Scene** rather than a card collection.

A scene must be describable by the following semantic fields:

- `environment` — the application context and stable visual field;
- `operatingMode` — the current work posture;
- `primaryInstrument` — the dominant instrument for the task;
- `secondaryInstruments` — supporting instruments that must not compete with the primary instrument;
- `activeObject` — the object currently selected or acted upon;
- `knowledgeState` — what is actually known about the active object;
- `focusState` — where local interaction focus currently resides;
- `responseLevel` — permitted response intensity;
- `audioContext` — whether and how semantic sound may respond;
- `inputContext` — pointer, keyboard, touch, assistive-technology and supported haptic context;
- `persistence` — state that must survive local drill-down and return.

Example:

```text
Scene: CORRELATION
Operating Mode: INVESTIGATE
Active Object: EventPair
Knowledge: MEASURED
Evidence: PARTIAL
Response: L2 — INSTRUMENT
```

A scene must expose usable information before optional cinematic treatment whenever possible. Transition behavior must not unnecessarily delay readable data.

## 4. Operating modes

Operating modes describe work posture, not themes.

### OBSERVE

- wide field;
- context-rich composition;
- low response intensity;
- quiet ambient behavior;
- used when scanning, orienting, or reviewing broad context.

### INVESTIGATE

- focus target becomes dominant;
- inspector/evidence context advances;
- relation and measurement traces may become visible;
- used when examining an object or relationship.

### VERIFY

- source, provenance, evidence and precision state dominate;
- successful closure is permitted only when verification is actually established;
- used for trust decisions and evidence-chain review.

### OPERATE

- runtime, jobs, research runs, workflow progress and telemetry dominate;
- motion is tied to actual operational state;
- used only in applications that own supported operational views.

### ARCHIVE

- historical or sealed state;
- minimal motion;
- lower luminance and stable geometry;
- used for frozen, completed, or archival material.

An operating mode must not invent application scope. For example, `OPERATE` does not make Runtime, Worker, Cosmic, Corpus, Crayon, Prophetic, API, or SDK into navigation items.

## 5. Semantic depth planes

Depth communicates hierarchy rather than glassmorphism.

MoonWitness uses three semantic planes:

### FIELD

Background, world, global context, broad data field.

### INSTRUMENT

The current operation and its stable interaction anchor.

### EVIDENCE

Foreground detail, trust material, provenance, source inspection and local truth.

On local inspect/focus:

```text
FIELD recedes
INSTRUMENT remains anchored
EVIDENCE advances
```

Depth must remain restrained, legible, and performant. It must not create spatial drama that obscures information or changes the semantic hierarchy.

## 6. Optical focus and camera behavior

MoonWitness may borrow the responsiveness of a game camera while behaving like scientific optics.

Allowed techniques include:

- semantic zoom;
- focus shift;
- local recentering;
- small local scale change;
- depth-plane adjustment;
- viewport continuity.

Typical optical displacement should remain approximately **2–8 px**. Large fly-throughs, dramatic global tilt, uncontrolled parallax, or ornamental camera movement are not part of the baseline language.

Focus transitions must preserve orientation. Returning from an inspector or detail should restore relevant application state such as selection, filter, scroll, zoom, map viewport, active time, and layers when the canonical flow requires it.

## 7. Canonical interaction verbs

MoonWitness interaction semantics use this vocabulary:

`OBSERVE`  
`ACQUIRE`  
`FOCUS`  
`INSPECT`  
`TRACE`  
`MEASURE`  
`COMPARE`  
`CORRELATE`  
`CALIBRATE`  
`RESOLVE`  
`VERIFY`  
`SEAL`  
`ARCHIVE`  
`SYNCHRONIZE`  
`RECOVER`  
`ABORT`

An animation or effect without a defensible semantic verb is presumed decorative and should not ship.

The verbs are an experience vocabulary, not a new network API or domain state machine. Product/domain actions remain governed by their canonical contracts.

## 8. Epistemic grammar

Knowledge state must not be represented only by a badge or color.

Canonical experience states include:

- `UNKNOWN`
- `OBSERVED`
- `MEASURED`
- `RELATED`
- `SUPPORTED`
- `VERIFIED`
- `PARTIAL`
- `CONFLICTED`
- `UNRESOLVED`
- `UNSUPPORTED`

The UI should encode these states through a combination of geometry, line style, closure, calibration, text, icon anatomy, motion response, and optional sound response.

Baseline geometric interpretation:

| State | Geometry / behavior |
|---|---|
| UNKNOWN | isolated or open geometry; no implied path to a conclusion |
| OBSERVED | stable isolated node or witnessed mark |
| MEASURED | node plus calibration/tick/scale evidence |
| RELATED | separated nodes with a partial relation trace |
| SUPPORTED | stable supported trace with explicit evidence relationship |
| VERIFIED | closed/sealed geometry only after verification is established |
| PARTIAL | incomplete or interrupted geometry without false closure |
| CONFLICTED | competing traces or mutually visible evidence paths |
| UNRESOLVED | open geometry that visibly remains unsettled |
| UNSUPPORTED | terminated trace; no success closure or success sound |

Status must remain understandable in grayscale and without motion or audio.

### Causality guardrail

Correlation/proximity must never be animated as causation. The canonical sentence remains:

> **Temporal/geographic proximity does not establish causation.**

A proximity trace may show measured relationship. It must not converge, seal, resolve, or otherwise imply causal proof unless the canonical evidence/mechanism review supports that state.

## 9. Geometric DNA

Functional icons, symbols, instruments, dataviz, maps and motion should derive from the same base vocabulary:

- `LINE`
- `NODE`
- `RING`
- `TRACE`
- `TICK`
- `APERTURE`

Five signature motifs provide higher-level composition:

- **APERTURE** — focus, inspect, truth acquisition;
- **ORBIT** — time, celestial relation, trajectory;
- **THREAD** — evidence, relation, provenance;
- **SEAL** — verification, archive, completion;
- **CALIBRATION** — measurement, precision, uncertainty.

These motifs must feel scientific and forensic, not occult, fantasy, steampunk, or decorative-sigil based.

## 10. Response engine

Motion, light, audio, haptic, geometry and text are coordinated responses to a **semantic event**. They are not independent effect layers.

A semantic response describes only what the system can justify.

Example:

```text
event: evidence.acquire
response:
  reticle converges
  trace resolves to the acquired object
  one restrained signal pulse
  optional precision ping
  optional supported mobile haptic
```

Example unsupported state:

```text
event: evidence.unsupported
response:
  trace travels toward the tested relation
  trace terminates before closure
  geometry remains open
  no success sound
  no cinematic failure effect
```

Recommended event namespaces include object/operation semantics such as `evidence.acquire`, `focus.enter`, `measure.calibrate`, `verification.complete`, `archive.seal`, `system.warning`, and `system.failure`. Event naming must not masquerade as a public API contract.

## 11. Response intensity

The default distribution target is:

- **L0 STATIC — ~70%**
- **L1 TACTILE — ~23%**
- **L2 INSTRUMENT — ~6%**
- **L3 CINEMATIC — ~1%**

### L0 — STATIC

Stable readable state. No animation required.

### L1 — TACTILE

Small interaction feedback such as focus, press, hover, selection, local lock, or short control response.

### L2 — INSTRUMENT

A meaningful instrument operation such as acquire, trace, calibrate, focus transition, measured relation resolution, or inspector transition.

### L3 — CINEMATIC

Rare system-level response reserved for events such as first meaningful experience initialization, major Research Run completion, complete evidence-chain resolution, or critical system transition.

L3 is not appropriate for Settings, filters, tabs, ordinary clicks, routine navigation, or decorative page entry.

## 12. Motion signature

The primary MoonWitness motion signature is:

```text
CONVERGE
→ LOCK
```

It may represent acquire, focus, evidence resolution, temporal alignment, inspector focus, or verification only when the relevant state has actually settled.

A lock means the system/object has reached a stable operational state. A visual lock must not be shown while the underlying state remains unresolved, loading, speculative, partial, conflicted, or unsupported unless the lock explicitly refers to a different known property.

When a transition completes, the interface becomes quiet again.

Continuous animation is allowed only for continuously changing real state or live data. Decorative spinning rings, floating particles, moving stars, random glitch, glowing waveforms, and permanent ambient motion are not baseline MoonWitness behavior.

## 13. Semantic FX

Allowed semantic effect families are:

- `AcquireFX`
- `TraceFX`
- `FocusFX`
- `ResolveFX`
- `CalibrateFX`
- `SealFX`
- `FaultFX`

Particles, glow, bloom, displacement, trails, or similar effects may be used only when they improve semantic comprehension. Effects must never become a hidden status channel that disappears under reduced motion, high contrast, grayscale, or unsupported GPU conditions.

## 14. Sound and sonic identity

Audio is optional. Default experience should be silent or subtle.

No looping sci-fi ambience, laser vocabulary, or constant music is part of the default interface.

Acoustic material families:

- **MECHANICAL** — controls, locks, inspector mechanics;
- **GLASS** — evidence, source, verification precision;
- **RESONANT** — celestial and temporal relationships;
- **ELECTRONIC** — runtime/system telemetry.

Semantic sound events may include:

`acquire`, `focus`, `trace`, `verify`, `seal`, `calibrate`, `warning`, `failure`, `ready`.

A compact sonic signature may follow:

```text
RISE
→ RESOLVE
→ SETTLE
```

Typical response should remain approximately **200–400 ms**.

Audio requirements:

- no autoplay before user interaction;
- global mute must be available wherever audio exists;
- volume must be controllable;
- reduced sensory mode must disable or simplify nonessential response;
- audio must never be the only carrier of meaning;
- mobile haptic, where supported, must remain optional and subtle.

## 15. Frozen, live, candidate and historical states

These states are visually distinct because they carry different truth semantics.

### Frozen

- stable;
- sealed where appropriate;
- quiet;
- no liveness pulse;
- deterministic presentation.

### Live

- open geometry where state is still changing;
- occasional subtle freshness pulse only when freshness is real;
- explicit freshness indication;
- continuous motion only when actual state changes continuously.

### Candidate

- unfinished/open geometry;
- no implied verification;
- state vocabulary must match the canonical pipeline/domain state.

### Partial

- broken, incomplete or visibly bounded traces;
- no false closure.

### Historical

- less luminous;
- stable;
- sealed where the archival state is authoritative;
- minimal motion.

Frozen public data must never behave as though it is live.

## 16. 2D, 2.5D and 3D policy

- **2D** is the default for information, controls, evidence, text and most dataviz.
- **2.5D** may communicate focus, depth, optical hierarchy and local spatial relation.
- **3D** is permitted only for spatial truth that cannot be represented meaningfully in 2D.

Decorative 3D is not a justification. A celestial/orbital/spatial instrument may use 3D only when the third dimension expresses actual data or relationship.

## 17. Performance constitution

Performance is part of MoonWitness identity.

Target budgets:

- input feedback: **<100 ms perceived**;
- micro interaction: **100–220 ms**;
- instrument transition: **180–420 ms**;
- scene transition: **300–650 ms**;
- rare cinematic response: **<1000 ms where possible**;
- significant animation target: **60 fps**;
- idle UI: little unnecessary GPU activity.

Cinematic behavior must not delay usable data unnecessarily. Native DOM/SVG/CSS/Web Animations/Web Audio remain the preferred baseline before heavier runtime libraries. Runtime adoption must pass the relevant semantic-need, performance, accessibility, bundle, security, license and rollback gates.

## 18. Accessibility constitution

MoonWitness targets **WCAG 2.2 AA**.

Required behavior:

- full keyboard navigation for actionable controls;
- visible `:focus-visible` treatment;
- semantic labels and roles;
- meaningful state independent of color;
- meaningful state independent of motion;
- meaningful state independent of audio;
- `prefers-reduced-motion` and product reduced-motion mode must be respected;
- reduced sensory mode must suppress nonessential audio/haptic/FX;
- local inspectors should close with `Escape` where appropriate;
- focus should return to the invoking object after local inspector/detail dismissal where the canonical flow requires it;
- touch targets and mobile interactions must remain deliberate, not a shrunken desktop;
- async states must include loading, empty, error, success, partial, offline, disabled, and optimistic/pending when applicable.

Reduced motion does not mean removing semantic state. Replace spatial/temporal effects with stable geometry, text, opacity/state changes, or other non-motion equivalents.

## 19. Mobile recomposition

Mobile must recompose into a handheld scientific instrument rather than shrink the desktop scene.

Preferred adaptations include:

- inspector becomes bottom sheet or full-height detail;
- primary instrument remains visually dominant;
- nonessential secondary instruments collapse or sequence;
- context preservation remains intact;
- semantic depth may become sequential rather than simultaneous;
- touch, keyboard, screen-reader and orientation changes must not destroy the task state.

## 20. Visual character and anti-patterns

MoonWitness should feel:

- cinematic;
- scientific;
- forensic;
- celestial;
- archival;
- mechanical;
- precise;
- quiet;
- timeless;
- mysterious;
- trustworthy.

It must not drift into:

- generic SaaS dashboards;
- card-grid admin shells;
- crypto dashboards;
- cyberpunk HUDs;
- cheap game UI;
- steampunk machinery;
- fantasy celestial interfaces;
- bronze/gold-dominant fantasy;
- sacred/divine text floating over blazing celestial bodies.

The baseline palette remains restrained: Void `#040506`, Panel `#090C0F`, Raised/mechanical `#101419`, Ivory `#F0EADF`, Signal crimson `#D7281E`, with warm metal/amber/bronze only as micro-accent.

## 21. Implementation gates

The canonical design sequence remains:

```text
EXPERIENCE / VISUAL CONSTITUTION
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
SCENE COMPOSITION
  ↓
APPLICATION PAGES
  ↓
RESPONSIVE STATES
  ↓
GENERATED SHOWCASE IMAGES
```

Page generation remains blocked when the component system or UX flow is incomplete:

- `BLOCKED_BY_COMPONENT_SYSTEM`
- `BLOCKED_BY_UX_FLOW`

One page remains one standalone image when generated showcase work resumes. Generated imagery never creates features, routes, ownership, domain state, API resources, or navigation.

## 22. Relationship to other canonical documents

This constitution governs experience behavior and visual semantics. It must be read together with:

- [Application Information Architecture](./APPLICATION-INFORMATION-ARCHITECTURE-V1.md) for application navigation, maturity and route ownership;
- [User Flow and Interaction Model](./USER-FLOW-AND-INTERACTION-MODEL-V1.md) for task/object drill-down, evidence traversal, return path, focus and state preservation;
- [Figma Component-First Workflow](./FIGMA-COMPONENT-FIRST-WORKFLOW-V1.md) for component-first design execution;
- [Figma Showcase Screen Matrix](./FIGMA-SHOWCASE-SCREEN-MATRIX-V1.md) for page/showcase maturity and generation gates;
- [UI Platform Contract](./UI-PLATFORM-CONTRACT-V1.yaml) for reusable frontend ownership.

If an experience proposal conflicts with application ownership, domain truth, API surface, evidence semantics, or architecture governance, this document does not override those contracts. The proposal must be changed or escalated through Blueprint governance.
