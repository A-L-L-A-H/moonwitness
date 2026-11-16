# MOONWITNESS — Frontend DNA & UI Design Contract

**Status:** Product/design direction v1.0  
**Repository:** `isrockfeel/moonwitness`  
**Frontend owner:** `apps/web` (Next.js App Router, JavaScript ESM)  
**Handoff target:** Vercel v0  
**Backend contract owner:** Fastify API; frontend must consume contracts, never invent backend behavior.

---

## 1. Product thesis

**MOONWITNESS is a living archive for stories, witness accounts, research, reflections, and messages.**

Tagline: **When the moon rises, we share a message.**

MoonWitness is not a generic blog, social-media clone, AI content farm, or admin dashboard. It is a place where a person can preserve an experience, turn it into a carefully attributed story, investigate a question with sources, distinguish interpretation from evidence, and publish a message for others.

The product must make three things feel equally important:

1. **The story** — human voice, narrative rhythm, reading experience.
2. **The provenance** — where a statement came from, what kind of claim it is, and what remains uncertain.
3. **The archive** — the ability to find, connect, revisit, and contextualize material over time.

Product promise: **Every story has a voice. Every claim has a context. Every source has a place.**

### What MoonWitness is

- A publishing and archival platform.
- A research-friendly reading environment.
- A home for multiple creative IPs, series, collectives, and character-led narratives.
- A platform that preserves provenance, corrections, and editorial context.
- A modular product that can grow through optional add-ons without changing its core identity.

### What MoonWitness is not

- Not a timeline-first social network.
- Not a generic CMS skin.
- Not a dashboard composed of identical cards.
- Not an oracle or an automated truth-decider.
- Not a place where dreams, coincidences, personal recollections, interpretations, fiction, and verified facts are silently treated as the same thing.

---

## 2. Creative universe: one archive, many identities

The following names belong in the MoonWitness universe map. Treat them as **distinct IPs, labels, collectives, cultural identities, or character entities**, not as ten unrelated applications. Do not invent canon, plot, ownership relationships, biographies, or character backstories that are not supplied by the project.

| Identity | Current product classification | UI treatment |
|---|---|---|
| MoonWitness | Main platform and living archive | Primary visual identity and global navigation |
| ROCKSOUL | Character-led story world / Human Pen narrative | Story series identity; raw, human, editorial |
| AngelWithAShotGun | Cinematic/action story IP | High-contrast cinematic cover and episodic layout |
| WhereMythFadeToLegend | Myth, transformation, and legend story IP | Mythic editorial collection; archive-first |
| Riot Creative | Creative production identity | Studio / production label metadata |
| TheBatteries | Creative collective identity | Collective profile and grouped works |
| NPD-Team | Creative team / visual campaign identity | Campaign and poster-oriented collection |
| IsRockFeel | Rock, music, and culture identity | Music/culture collection and audio-ready metadata |
| WalterWhite | Character/persona entity | Character index entry; canon supplied separately |
| Mike | Character/persona entity | Character index entry; canon supplied separately |

### Universe navigation rules

- The global product remains **MoonWitness**. Do not rename the application to IsRockFeel or Riot Creative.
- IP identities appear as curated **Worlds**, **Series**, **Collectives**, **Labels**, or **Characters** depending on their classification.
- A story can belong to a series and reference multiple entities; avoid duplicating the story to place it in multiple collections.
- The UI must visually distinguish platform navigation from universe navigation.
- Do not force every identity into the homepage hero. Feature only a small, editorially selected set.
- Unknown relationships must render as unlinked entities, not inferred connections.

---

## 3. Editorial integrity system (non-negotiable)

MoonWitness must visibly distinguish the nature of material. These labels are part of the product's information architecture, not decorative tags.

| Content classification | Meaning | Suggested UI label |
|---|---|---|
| Firsthand observation | Directly observed by the author | Firsthand |
| Personal recollection | Remembered experience | Recollection |
| Dream | Experience during sleep / dream | Dream |
| Sourced information | Claim attributed to an external source | Sourced |
| Interpretation | Personal analysis or meaning assigned | Interpretation |
| Reflection | Considered thought or lesson | Reflection |
| Fiction / satire | Invented, dramatized, or humorous material | Fiction / Satire |

Rules:

- A single story may contain blocks with different classifications.
- Display provenance near the relevant passage or claim, not only at the bottom of a long page.
- Sourced claims must have source references with title, publisher/author where known, URL, access date where available, and quoted/paraphrased context.
- Distinguish author statements from cited statements.
- Never display an unverified statement with a visual treatment that implies verification.
- Do not assign a truth score or claim scientific/religious proof without an explicit, documented methodology.
- Dreams, coincidences, personal experiences, jokes, and interpretations must never be silently promoted to verified facts.
- Preserve visible correction history and editorial notes when a published story is materially changed.

### Provenance component vocabulary

Use a consistent compact vocabulary: `FIRSTHAND`, `RECOLLECTION`, `DREAM`, `SOURCED`, `INTERPRETATION`, `REFLECTION`, `FICTION`. In reader mode, render friendly labels; in contributor/editor tools, expose the precise classification and source controls.

---

## 4. Visual DNA

### Core art direction

**Cinematic Cosmic Archive × Underground Manga Zine × Future Editorial Interface.**

The visual language should feel like discovering a carefully curated archive inside a strange, nocturnal creative universe. It may borrow the confidence of a premium console game interface, the energy of underground photocopied zines, and the restraint of an independent editorial publication. It must not look like a generic SaaS dashboard.

### Mood

- Nocturnal, atmospheric, tactile, curious, independent, rebellious but considered.
- Premium through composition, typography, proportion, pacing, and detail—not through gratuitous gradients.
- Funky but beradab: expressive and playful without becoming noisy or disrespectful.
- Human and authored; never sterile or mass-produced.

### Palette direction

Use semantic tokens rather than scattering literal color values through components.

- **Ink / Night:** near-black blue-charcoal for the main dark canvas.
- **Moon Paper:** warm pale paper for reading surfaces and selected light editorial sections.
- **Lunar Silver:** restrained cool gray for secondary information, borders, and metadata.
- **Signal Red:** controlled accent for selected actions, active markers, and editorial emphasis.
- **Signal Acid:** rare, small-area highlight for special states or experimental collections.
- **Muted Plum / Deep Blue:** secondary atmospheric colors for artwork, not competing UI accents.

Suggested starting values (tune only through a documented token change):
- Night: `#090B10`
- Deep Surface: `#11151D`
- Raised Surface: `#191F29`
- Moon Paper: `#EEECE5`
- Lunar Silver: `#A8B0BC`
- Signal Red: `#F05243`
- Signal Acid: `#C9E86A`

Use the warm paper mode selectively for long-form reading and editorial print-like views. Dark mode remains the default brand environment.

### Typography

Use a deliberate 3-role system:
- **Display / posters:** bold condensed or grotesk display face for short titles and strong editorial impact.
- **Reading:** highly legible serif or humanist sans for long-form story text.
- **Utility / metadata:** monospaced face for IDs, dates, source metadata, content classifications, and technical labels.

Typography rules:
- Headlines can be expressive; body copy must remain calm and readable.
- Never use uppercase for every paragraph.
- Keep a controlled type scale and line lengths.
- Use typographic contrast—not a wall of badges—to show hierarchy.
- Load fonts through `next/font` where licensing and availability permit; provide robust fallbacks.

### Texture and imagery

- Use genuine project artwork, photography, scans, custom illustrations, diagrams, and authored cover art.
- Approved texture vocabulary: halftone, photocopy grain, ink bleed, paper fiber, subtle scratches, manga speed lines, torn-paper edges, registration offset, night-sky photography.
- Keep texture behind content and below readable contrast.
- Prefer silhouettes, back-facing figures, hands, objects, landscapes, moonlight, architecture, and typography-led covers. Faces are not required and must not be fabricated as a default brand motif.
- Do not use random stock-photo collages or generic AI galaxy backgrounds.
- Every image must have an editorial purpose, alt text, and a predictable crop.

### Shape, layout, and motion

- Use strong alignment, asymmetry, intentional negative space, oversized editorial titles, narrow metadata rails, and occasional full-bleed visual moments.
- Allow different pages to have different compositions while preserving shared tokens, typography, spacing, and navigation grammar.
- Corners are mostly square or slightly softened; avoid the default rounded-card-everywhere aesthetic.
- Motion should be restrained: reveal, crossfade, subtle parallax only where it supports discovery. Respect reduced-motion preferences.
- No decorative animation that delays reading or navigation.

### Strict anti-slop rules

Do not:
- Use a generic SaaS dashboard template as the primary product shell.
- Repeat the same 3-column card grid on every page.
- Cover the UI with purple/blue gradient blobs, glassmorphism, neon glows, or gratuitous blur.
- Use oversized rounded cards as a substitute for layout design.
- Put fake data, fake activity, fake testimonials, fake counters, or invented engagement metrics into the design.
- Put the literal word **HUD** anywhere in the product UI.
- Add arbitrary icons to every label.
- use decorative elements that reduce text contrast or keyboard usability.
- make every IP look identical; each can have a distinct cover/series treatment while remaining inside MoonWitness design tokens.

---

## 5. Information architecture and screens

Build the following responsive routes as a coherent, clickable frontend prototype. Use realistic, clearly labeled mock data only; do not imply that mock actions persist to a real backend.

### Public experience

1. **Home — `/`**
   - Strong editorial masthead: MOONWITNESS, tagline, a clear entry into the archive.
   - One featured story / message with a deliberate full-width art direction.
   - Small selected collections / worlds, not a giant generic card grid.
   - Recent archive entries with title, author, date, classification, and reading time only when backed by data.
   - A compact "how this archive works" explanation emphasizing provenance.
   - Clear paths to Explore, Stories, Research, and the Universe.

2. **Explore — `/explore`**
   - Search, filters, and curated editorial shelves.
   - Filters for content type, world/series, topic, author, date, and provenance classification.
   - Useful empty state and clear removable filter chips.
   - A dense list/editorial index option; cards are not the only presentation.

3. **Archive — `/archive`**
   - Chronological and curated views.
   - Strong time navigation and metadata.
   - Make it feel like an archive catalogue, not a social feed.

4. **Story reader — `/stories/[slug]`**
   - Excellent long-form typography and reading width.
   - Title, subtitle, author, publication date, updated date, series/world, and cover art.
   - Table of contents for long stories.
   - Inline provenance/source markers connected to source notes.
   - Related stories and correction history when available.
   - Clear distinction between author narrative and sourced material.

5. **Research dossier — `/research/[slug]`**
   - Research question, scope, methodology notes, source list, claims/evidence map, uncertainty, and conclusion/next questions.
   - Sources and claims should be navigable in both directions.
   - Never display a synthetic confidence score unless a documented methodology provides one.

6. **Universe — `/universe`**
   - Explore Worlds, Series, Collectives, Labels, and Characters.
   - Each entity has a short description, classification, associated works, and relationships only where explicitly supplied.
   - Distinct visual identity for each collection; same global interface grammar.

7. **Entity detail — `/universe/[slug]`**
   - Entity masthead/cover, description, classification, curated works, collaborators where known, and connected entities where confirmed.
   - Avoid invented lore.

8. **About / principles — `/about`**
   - Explain what MoonWitness is, how content classifications work, source/correction policy, and how to contribute.

### Contributor experience

9. **Contributor studio — `/studio`**
   - A focused workspace for drafts and editorial work.
   - Clear statuses: Draft, In Review, Changes Requested, Scheduled, Published, Archived.
   - Show only real workflow information (mock data must be labeled).

10. **Story editor — `/studio/stories/new` and `/studio/stories/[id]`**
    - Title, subtitle, cover, body blocks, series/world, topics, visibility, and publication settings.
    - Each block can be assigned a provenance classification.
    - Source references can be attached to specific blocks/claims.
    - Autosave indicator in the prototype must be clearly simulated; do not claim backend persistence.
    - Preview and publish controls can be interactive mock actions with explicit prototype feedback.

11. **Research editor — `/studio/research/new`**
    - Research question, scope, claim entries, source references, methodology note, uncertainty and findings.
    - Make evidence entry structured and easy for small screens.

### Account and platform states

12. **Account / profile — `/account` and `/u/[handle]`**
    - Profile, authored works, public collections, privacy-aware fields.
    - Do not expose private details in public profile mockups.

13. **Not found, empty, loading, error, forbidden, offline**
    - Design these states deliberately; no blank screens or fake success.

### Admin / operations (separate visual surface)

14. **Operations — `/admin`**
    - This is not the default home or the main visual identity.
    - A denser, utilitarian interface for user roles, content moderation, add-on status, jobs, audit trail, and system health.
    - Avoid designing business logic in the frontend; it will later consume server-owned API contracts.

---

## 6. Navigation and responsive behavior

- Desktop: editorial masthead plus compact primary navigation; allow a slim contextual rail where it helps. Avoid a permanent wide admin sidebar on public pages.
- Mobile: compact top bar, thumb-friendly menu, readable story width, and sticky reading controls only when useful.
- Primary navigation: **Explore / Archive / Research / Universe / About**.
- Contributor actions appear only when the user is authenticated and authorized.
- Admin navigation appears only for authorized roles and stays visually separate.
- Provide visible focus states, keyboard navigation, skip links, semantic landmarks, accessible dialogs, and WCAG AA contrast.
- Do not depend on hover for critical information or actions.

---

## 7. Component design system

Create reusable components with clear responsibilities; do not build a monolithic page full of inline styling.

Suggested primitives:
- `MoonwitnessWordmark`, `Masthead`, `PrimaryNav`, `MobileNav`
- `EditorialHero`, `StoryCover`, `StoryIndexRow`, `StoryFeature`
- `ProvenanceLabel`, `SourceInlineMarker`, `SourceReferencePanel`
- `ArchiveTimeline`, `FilterBar`, `SearchCommand`
- `UniverseEntityHeader`, `WorldIndex`, `SeriesStrip`
- `ResearchQuestion`, `ClaimEvidenceRow`, `MethodologyNote`
- `EditorCanvas`, `BlockTypePicker`, `SourceAttachPanel`, `PublishChecklist`
- `EmptyState`, `ErrorState`, `LoadingSkeleton`, `PermissionState`
- `PrototypeNotice` for all mock-only actions/data.

Component rules:
- Tokens first; no one-off colors without a design reason.
- Semantic HTML and accessible labels.
- Every interaction has a keyboard path.
- Data components accept props; no hidden global mock data.
- Use explicit loading/error/empty states.
- Keep content and presentation separate.
- No backend calls in the generated prototype until the API contract is agreed.

---

## 8. Frontend implementation contract for v0

- Build **Next.js App Router with JavaScript ESM**, not a separate standalone Vite app.
- Keep all frontend implementation under `apps/web` when this repository is opened as a monorepo.
- Use responsive, composable React components.
- Use a local mock-data module and a small repository/service adapter layer. Label mock data in the UI/dev mode.
- Do not invent backend endpoints, database models, permission semantics, or persistence behavior.
- Avoid putting secrets or tokens in browser storage.
- Do not connect directly to PostgreSQL, Redis, BullMQ, MikroORM, or WhatsApp from the browser.
- Keep API access behind one client boundary that will later consume the shared central contract package.
- Use environment variables only for public configuration prefixed with `NEXT_PUBLIC_`; never put secrets into client components.
- Use Next.js image/font facilities and sensible performance defaults.
- Keep the project easy to merge into the monorepo; do not rewrite the repository root or create competing package managers.
- If a repository scaffold already exists, inspect and extend it rather than replacing it.

### Required prototype behavior

- Search and filter controls visibly update the displayed mock results.
- Navigation links work across all routes.
- Story contents, source notes, and provenance labels are navigable.
- Editor can add/remove/reorder blocks in local component state.
- Publish/review buttons show prototype-only feedback and never claim durable persistence.
- Responsive navigation, dialogs, tabs, and filters work with keyboard input.
- Every screen contains plausible empty/loading/error variants.

---

## 9. Acceptance criteria for the frontend handoff

- [ ] All routes listed in Section 5 exist and are reachable through navigation or contextual links.
- [ ] Home, Explore, Archive, Story Reader, Research Dossier, Universe, Contributor Studio, and Story Editor have deliberately different layouts.
- [ ] The product does not resemble a generic admin/SaaS dashboard.
- [ ] The seven provenance classifications are represented consistently.
- [ ] All ten named identities appear in the Universe index with the classifications in Section 2.
- [ ] No invented lore, relationships, testimonials, usage metrics, or factual claims are present.
- [ ] Mock-only behavior is visibly identified and does not claim server persistence.
- [ ] Desktop, tablet, and mobile layouts are usable.
- [ ] Keyboard navigation, focus states, reduced motion, alt text, and AA contrast are addressed.
- [ ] Every route has loading, empty, error, and not-found treatment where applicable.
- [ ] The frontend can be merged under `apps/web` without taking ownership of backend business logic.
- [ ] The app builds successfully with the repository's single package manager and workspace conventions.
- [ ] The v0 handoff includes a list of created routes/components and any assumptions that require backend confirmation.

---

## 10. Definition of done for future visual changes

A visual change is complete only when:
1. It serves a defined user task or editorial purpose.
2. It follows the shared token and typography system.
3. It has responsive and accessible behavior.
4. It preserves content provenance and readability.
5. It introduces no fake data or unsupported backend assumptions.
6. It includes evidence: screenshots or a preview URL plus build/test result.

**Design decision:** MoonWitness should feel like a living editorial archive that happens to contain a universe—not a universe-themed dashboard.
