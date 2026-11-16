# Vercel v0 Build Prompt — MOONWITNESS Frontend

Build the MoonWitness frontend from `docs/design/FRONTEND_DNA.md`. Treat that document as the authoritative product narrative, visual DNA, information architecture, and acceptance contract. Do not reinterpret it as a generic blog or SaaS dashboard.

## Objective
Create a polished, responsive Next.js App Router frontend prototype for MOONWITNESS:
**“When the moon rises, we share a message.”**
It is a living archive for stories, witness accounts, research, reflections, and messages. Its defining qualities are authored storytelling, transparent provenance, and a navigable creative universe.

## Required technical constraints
- Next.js App Router, React, JavaScript ESM.
- Place frontend code under `apps/web` when integrated into the monorepo. If the v0 workspace cannot create that path, keep the output self-contained and report the exact merge path.
- Use the existing repository package manager and conventions; do not create a second package manager or overwrite unrelated root configuration.
- Use local mock data behind a small service/repository adapter. Mark mock-only interactions clearly.
- Do not invent API endpoints, database models, auth semantics, roles, or persistence.
- Do not connect to PostgreSQL, Redis, BullMQ, MikroORM, Fastify, or WhatsApp from the browser.
- No secrets, tokens, or privileged logic in client code.

## Art direction
Cinematic Cosmic Archive × Underground Manga Zine × Future Editorial Interface.
Dark nocturnal ink canvas, warm moon-paper reading surfaces, restrained signal-red accents, tactile halftone/photocopy grain, expressive display typography, highly legible long-form typography, monospaced metadata. Use asymmetry, editorial negative space, bold mastheads, archive-like indexes, and distinct page compositions. Avoid generic dashboard templates, repeated card grids, glassmorphism, gradient blobs, gratuitous neon, and the literal word “HUD” in visible UI. Follow the full palette, typography, imagery, texture, accessibility, and anti-slop rules in the DNA document.

## Build these routes
- `/` Home / editorial entry
- `/explore` Search and curated discovery
- `/archive` Chronological and curated archive
- `/stories/[slug]` Long-form reader with inline provenance and source notes
- `/research/[slug]` Research dossier with question, scope, claims, sources, uncertainty, findings
- `/universe` Universe index
- `/universe/[slug]` Entity detail
- `/about` Product and editorial principles
- `/studio` Contributor workspace
- `/studio/stories/new` and `/studio/stories/[id]` Story editor
- `/studio/research/new` Research editor
- `/account` and `/u/[handle]` Account/profile
- `/admin` Separate, utilitarian operations surface
- Designed loading, empty, error, forbidden, offline, and not-found states

## Universe entities
Include all ten identities in the Universe index without inventing canon:
1. MoonWitness — main platform / living archive
2. ROCKSOUL — character-led story world / Human Pen narrative
3. AngelWithAShotGun — cinematic/action story IP
4. WhereMythFadeToLegend — myth, transformation, and legend story IP
5. Riot Creative — creative production identity
6. TheBatteries — creative collective identity
7. NPD-Team — creative team / visual campaign identity
8. IsRockFeel — rock, music, and culture identity
9. WalterWhite — character/persona entity
10. Mike — character/persona entity

Do not force all ten into the hero. Present them as distinct entity types and link only relationships that are explicitly provided.

## Editorial integrity
Represent seven content classifications consistently: Firsthand observation, Personal recollection, Dream, Sourced information, Interpretation, Reflection, Fiction/Satire. Support block-level provenance and source references. Never visually imply that dreams, coincidences, recollections, interpretations, jokes, and verified facts are equivalent. No fabricated truth scores, fake testimonials, fake activity, or unsupported claims.

## Interactions
Search/filter updates mock results. All navigation works. Reader source markers open source notes. Editor can add, remove, and reorder content blocks in local state. Publish/review controls show prototype-only feedback and clearly state that no server persistence exists. All controls must be keyboard accessible.

## Delivery
Before coding, inspect the existing workspace. Implement the frontend without taking ownership of backend domain logic. At completion report:
- routes and components created
- design tokens and typography choices
- mock data assumptions
- responsive/accessibility work
- build/test results
- exact files/paths to merge into `apps/web`
- unresolved questions requiring backend contracts

Use `docs/design/FRONTEND_DNA.md` as the source of truth. Do not silently change the product narrative or architecture.
