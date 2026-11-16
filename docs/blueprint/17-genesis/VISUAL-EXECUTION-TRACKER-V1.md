# MoonWitness Visual Execution Tracker v1

Status: ACTIVE / W0-11 VISUAL PRECONDITION

This tracker records visual execution evidence required before final W0-11 closeout. It does not alter frozen architecture.

## Authority

1. Design Freeze + ADR-025
2. Canonical UI/UX contracts in `07-ui-ux/`
3. Canonical reusable implementation in `moonwitness-frontend-platform`
4. Application composition in `moonwitness-wheremythfadetolegend`
5. Figma/Storybook/golden images as downstream design and review evidence

## Parallel workstreams

| Track | Owner | Status | Exit evidence |
| --- | --- | --- | --- |
| VISUAL-01 Governance | moonwitness-blueprint#28 | ACTIVE | screen matrix/status and final evidence reconciled |
| VISUAL-02 Canonical component fidelity | moonwitness-frontend-platform#30 | REPOSITORY_GATE_CERTIFIED / FIGMA_FIDELITY_PENDING | canonical tokens/primitives/12 instruments/8 templates/icons/states/HUD + responsive static showcase certified; Figma/golden fidelity still external |
| VISUAL-03 Public-Web fidelity | moonwitness-wheremythfadetolegend#9 | IMPLEMENTATION_READY / PACKAGE_AUTH_BLOCKED | application HUD scene chrome + canonical instruments + source visual contract pass; full install/E2E/Docker blocked by package read authorization |
| VISUAL-04 Showcase bridge | moonwitness-design-system#15 | PACKAGE_ACCESS_BLOCKED | public bridge `GITHUB_TOKEN` receives GitHub Packages `403 permission_denied: read_package`; no duplicate canonical components allowed |
| UI-DIST-01 Consumer distribution | moonwitness-frontend-platform#4 | PENDING_VISUAL | canonical package `0.3.5` publish + clean-registry HUD smoke PASS; public-Web/Docker/Vercel consumer proof remains after package authorization and visual implementation stabilize |
| W0-11 Genesis | moonwitness-blueprint#23 | BLOCKED_BY_VISUAL_EXECUTION | close only after visual + distribution + runtime evidence |

## Canonical component/HUD evidence checkpoint — 2026-09-01

Repository-side component readiness is certified by `moonwitness-frontend-platform` evidence:

- canonical HUD scene family: `HudFrame`, `SceneStatusRail`, `TelemetryStrip`, `CalibrationTape`, `FocusAperture`, `EvidenceThreadHUD`, `InstrumentCluster`, `MoonWitnessHudShowcase`;
- visual certification reports 12 required domain instruments and 8 required page templates present;
- responsive metadata/CSS covers 1440 / 1280 / 1024 / 768 / 430 / 390 / 360;
- 27 canonical production icons remain deterministic;
- reduced-motion and high-contrast behavior are present;
- package `@arsybelovedlabs/moonwitness-frontend-platform@0.3.5` published and clean-registry consumer smoke passed;
- HUD implementation PR #41 merged at `1f612dad73858eb41cdba1b8398cfb3cc0a52646`;
- package publication repair PR #42 merged at `ad052bc99821bb82a7f970c9670b3e35304aea5b`;
- canonical static HUD review artifact PR #43 merged at `c3b3197896d792be317151a0f9566b036f9d53d7`;
- HUD Showcase Artifact run `33461785592` succeeded with artifact `9783410423`, digest `sha256:9a1ffccaba0ca64db12fb68256ce65e19002a96c95bfe41ae9a8969974647c78`;
- artifact contains individual review pages for full HUD scene, focus aperture, telemetry, evidence thread, and status/calibration plus canonical CSS;
- public `moonwitness-design-system` package-access probe PR #17 was intentionally closed unmerged after exact `403 permission_denied: read_package`; canonical ownership was not duplicated.

This checkpoint clears the **repository implementation** portion of `BLOCKED_BY_COMPONENT_SYSTEM`. It does **not** assert canonical Figma master readiness, page-level golden fidelity, public-Web final runtime fidelity, or final W0-11 completion.

## Public-Web HUD composition checkpoint — 2026-09-01

`moonwitness-wheremythfadetolegend` PR #10 now carries application composition that makes the Observatory visibly behave like an instrument surface without creating another reusable HUD owner:

- head `1c4201defe51aea83eded1de30dd1ede4662c7ef`;
- `ObservatorySceneChrome` is mounted through the application shell top rail;
- the scene chrome consumes canonical `MoonWitnessIcon` from the currently authorized frontend-platform package instead of inventing local reusable icon geometry;
- it exposes `OPERATING MODE / OBSERVE`, active instrument, `FROZEN BASELINE · AUGUST 2026`, evidence-first posture, calibration marks, and the exact causality guardrail;
- mobile/tablet recomposition and reduced-motion behavior are explicit;
- the source visual audit verifies exactly eight public tasks, no extra Home/research-run navigation, exact practice-level guardrail, Q/I/T/Z four-lens contract, 1440/1280/1024/768/430/390/360 responsive evidence, keyboard traversal, and no-horizontal-overflow checks;
- Observatory Data QA run `33468087621` succeeded;
- Observatory E2E run `33468087646` passed `Audit frozen visual contract`, then failed only at frozen dependency install with GitHub Packages `403` for the canonical frontend package;
- Docker Runtime run `33468087663` passed Compose validation, then failed at the same package read authorization boundary.

Interpretation: VISUAL-03 is **implementation-ready but package-auth-blocked**. PR #10 remains unmerged because required E2E/Docker gates are not green. The application remains pinned to frontend-platform `0.3.2`; upgrade to canonical HUD `0.3.5` must occur only after package-read authorization succeeds. No git-URL fallback or copied HUD implementation is permitted.

## P0 public-Web visual queue

1. MYTH-04 Spread Map
2. MYTH-08 Practice-Level Review
3. MYTH-11 Four Revelation Lens
4. MYTH-13 Candidate Pipeline
5. MYTH-02 Observation Ledger
6. MYTH-06 Correlation Engine
7. MYTH-01 Monthly Report / Observatory Home rework

## P1 public detail queue

8. MYTH-03 Observation Detail / Inspector
9. MYTH-10 Evidence Detail / Inspector
10. MYTH-12 Revelation Lens Detail
11. MYTH-14 Candidate Detail / Witness Inspector
12. MYTH-15 Archive Search target

## Consistency gates

- No generated image may invent a route, capability, state, metric, or reusable component geometry.
- Public Web navigation remains application-owned and limited to authorized task surfaces.
- Canonical icon geometry comes only from `moonwitness-frontend-platform`.
- Figma is the design master when present; do not create a competing master file.
- Current Figma discovery blocker remains `CANONICAL_FIGMA_FILE_URL_OR_KEY_NOT_DISCOVERABLE`.
- Generated showcase images are one-screen-per-image validation artifacts after component/UX readiness.
- Contact sheets/collages are non-canonical references and never count as golden-screen evidence.
- August 2026 historical data remains visibly `FROZEN BASELINE` and distinct from live state.
- Exact causality guardrail where applicable: `Temporal/geographic proximity does not establish causation.`
- Four Revelation Lens remains exactly four channels.
- Practice review remains practice-level only.
- Responsive widths must include 1440, 1280, 1024, 768, 430, 390, and 360 reference behavior.
- Status semantics must not rely on color alone.

## Completion rule

W0-11 cannot be marked complete until VISUAL-01, VISUAL-02 Figma/golden fidelity, VISUAL-03 full runtime fidelity, UI-DIST-01 consumer deployment, runtime smoke, CI, and deployment evidence are all reconciled. Protected-branch evidence remains a separate global Stage-2 governance blocker.
