# A-L-L-A-H & MoonWitness Ecosystem — Master Roadmap & Ordered Backlog

> **Focus Rule:** Prioritize `apps/a-l-l-a-h` + unified shared `@moonwitness/ui` / `@moonwitness/canon` monorepo consistency **before** any new Cloudflare deployments (`dev` branch integration first).  
> **Cross-References:** [CONSOLIDATION-CATALOG.md](./CONSOLIDATION-CATALOG.md) · [MASTER-CANON-CROSS-REPO-CODEX.md](./MASTER-CANON-CROSS-REPO-CODEX.md)

---

## Ordered Master Todo List (Easiest → Hardest)

### Tier 1 — Quick Wins, Copy & Edge Hygiene (`XS · Mudah`)

- [x] **01.** Add Cloudflare redirect rule for `www.a-l-l-a-h.com` → `https://a-l-l-a-h.com` (zone `8ac8bd9c13f367ba795929d1822d333f`).
- [x] **02.** Add copyable deep-link citations across `/scriptures?q=…` and `/mtime?preset=…` views in `apps/a-l-l-a-h`.
- [x] **03.** Ensure dedicated OpenGraph & canonical metadata coverage across `/scriptures`, `/mtime`, and `/codex` routes in `apps/a-l-l-a-h/src/app/*/page.tsx`.
- [x] **04.** Complete Indonesian (`ID`) copy parity in `canon-codex-sanctum.tsx`, `worlds-sanctum.tsx`, `dock-matrix-section.tsx`, and `covenant-about-section.tsx` (`sanctuary-locale.tsx`).
- [x] **05.** Normalize global keyboard navigation & Escape/backdrop handling across `universal-search-modal.tsx` and mobile drawer states.
- [x] **06.** Add route-contract Vitest coverage for `/api/scriptures`, `/sitemap.xml`, `/robots.txt`, and `/manifest.webmanifest`.
- [x] **07.** Consolidate repeated inline Tailwind badge/tab utility strings inside `mtime-observatory.tsx`, `scriptures-studio.tsx`, and `dock-matrix-section.tsx`.

### Tier 2 — Shared `@moonwitness/ui` Skin Isolation & Imperium Primitives (`S · Mudah–Sedang`)

- [x] **08.** Create `packages/ui/src/skins/dna-base.css` with strictly `[data-dna]`-scoped tokens (`--dna-canvas`, `--dna-surface`, `--dna-surface-elevated`, `--dna-text`, `--dna-muted`, `--dna-border`, `--dna-accent`, `--dna-accent-fg`, `--dna-focus`) — zero global `body` / `:root` overrides.
- [x] **09.** Create `packages/ui/src/skins/imperium.css` housing the canonical `01-imperium-lumen` visual system (`.btn-chamfer`, `.btn-luxe-secondary`, `.octa-bevel-shell`, `.portal-arch-card`, `.bg-girih-filigree`, `.text-gold-monument`, `.spatial-tilt-card`, `.hud-glass-capsule`, `.conic-halo-ring`, focus halos, and `prefers-reduced-motion`).
- [x] **10.** Export `"./skins/dna-base.css"`, `"./skins/imperium.css"`, and lightweight `"./imperium"` entry from `packages/ui/package.json`.
- [x] **11.** Create `packages/ui/src/skin/imperium.tsx` exporting shared geometry (`SacredCornerBrackets`, `OctagramCrest`) and DNA-adaptive primitives (`DnaButton`, `DnaChamber`, `DnaPortalArch`, `DnaBadge`) alongside `SkinRoot`, `SkinScope`, and `useDnaWorld`.
- [x] **12.** Add opt-in `"dna"`, `"imperiumPrimary"`, and `"imperiumSecondary"` variants to `packages/ui/src/components/ui/button.tsx` (plus matching variants in `badge.tsx` and `card.tsx`) without altering zine `"default"` styles used by `apps/web`.
- [x] **13.** Upgrade `MASTER_DNA_WORLDS["01-imperium-lumen"]` class mappings in `packages/ui/src/skin/dna-worlds.tsx` and add unit/DOM/contrast assertions in `packages/ui/src/skin/dna-worlds.test.ts` and `packages/ui/src/dx/contrast.test.ts`.
- [x] **14.** De-duplicate SVG vector geometry (`OctagramMandalaIcon`, `CrescentStarIcon`, `SearchLensIcon`, `DiamondStarOrnament`) between `apps/a-l-l-a-h/src/components/sacred-icons.tsx` and `@moonwitness/ui/imperium`.

### Tier 3 — Migrate `apps/a-l-l-a-h` & Cross-App Skin Parity (`M · Sedang`)

- [x] **15.** Wrap `apps/a-l-l-a-h/src/app/layout.tsx` inside `<SkinRoot dnaId="01-imperium-lumen">` from `@moonwitness/ui/imperium`.
- [x] **16.** Replace the local CSS primitive definitions in `apps/a-l-l-a-h/src/app/globals.css` with `@import "@moonwitness/ui/skins/imperium.css";`, retaining only Next local font definitions and base viewport scroll/color fallbacks.
- [x] **17.** Migrate `SacredCornerBrackets` and CTA/card/badge wrappers in `apps/a-l-l-a-h/src/components/*.tsx` to import directly from `@moonwitness/ui/imperium`.
- [x] **18.** Verify zero zine token leakage (`--pink`, `font-mono` body cascade) and clean tree-shaken bundles across both `next build` and `build:vinext` in `apps/a-l-l-a-h`.
- [x] **19.** Import `@moonwitness/ui/skins/dna-base.css` and `@moonwitness/ui/skins/imperium.css` into `apps/web` so `SkinLaboratory.tsx` renders authentic chamfered Imperium controls alongside all 7 Master DNA Worlds.
- [x] **20.** Align `@rocksoul/ui` (`engines/community`) design tokens and typography scales with `@moonwitness/ui` (`03-rocksoul` / `02-lunar-chronicles`) so `community.moonwitness.biz.id` shares one design contract.
- [x] **21.** Wire `@moonwitness/ui` (`03-rocksoul` DNA scope) into `apps/rocksoul` (`package.json` + shell styles).

### Tier 4 — Consolidate Remaining Uncollected GitHub Repos (`M–L · Sedang–Tinggi`)

- [x] **22.** Audit & absorb unique `.contracts`, `.plans`, and UI tokens from `bjo163/A-L-L-A-H.COM` cleanly into `engines/empire-origin` / `docs/`.
- [x] **23.** Audit & absorb `bjo163/ALLAH-CRAYON-UI-ENGINE` into `engines/crayon/ui-engine/` to unite with `ALLAH-CRAYON-RGBL-ENGINE`.
- [x] **24.** Absorb `bjo163/moonframe` (15-skin dual-mode engine) and `ArsyBelovedLabs/moonwitness-design-system` (`DESIGN_CONSTITUTION.md`, `COMPONENT_INVENTORY.md`, `CONSUMER_CONTRACT.md`) specs/components into `docs/design/` and `packages/ui`.
- [x] **25.** Absorb `bjo163/rocksoul-ui` and release manifest contracts from `bjo163/rocksoul-assets` cleanly into `packages/ui` and `packages/assets`.
- [x] **26.** Absorb `bjo163/rocksoul-crayon` and `ArsyBelovedLabs/moonwitness-crayon-lab` into `engines/crayon/`.
- [x] **27.** Absorb the unconsolidated Rocksoul domain repos listed in `engines/community/README.md`: `bjo163/rocksoul-mftl` (`STORY`), `rocksoul-legend` (`EVENT`), `rocksoul-superhero` (`PERSON`), `rocksoul-jizz` (`PERSPECTIVE`), `rocksoul-correlation` (`RELATIONSHIP`), `rocksoul-platform` (`IAM`), and `rocksoul-web`.
- [x] **28.** Inspect `bjo163/rocksoul-aws`, `BRIDGE-ALLAH/MW-UI`, and `BRIDGE-ALLAH/EMPIRE-OF-LIGHT` to separate upstream third-party clones (stay quarantined) from original MoonWitness/Rocksoul specs & code.
- [x] **29.** Inspect & absorb unique contracts/schemas from `bjo163/moonwitness-II-q4q`, `bjo163/moonwitness-x`, `A-L-L-A-H/moonwitness-XX`, and `A-L-L-A-H/moonwitness-os`, refreshing `docs/CONSOLIDATION-CATALOG.md`.

### Tier 5 — Rebuild Static `engines/*` into Runtime Packages & Portals (`L · Tinggi`)

- [x] **30.** Parse & package full OSHB WLC Hebrew (`Torah` + `Psalms`) and SBLGNT Koine Greek (`Matthew`–`John`) compact search JSON datasets from `engines/corpus-srgbl` alongside `quran-uthmani.json` (`6,236` ayahs).
- [x] **31.** Upgrade `packages/canon/src/divine-text-engine.ts`, `/api/scriptures`, and `/scriptures` studio so all four revealed witnesses (`TAURAT · ZABUR · INJĪL · AL-QUR’ĀN`) support unified live query & morphological citation linking.
- [x] **32.** Port `engines/witness-semantic` (`WSI` semantic candidate & 7-swing framing engine) into `@moonwitness/canon` with full test coverage and interactive UI inspection in `apps/a-l-l-a-h`.
- [x] **33.** Port `engines/crayon` (`RGBL` + `SRGBL v8` `S1..L5` formal evaluator with strict `0/0 → UNKNOWN` invariant and zero religion ranking) into `@moonwitness/canon`.
- [x] **34.** Port `engines/prophetic` (`v2.3.2` crosswalk contracts) and `engines/dhgs` (`13`-step assurance state machine) into `@moonwitness/canon`.
- [x] **35.** Port `engines/ontology` (`49` OX-DX levels) and `engines/aqel` (Arabic-first AST/lexer sandbox) into `@moonwitness/canon` and expose interactive Canon explorers under `/codex`.
- [x] **36.** Wire historical Kemenag/Diyanet/MABIMS `1445–1447 H` falsification datasets from `engines/mtime` directly into `/mtime` Observatory comparison panels.
- [x] **37.** Add client-side IndexedDB/JSON Muḥāsabah & 25-Amanah stewardship reflection export in `remembrance-sanctuary.tsx` with zero server PII persistence.

### Tier 6 — Infrastructure, Cross-App Federation & Release (`XL · Kompleks`)

- [x] **38.** Bind existing Cloudflare R2 bucket (`moonwitness`) and KV (`CACHE`) to `allah-sanctuary` for full four-scripture search artifacts without exceeding Worker bundle budgets.
- [x] **39.** Standardize shared telemetry & health contracts across `allah-sanctuary` (`a-l-l-a-h.com`), `sovereign-codex-edge` (`codex.a-l-l-a-h.com`), `rocksoul-community` (`community.moonwitness.biz.id`), and `moonwitness-radio`.
- [x] **40.** Designate the single canonical `ARSY` control plane across competing Go/Rust/TS incarnations (`cp/arsy`, `ARSY-x`, `MWX`) per `MASTER-CANON-CROSS-REPO-CODEX.md §VII.3`.
- [x] **41.** Format, typecheck, Playwright-verify, and commit the 108 concurrent working-tree changes (`apps/web`, `packages/ui`, `packages/assets`, `packages/types`) on `dev`.
- [x] **42.** Add cross-world WCAG & Playwright visual regression gates in CI verifying both `01-imperium-lumen` and zine worlds cleanly.
- [x] **43.** Deploy unified `apps/web` (`moonwitness.biz.id`), `apps/a-l-l-a-h`, and unified `@moonwitness/ui` ecosystem targets together after full monorepo gate pass.
- [ ] **44.** Execute final `pnpm gate:release` promotion (`dev → main`) with synchronized changelog and version tags. _(v0.4.0 manifest, CHANGELOG, and PR `#145` synchronized on `dev`; `main` promotion awaits owner PR merge per `.githooks/pre-push` & `.github/workflows/auto-promote.yml`.)_
