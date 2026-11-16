# CRAYON Engineering Roadmap

CRAYON is being developed as a platform-agnostic Human–System Representation Runtime.

Core loop:

`Observation -> Knowledge -> Situation -> Possibility -> Prediction -> Commitment -> Execution -> Observation -> Reconciliation -> Witness -> New Situation`

## Guiding rule

No visual primitive is promoted into the semantic kernel. The kernel must describe meaning, uncertainty, agency, consequence, and verification without depending on a screen, browser, framework, or interaction device.

## Phase 0 — Correctness before features

**Goal:** prevent predicted state from being confused with observed or verified reality.

Deliverables:
- separate `PredictedOutcome` from `ObservedOutcome`;
- change `Witness` so it records verified/observed outcomes rather than blindly copying simulation output;
- explicit preconditions and stale-transition detection;
- richer reconciliation result with reasons;
- temporal validity for observations;
- tests for partial execution and ambiguous outcomes.

Exit criteria:
- partial execution cannot appear as verified success;
- stale predictions cannot be committed silently;
- unknown and conflicted states remain explicit.

## Phase 1 — Agency engine

**Goal:** model who may see, propose, intend, commit, execute, verify, and override.

Deliverables:
- capability-oriented authority model;
- constraint evaluation;
- possibility derivation;
- explicit distinction between proposal, intent, commitment, and execution.

Exit criteria:
- an AI agent can propose an action without automatically receiving commit authority;
- unavailable actions include explainable reasons.

## Phase 2 — Consequence and commitment engine

**Goal:** make consequence simulation deterministic and commitment friction explainable.

Deliverables:
- consequence classification;
- declared vs derived vs policy risk;
- reversibility model;
- commitment resistance model with explanation output;
- pre-commit simulation and post-execution comparison.

Exit criteria:
- high-impact irreversible actions produce greater deliberate resistance than low-risk reversible actions;
- resistance can always answer `why?`.

## Phase 3 — Falsification suite

**Goal:** prove the ontology across unrelated domains.

Required domains:
1. Banking — transfer with ambiguous settlement.
2. Files — recursive delete and restore window.
3. ERP — purchase approval with authority constraints.
4. Email — send is irreversible but compensatable.
5. DevOps — production deployment with partial failure.
6. AI — generated edit proposed by an agent, committed by a human.

Exit criteria:
- all six domains use the same semantic grammar;
- kernel contains no domain-specific branches such as `if banking` or `if email`.

## Phase 4 — Semantic Snapshot

**Goal:** serialize what the system believes the human needs to understand, not what pixels happen to be visible.

Deliverables:
- anchor;
- known / uncertain / conflicted / unknown knowledge;
- current possibilities and constraints;
- attention candidates;
- relevant history and witnesses.

Uses:
- tests;
- accessibility;
- AI context;
- debugging;
- audit;
- semantic diff.

## Phase 5 — CRAYON Physics

**Goal:** convert meaning into deterministic representational pressure.

Initial physics:
- Gravity — attention worthiness.
- Distance — semantic closeness.
- Depth — abstraction/detail distance from anchor.
- Resistance — deliberate effort required for commitment.
- Disclosure — amount of information to reveal.
- Continuity — context that must survive focus changes.
- Momentum — visibility of ongoing transitions.
- Trace — persistence of meaningful change.

Every score must be inspectable and explainable.

## Phase 6 — Representation Planner

**Goal:** transform semantic state plus physics into a platform-neutral representation plan.

The planner decides what must be understood, emphasized, connected, disclosed, or deferred. It does not emit React components.

## Phase 7 — CRAYON RIR

**Goal:** define Representation Intermediate Representation.

RIR may describe:
- state;
- relation;
- transition;
- possibility;
- consequence;
- evidence;
- uncertainty;
- temporal direction;
- collection semantics.

RIR must not contain `button`, `modal`, `hover`, `pixel`, or framework-specific concepts.

## Phase 8 — CRAYON Inspector

**Goal:** make every adaptive decision explainable to developers.

Questions the inspector must answer:
- Why is this visible?
- Why is this prominent?
- Why is this action unavailable?
- Why is this commitment high-friction?
- Which observations and rules produced this state?

## Phase 9 — Web renderer

**Goal:** render RIR to a usable visual interface while preserving semantic invariants.

Technology can change; semantic meaning cannot.

## Phase 10 — CRAYON Lab

**Goal:** build a laboratory app that exposes Meaning -> Physics -> RIR -> Pixels side by side for all falsification domains.

## Phase 11 — Visual physics experiments

**Goal:** discover CRAYON visual DNA from semantic laws rather than styling trends.

Experiments include:
- action as transition;
- consequence vectors;
- semantic zoom;
- evidence depth;
- uncertainty representation;
- witness traces;
- future possibilities;
- commitment resistance.

## Phase 12 — Semantic invariance

**Goal:** prove one situation can be represented by Web, Voice, Agent, and later renderers without changing truth, consequence, constraints, authority, or witness requirements.

## Phase 13 — Design system

Only after representation semantics stabilize:
- typography;
- spacing;
- motion;
- shape language;
- density;
- colors;
- themes.

Dark Flagship + Light Companion are renderer-level visual contracts, not semantic states.

## Phase 14 — Public runtime API

Current public packages:
- `allah-crayon-kernel`;
- `allah-crayon-physics`;
- `allah-crayon-snapshot`;
- `allah-crayon-rir`;
- `allah-crayon-inspector`;
- `allah-crayon-agent`;
- `allah-crayon-voice`;
- `allah-crayon-react`.

Public API freeze remains deferred until real external adoption and compatibility evidence exists.

## Phase 15 — Durable runtime

**Goal:** preserve CRAYON witness/history truth across process restart without letting persistence become a semantic authority.

Deliverables:
- renderer-independent `TemporalStore` port;
- append-only temporal journal;
- deterministic replay/crash recovery;
- external operation identity/idempotency semantics;
- trusted observation-ingestion boundary;
- dedicated `allah-crayon-codec` persistence boundary with canonical tagged envelope writes, backward decode compatibility, resource limits, and explicit migrations;
- compensation as a new transition, never history rewrite.

Exit criteria:
- restart cannot turn ambiguous external outcome into success;
- later evidence appends history rather than mutating prediction/witness;
- corrupt/incomplete storage is distinguishable from a valid semantic `unknown` state;
- serialization cannot silently drop `undefined`, coerce non-finite values, guess migrations, or reinterpret unsupported versions;
- Kernel/Snapshot/RIR import no filesystem/database/browser persistence API.

Tracked in #75–#85, #112, #129, #144.

## Phase 16 — Domain adapter and execution integration

**Goal:** let real applications connect domain reality to CRAYON without copying Lab internals or bypassing authority/truth boundaries.

Deliverables:
- domain adapter SDK;
- adapter conformance kit;
- six reference adapters;
- observation stream/connector contract;
- asynchronous executor boundary;
- stable validation/reason codes.

Exit criteria:
- adapters cannot grant themselves authority or declare verification;
- transport acknowledgement cannot masquerade as observed outcome;
- all six falsification domains still use one semantic grammar.

Tracked in #84 and #86–#90.

## Phase 17 — Renderer conformance and additional media

**Goal:** make semantic invariance executable for first-party and third-party renderers.

Deliverables:
- reusable renderer conformance kit;
- terminal/CLI renderer;
- static HTML renderer;
- print/document representation contract;
- localization/RTL support;
- high-contrast and reduced-motion behavior.

Exit criteria:
- renderer presentation may differ while critical truth, actionability, consequence, authority, uncertainty, resistance, and witness remain invariant;
- a renderer never acquires execution/commit authority merely by rendering.

Tracked in #91–#97.

## Phase 18 — Lab as semantic microscope

**Goal:** make falsification, replay, evidence, performance, and visual proof inspectable without turning Lab into a domain application.

Deliverables:
- declarative scenario authoring;
- temporal replay/time travel;
- semantic diff compare;
- evidence/provenance graph;
- pipeline profiler;
- semantic-aware visual regression policy.

Exit criteria:
- engineers can inspect why a representation changed across time/domain/theme;
- visual regression never outranks semantic regression;
- historical view can never be mistaken for current truth.

Tracked in #98–#103.

## Phase 19 — Developer adoption and supply-chain evidence

**Goal:** make CRAYON installable, understandable, and auditable outside this repository.

Deliverables:
- starter project;
- adapter cookbook;
- reason-code/invariant reference;
- executable examples per package;
- API/export drift checks;
- entrypoint contract tests;
- semantic redaction policy;
- fuzz/property tests;
- serialization abuse limits;
- SBOM/license inventory;
- npm provenance where supported.

Exit criteria:
- fresh registry consumer can build a custom domain without monorepo source;
- debug/Inspector tooling does not leak sensitive values by default;
- release artifact maps to an exact verified commit.

Tracked in #104–#114 plus existing registry issues #55/#56/#64.

## Phase 20 — Beta and v1 admission

**Goal:** freeze only abstractions that survive real adoption, durability, compatibility, security, accessibility, and falsification evidence.

Deliverables:
- supported-version matrix;
- public deprecation/migration policy;
- beta admission checklist;
- public API freeze candidate;
- canonical cross-domain acceptance corpus;
- final v1 kill-criteria review.

Exit criteria:
- no known semantic invariant depends on a fashionable renderer convention;
- durable replay and external integration preserve truth/authority boundaries;
- unresolved material kill-criterion violation blocks release regardless of schedule.

Tracked in #115–#120. Master execution index: #121.

## Phase 21 — Production evidence and live operation

**Goal:** prove the exact candidate that users install and visit, rather than inferring production readiness from source-code presence.

Evidence states are ordered and non-interchangeable:

```text
implemented on dev
  ↓
merged to main
  ↓
verified on main
  ↓
published/deployed externally
  ↓
smoke-verified against the exact source SHA
```

Deliverables:
- main-only verifier on repository self-hosted transport;
- executable Dark/Light screenshot matrix;
- npm publish + fresh registry consumer smoke + provenance evidence;
- Cloudflare Pages deployment from verified `main` only;
- live URL/HTTP asset smoke tied to source SHA;
- durable git tag/GitHub Release evidence;
- production evidence dashboard that records unknown/blocked states rather than inferring success.

Current evidence:
- v0.9 candidate PR #122 merged to `main` at `0ba3656b8d5675127f5ad92548fcb9a60a9531b3`;
- hosted `living-crayon` run #103 (`32849912735`) failed before runner allocation (`runner_id=0`, no runner name, `steps=[]`), so it is **not** a semantic/test result;
- npm and Cloudflare downstream runs were skipped because main verification did not succeed;
- next release transport is configured for the self-hosted runner while retaining `main`-only triggers;
- Cloudflare first deploy still requires repository secrets documented in `docs/CLOUDFLARE-PAGES.md`.

Exit criteria:
- one exact `main` SHA has green semantic/package/performance/accessibility/visual gates;
- all eight public npm packages resolve from the registry and a fresh consumer imports them;
- live Lab URL serves the same verified SHA and passes HTTP smoke;
- release notes, TASKS, issues, tag/release and `docs/PRODUCTION-STATUS.md` agree on the same evidence;
- no missing runner/credential/registry/live state is written as success.

Tracked in #55/#56/#61/#64/#69/#70/#72/#123/#134/#145 and production master #132.

## Global kill criteria

Stop and revise the abstraction if any of these become necessary inside the kernel:
- domain-specific concepts such as invoice, bank, file, email, server, or AI;
- UI concepts such as button, card, modal, screen, hover, pixel, color, or CSS;
- unexplained probabilistic decisions treated as authoritative truth;
- simulated state being reported as observed reality;
- hidden authority escalation;
- irreversible actions without consequence visibility or witnessability;
- persistence success being treated as external-world verification;
- renderer/adapter convenience bypassing semantic authority or provenance rules.
