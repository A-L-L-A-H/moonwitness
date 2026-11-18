# R!OT OS — Local AI Operating Instructions

> [!IMPORTANT]
> **Absorbed Engine Subordination Notice (`2026-11-18`):** This file belongs to the absorbed archive under `engines/chronicle-os/moonwitness-os/` ([CONSOLIDATION-CATALOG.md](../../../docs/CONSOLIDATION-CATALOG.md)). Root [AGENTS.md](../../../AGENTS.md) and [DOCUMENTATION_GOVERNANCE_CONTRACT.md](../../../docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md) override this file on repository-wide Git branching (`dev` only), security, and CI gates.

> This file is the entry point for any coding agent working in this repository.

## Mandatory reading

Before editing code, read these files in order:

1. `.riot-ai/00-START-HERE.md`
2. `.riot-ai/01-MASTER-PROMPT.md`
3. `.riot-ai/02-PRODUCT-BRIEF.md`
4. `.riot-ai/03-DESIGN-DNA.md`
5. `.riot-ai/04-MONOREPO-ARCHITECTURE.md`
6. `.riot-ai/05-COMPONENT-AND-UX-SYSTEM.md`
7. `.riot-ai/06-ARTWORK-FACTORY.md`
8. `.riot-ai/07-ARTWORK-PROMPT-LIBRARY.md`
9. `.riot-ai/08-MIGRATION-EXECUTION.md`
10. `.riot-ai/09-QUALITY-GATES.md`
11. `.riot-ai/10-TODO.md`
12. `.riot-ai/11-ASSET-MANIFEST.json`

Do not treat the documents as optional inspiration. They are the project execution contract. Where the repository's actual state conflicts with an assumption in the kit, inspect the code, preserve working behavior, and record the discrepancy in `.riot-ai/12-LOCAL-AI-REPORT.md` before choosing the safest implementation.

## Mission

Turn this repository into **R!OT OS**, a production-quality, premium, reusable admin and operations template with a pnpm/Turborepo monorepo architecture and a distinctive **CHAOS BRUTAL GRUNGE GEN Z FUNKY** visual identity. The result must feel like an original underground design system crossed with an industrial command deck—not a generic SaaS dashboard and not a Vuexy clone.

## Non-negotiable rules

- Audit the repository before changing it. Inspect `git status`, current branch, package scripts, dependency versions, routes, components, styles, assets, and tests.
- Never overwrite, discard, reset, clean, or reformat unrelated user work. Do not run destructive Git commands.
- Do not claim a file, feature, artwork, test, or phase is complete unless it exists and has been verified.
- Do not stop after writing a plan. Execute the feasible implementation work and keep `.riot-ai/10-TODO.md` updated with evidence.
- Do not perform blind mass replacements. Migrate one bounded component or feature at a time and validate it.
- Reuse shared components and tokens. Do not duplicate a component because a screen needs a different visual treatment; compose it or add a typed variant.
- Keep dependencies flowing in one direction. No circular package dependencies and no app-to-app imports.
- Do not add empty packages, fake implementations, placeholder pages presented as complete, or decorative controls that do nothing.
- Do not use `any` to silence TypeScript. Do not add `@ts-ignore`, `@ts-nocheck`, or disable lint/type checks to force a green build.
- Do not keep `typescript.ignoreBuildErrors: true` in production configuration. Remove it only after real type errors have been fixed and verified.
- Respect the existing stack where it is sound. Do not upgrade major dependencies just for novelty; check compatibility and document a reason before changing them.
- Prefer accessible semantic HTML, keyboard operation, visible focus, reduced-motion support, and readable contrast over visual tricks.
- Artwork must be original. Do not copy Vuexy, other templates, logos, mascots, copyrighted characters, or a living artist's exact style.
- Do not fabricate service connectivity, real-time data, analytics, or operational success. Label demo data honestly.
- Do not commit, push, publish, or deploy unless the user explicitly authorizes it.

## Execution protocol

1. Establish a baseline and write it to `.riot-ai/12-LOCAL-AI-REPORT.md`.
2. Map the current source tree and identify existing behavior that must survive.
3. Convert the TODO into a verified task sequence. Keep tasks unchecked until implementation and validation are real.
4. Implement the architecture in small vertical slices: workspace foundation, tokens, shared primitives, layouts, component patterns, artwork pipeline, feature migration, documentation, quality gates.
5. After each slice, run the narrowest relevant checks. Before declaring a phase complete, run the repository's available lint, typecheck, test, and build commands.
6. Keep an evidence note for each completed task: files changed, command run, result, and known limitation.
7. Finish with a concise handoff report: completed, not completed, verification, risks, and next action.

## Design authority

The visual authority is `.riot-ai/03-DESIGN-DNA.md`. The architecture authority is `.riot-ai/04-MONOREPO-ARCHITECTURE.md`. The artwork production authority is `.riot-ai/06-ARTWORK-FACTORY.md`. The task authority is `.riot-ai/10-TODO.md`.

**North star:** chaotic in expression, precise in execution. Make the artwork unmistakably loud; keep navigation, data, and interaction unmistakably clear.
