# Five-Repository Re-Audit — Final Baseline 2026-08-30

Status: CANONICAL REFERENCE / PRE-GENESIS

This document records the final cross-check of the five legacy/reference repositories before Gen2 implementation. The repositories remain implementation evidence only; the blueprint remains architectural authority.

## Sources checked

- `bjo163/moonwitness` — `dev`
- `bjo163/moonwitness-corpus` — `dev`
- `bjo163/cosmic` — `dev`
- `bjo163/ALLAH-CRAYON-RGBL-ENGINE` — `dev`
- `bjo163/propetic` — `main`

## Verified technology and structural state

### moonwitness

Current root package is a private Turborepo workspace using `pnpm@10.33.4`, TypeScript 5 line, Vitest, and Node `>=20`. Root scripts explicitly operate separate web, command-center, and API applications. The repository also contains agent rules for backend/package architecture and monorepo package genesis.

Interpretation: this is the broadest application/platform legacy source and must be split by capability rather than copied. The future `moonwitness-web`, `moonwitness-commandcenter`, `moonwitness-api`, `moonwitness-core`, and frontend-platform boundaries are extraction targets.

### moonwitness-corpus

Current root uses `pnpm@10.33.4`, Node `>=20`, TypeScript, Turborepo, and a large corpus-specific command surface covering upstream sync, validation, quality, editions, materialization, audits, release preparation, SQLite build, benchmarks, contribution/ownership checks, and API serving.

Interpretation: Corpus is a knowledge build/release system, not ordinary CRUD. Preserve its build, validation, materialization, release, and provenance behavior while reducing accidental application/API coupling.

### cosmic

Current root package identifies as `moonwitness-os` version `4.33.0`, uses npm workspaces (`apps/*`, `packages/*`), Node `>=26 <27`, npm `>=11 <12`, Fastify-related API work, extensive package-level engine/runtime tests, persistence, jobs, witness, orchestration, semantic, temporal, Mizan, explanation, and AI/research certification.

Interpretation: Cosmic contains the richest reusable intelligence-engine capabilities but also the strongest toolchain drift from the desired ecosystem baseline. Preserve capability behavior and certification assets; extract into clean Gen2 packages. Do not reproduce the legacy monorepo identity or protocol surface verbatim.

### ALLAH-CRAYON-RGBL-ENGINE

Current root identifies as `allah-crayon-rgbl-engine` version `7.1.0-lab.1`, uses npm workspaces (`apps/*`, `packages/*`, `engine`), Node `>=20`, TypeScript 5.9, Vitest 3.x, and combines engine, research/LAB CLI, methodology, verification, and web integration in one workspace.

Interpretation: preserve the research methodology and validated computation behavior, but separate the reusable methodology engine from the Lab application. Core packages must not acquire a Next.js or UI dependency.

### propetic

Current root identifies as `prophet-research-engine` version `2.3.2`, uses npm workspaces for `apps/web` and `apps/api`, Node `>=22.13`, npm `>=10`, TypeScript 5.9.x, Playwright 1.62.x, and a SQLite-backed offline/research workflow with UI, API, scoring audit, handoff, docs integrity, and E2E verification.

Interpretation: keep as a bounded domain source. Do not let its SQLite/API/web arrangement become a cross-ecosystem architecture template.

## Final drift findings

| Area | Legacy condition | Gen2 policy | Priority |
|---|---|---|---|
| Package manager | pnpm and npm mixed | pnpm ecosystem baseline | MUST-FIX |
| Node | 20/22/26 mixed | latest-supported runtime policy | MUST-FIX |
| Workspace identity | multiple root identities | repository-specific canonical identity | MUST-FIX |
| Monorepo shape | heavy legacy workspaces | independent repos + small internal package sets | MUST-FIX |
| API | multiple local/server surfaces | one canonical `moonwitness-api` network door | MUST-FIX |
| Persistence | local DB patterns differ | private DB per capability | MUST-FIX |
| UI | app/UI/domain concerns mixed | frontend platform + application boundaries | MUST-FIX |
| Research verification | strong but distributed | preserve as golden regression/certification assets | PRESERVE |
| Provenance/witness | duplicated risk | one canonical contract owner | MUST-FIX |
| Async execution | jobs/queue in legacy engine | runtime + worker ownership | MUST-FIX |
| Observability | strong in Cosmic, mixed elsewhere | shared OTel semantics, portable implementation | MUST-FIX |

## Critical architecture conclusions

1. The five repositories are complementary legacy systems, not interchangeable service templates.
2. `cosmic` is the strongest source for reusable engine behavior and certification patterns.
3. `moonwitness-corpus` is the strongest source for knowledge ingestion, validation, materialization, and release discipline.
4. `ALLAH-CRAYON-RGBL-ENGINE` is the strongest source for methodology/research verification and LAB behavior.
5. `propetic` is a bounded research-domain source with valuable offline/E2E patterns.
6. `moonwitness` contains the broadest application/platform coupling and therefore receives the strongest capability-first decomposition.
7. No legacy repository is allowed to override a locked Gen2 architecture decision.
8. No worker may copy a legacy repository tree as the Gen2 target structure.

## Toolchain policy

Gen2 uses the latest stable toolchain that is supported by the target deployment environment. Upstream-current versions are monitored continuously, but production cannot require a runtime unsupported by Vercel/serverless or the selected Docker base image.

## Evidence rule

Every migration decision must preserve a source reference to repository + branch + commit SHA where available. When exact source behavior matters, the worker must preserve or select a golden regression test before refactoring.
