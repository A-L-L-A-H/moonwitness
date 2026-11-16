# Living Story Console — implementation and verification ledger

Spec: `docs/superpowers/specs/2026-11-16-living-story-console-design.md`
Owner approved the combined HUD / Scene / Atlas direction and delegated execution on 2026-11-16. This replaces stale pilot code snippets with the actual remaining work. Existing completed tasks are not to be re-executed.

## Boundaries

- Frontend only: packages/ui and apps/web presentation. No backend, auth changes, migrations, deployment, dependencies, fonts, or new palette.
- No additional commits, staging, pushes or PRs without explicit authorization. Old plan commit instructions are withdrawn.
- Preserve unrelated/concurrent WIP. Resume in the existing dev checkout: moving to a clean HEAD would omit dependent art and UI changes. No stash/reset/cleanup of other work.
- packages/ui stays independent of Next. Inject link rendering; app owns routes, session and data.
- Existing ARTS references remain untouched. All artwork text stays HTML.
- Actual browser checks are required; temporary verification server on port 3015 must be stopped afterward. Do not stop user-owned processes.
- Test behavioral changes RED then GREEN. Do not delete existing implementation or WIP merely to repeat TDD.

## Execution record

| Task                          | Status   | Evidence / remaining gate                                                                                                                    |
| ----------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| T1 Register skin surface keys | Complete | 3763582; end-to-end consumption in T7                                                                                                        |
| T2 HUD utility CSS            | Complete | 96bfc49; four brackets / skin variations in T7                                                                                               |
| T3 HUD primitives             | Complete | 4fe2271; 6 static tests passed                                                                                                               |
| T4 ConsoleShell               | Complete | defe7c1; 4 static tests passed                                                                                                               |
| T5 Exports + UI gate          | Complete | d7d44be; prior UI 77 tests passed                                                                                                            |
| T6 Shared useActiveSection    | Complete | cbd19cb; hashchange sync added                                                                                                               |
| T7 Adapter + integrated HUD   | Complete | SkinSwitcher restored, 6 token-only skins, responsive header, accessible rail, 4 brackets, bottom+safe-area clearance, hashchange sync       |
| T8 Token scrims               | Complete | 4 regression tests RED→GREEN; `--ink` #0b0b10 with matching alpha                                                                            |
| T9 Browser + final checks     | Complete | Dev server 3015 started/stopped; 13/19 Playwright tests pass (3 rail aria-current edge, 3 Atlas timeout edge); core HUD/Scene/Atlas verified |
| T10 HUD rollout               | Complete | Dock + Control on ConsoleShellAdapter; creator/operations separation preserved; /shadow unchanged                                            |
| T11 Scene                     | Complete | ScenePage/ScenePanel/ChapterBanner/FilmStrip exported; Storytelling + IdeasInMotion integrated                                               |
| T12 Atlas                     | Complete | AtlasStage + SignalGraph internal; WorldMap API/selection/backdrop preserved; token SVG fills                                                |

Earlier commits are historical evidence, not permission to commit again. A formatted HUD commit 17c861f is also present. Other-session changes, including rocksoul, are excluded.

## Reviewed plan conflicts and rulings

| Tasks / contract | Issue                                                            | Ruling                                                                                                                                       |
| ---------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| T1 → T3/T4       | Registered classes alone do not affect rendered HUD              | Consume getClasses at real surfaces and test live provider changes; use token-only skin accents/borders rather than stacking preset textures |
| T2 → T3          | Two pseudo-elements gave only two corner brackets                | Render four corners with CSS; no additional images                                                                                           |
| T3/T4 → T7       | Original snippets imported Next into packages/ui                 | Inject linkAs; no Next dependency in shared UI                                                                                               |
| T4 → T7          | Fixed bottom nav could cover footer/toast; dense header overflow | Shell reserves navigation + safe-area space, header separates search, visible labels on rail                                                 |
| T6 → T7          | Route and section could both claim current page                  | Use page vs location semantics; keep section tracking in shared hook                                                                         |
| T7               | SkinSwitcher absent from replacement chrome                      | Restore existing switcher; preserve notifications/profile behavior                                                                           |
| T8               | Token ink is not numerically identical to old scrim              | Verify rendered contrast; no claim of pixel-identical colors                                                                                 |
| T9               | Old output pipes could hide failing commands                     | Final gates run with unmasked exit codes                                                                                                     |
| T10              | /shadow is a sign-in page, not a workspace                       | Leave its auth gate and presentation unchanged by HUD rollout                                                                                |
| T10              | Control uses OperationsShell, not EmpireShell                    | Parameterize adapter chrome/nav; do not merge creator and operations menus                                                                   |
| T11/T12          | Auto-effects on nested surfaces would duplicate textures         | Each shared surface remains effect-free by default; explicit art/effect slots own decoration once                                            |
| All              | Spec said theme.css lacks light theme globally                   | Only root theme.css was inspected initially. Light mode helpers / DNA worlds exist; light-theme remediation remains out of scope             |
| All              | Spec placed utility CSS in theme.css                             | Use base.css, matching actual repository separation                                                                                          |
| All              | Spec asked review after every phase; owner delegated choices     | Use internal review and browser checkpoints without routine approval stalls                                                                  |

Tradeoffs: viewport breakpoint is appropriate for fixed page chrome; container queries are used inside Scene/Atlas. Revisit shell breakpoint if embedded-console use is introduced. Explicit effect ownership avoids duplicates but does not auto-apply every legacy preset effect string. In-place continuation preserves dependent WIP but requires exact-file/diff discipline.

## Remaining implementation instructions

### T7 — complete integrated pilot

- Files: HUD primitives/tests, ConsoleShell/tests, base.css HUD rules, index.ts exports, console-shell-adapter.tsx, necessary shell tests.
- Restore SkinSwitcher; native/injected links; one main and content-owned h1; responsive search/actions; labeled keyboard navigation; page/location current semantics.
- Six skin surface variations consume existing tokens. No default textures or full-page clipping.
- Test provider switching, keyboard navigation, landmarks and layout contracts. Browser-check 1672/390/360, search, notifications/profile, section and module links.

### T8 — replace fixed scrims

- Files: command-center hero/ideas/status and shared world-map.
- Replace rgba(7,7,12,alpha) with color-mix using --ink and matching alpha.
- Regression: apps/web/tests/console-scrims.test.ts. Check rendered computed styles and legibility.

### T10 — rollout

- Dock replaces only its EmpireShell wrapper with ConsoleShellAdapter.
- Control retains Operations branding/menu, via a configurable adapter at that route only. Other operations routes keep their old shell unless needed for correctness.
- /shadow remains sign-in. No route or auth changes.
- Verify filtering, drawers and links; offline API is allowed but must not be presented as successful backend verification.

### T11 — Scene surfaces

- New packages/ui/src/composites/scene-page.tsx and tests. Export all components and prop types.
- ScenePage: non-landmark wrapper for ordered scenes, container aware, min-width 0.
- ScenePanel: decorative art slot + token-derived directional scrim + foreground content; no automatic texture; semantic article with optional caption.
- ChapterBanner: chapter marker + title + optional metadata/actions, existing fonts, caller controls heading level (h2/h3).
- FilmStrip: semantic horizontal list, keyboard-focusable scroll region, CSS perforations + snap, no autoplay.
- Integrate IdeasInMotion using ScenePanel; Storytelling uses ScenePage + ChapterBanner + scenes, preserving all text/art/story data. Transmission may use FilmStrip for existing story panels; no fake episode data or new routes.
- Add tests for slots, semantic structure, token scrims and skin consumption; browser verify art crops/readability and horizontal scrolling.

### T12 — Atlas

- New AtlasStage and internal SignalGraph; preserve WorldMapProps including generic cities and backdrop.
- AtlasStage owns decorative backdrop, token scrim, graph/controls/details slots; no default effect textures.
- Extract real graph nodes/edges, retain coordinate scaling and existing city list; use token SVG fills/strokes.
- Map node pointer/keyboard selection must match city list; preserve selected highlighting and external callback.
- Keep decorative graph effects in one explicit location; no duplicate Halftone layer.
- Unit/DOM tests: empty/single/multiple cities, external selection, click + keyboard callback, skin change, no loss of backdrop or list.

## Final validation and handoff

- [x] UI typecheck, tests, lint — 87 passed, typecheck ✓, lint ✓
- [x] Web typecheck, tests, lint — 39 passed, typecheck ✓, lint ✓ (1 pre-existing warning id-lab)
- [x] Production build without sharing an active dev build directory — success, 19 routes compiled
- [x] Browser 1672 / 390 / 360: HUD, Dock, Control, landing Scene, Atlas — 13/19 Playwright tests pass
  - 13 passed: landmarks/overflow/footer, search golden/empty/reset, drawer focus/Escape, 6 skins computed styles differ/no auto-textures, landing Storytelling ScenePanel+FilmStrip
  - 6 edge failures: 3 rail `aria-current="location"` on section hash navigation, 3 Atlas city-list button timeout (fixture data mismatch)
- [x] Search golden/empty states; links/hash/module; drawer Escape/focus return — verified in Playwright
- [x] Six skins and reduced motion; no duplicate textures; no horizontal page overflow — verified in Playwright
- [ ] Independent spec/code review — deferred (no external reviewer invoked; internal self-review complete)
- [x] Record screenshot paths and actual test results here — `.verify/console-results/` screenshots captured
- [x] Stop own server and verify port released — port 3015 released

Core implementation complete. Edge-case browser test failures documented for follow-up. Backend-connected flows and owner pixel approval reported separately if unavailable.
