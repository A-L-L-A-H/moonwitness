# ROCKSOUL DX — Visual Constitution

**Status:** DECIDED visual direction; implementation details remain constrained by the execution work package  
**Version:** 1.0.0  
**Owner:** Product owner  
**Specification authority:** `A-L-L-A-H/master-docs`  
**Last reviewed:** 2026-11-15

## 1. Purpose and authority

This document is the normative visual and interaction direction for ROCKSOUL DX. It translates the owner's direction into implementable design rules.

The owner-approved direction is the combination of **GAME WORLD + LIVING ANIMATION**:

- GAME WORLD provides explorable spatial environments, landmarks, discovery, environmental storytelling, and a sense of place.
- LIVING ANIMATION makes those environments feel responsive and alive through restrained motion, light, atmosphere, transitions, and feedback.
- Together they form a desktop creative universe. ROCKSOUL is software for real work, not a game that requires gameplay and not a SaaS dashboard with a game skin.

This is a visual constitution, not a mandate to build an expensive real-time 3D game engine. Use the simplest rendering approach that achieves the experience in the existing repository and remains accessible, performant, maintainable, and usable.

## 2. Product identity

**Product:** ROCKSOUL DX  
**Experience concept:** THE LIVING UNIVERSE  
**Visual core:** NOISE × SILENCE  
**Primary entry:** THE THRESHOLD

The product must feel like entering a distinct place with its own atmosphere, geography, visual grammar, and recognizable destinations. The interface must remain a serious, reliable desktop work environment.

The world is the navigation metaphor and visual environment; it must not obscure the work, fabricate capabilities, or make basic actions difficult to discover.

## 3. Owner manifesto — exact canonical copy

The following four lines are canonical owner-supplied product manifesto copy. Preserve wording, numbering, punctuation, capitalization, and line order exactly. Do not paraphrase, "correct", shorten, or replace it.

> 01 — NO CLUE WHAT'S COMING.  
> 02 — NO IDEA HOW THIS ENDS.  
> 03 — COULD BE RIGHT. COULD BE WRONG.  
> 04 — **BUT I KNOW WHO SAID: "I'LL FINISH IT."**

Line 04 is the visual climax and may receive stronger typographic emphasis. Do not add attribution or imply that the product speaks on behalf of Allah or any other authority.

## 4. Art direction: NOISE × SILENCE

### NOISE

Use expressive energy selectively:
- underground punk / riot and Gen Z grunge editorial influence;
- brutalist spatial composition and oversized typography;
- photocopy grain, torn-paper edges, ink scratches, rough pencil gestures, manga-line accents, imperfect marks;
- asymmetry, collage, controlled visual disruption;
- industrial warning red/orange used as a signal accent, not as a full-screen default;
- experimental objects and environmental details with a clear purpose.

### SILENCE

Protect focus and comprehension:
- generous negative space;
- calm reading surfaces;
- stable typographic hierarchy;
- restrained color and motion in work areas;
- predictable controls and consistent interaction states;
- clear separation between environment decoration and actionable information.

NOISE establishes identity. SILENCE makes the product usable. Never apply every visual ingredient to every screen.

## 5. World geography and destinations

The primary entry environment is **THE THRESHOLD**. It is a spatial hub, not a dashboard.

The universe has four canonical destination names:

1. **THE ARCHIVE** — memory, sources, notes, knowledge, and retrievable artifacts.
2. **THE STUDIO** — writing, ideation, creative production, visual experimentation, and authored work.
3. **THE RIOT DECK** — missions, development work, agent-assisted execution, inspection, validation, and release decisions.
4. **THE SIGNAL ROOM** — research, discovery, connected ideas, and signal-oriented exploration.

These are distinct product-experience spaces, not four dashboard cards. Their names are canonical visual navigation labels. A destination may initially be a preview/placeholder if its workflow is not in the current release scope. Never fake a working feature to make a room appear complete.

### THE THRESHOLD

The first screen after launch:
- a monumental, surreal, atmospheric environment with strong spatial depth;
- a visible central landmark or gateway;
- four destinations represented as recognizable places, portals, structures, beacons, or landmarks;
- the ROCKSOUL identity and manifesto integrated as editorial artifacts;
- a compact command/quick-action entry point, labelled **WHAT ARE WE MAKING TODAY?**;
- a discreet current-context / recent-thread cue, only when backed by real data;
- minimal utility and account/status controls.

Do not use a conventional left sidebar, topbar plus grid of cards, KPI strip, analytics dashboard, or generic admin layout as the primary composition.

### Destination visual identities

- **THE ARCHIVE:** archival architecture, shelves/containers, catalogued fragments, paper artifacts, quiet light, strong legibility.
- **THE STUDIO:** expressive work surfaces, sketches, layered canvases, collage, tools, and warm creative energy.
- **THE RIOT DECK:** industrial command environment, precise execution surfaces, high-contrast status, restrained warning red/orange, mission/repository/agent/test/review concepts where actually implemented.
- **THE SIGNAL ROOM:** observatory/radio/signal language, waveforms and connected nodes only where meaningful, calm analytical surfaces, clear source trails.

Keep a common world grammar, typography system, spacing logic, motion vocabulary, and interaction behavior while allowing each destination a distinct atmosphere.

## 6. Spatial interaction model

- Navigation should communicate place, destination, current location, and a clear route back to THE THRESHOLD.
- Use spatial transitions, camera-like movement, depth, parallax, portals, or scene changes only when they help orientation.
- Provide a persistent, discoverable way to return home; do not make navigation depend on guessing hotspots.
- Every destination marker must have a visible label and an accessible keyboard/focus equivalent.
- Hover, focus, selected, active, loading, disabled, and unavailable states must be distinguishable.
- Provide a conventional compact navigation fallback for keyboard users, reduced-motion mode, and users who prefer direct navigation.
- Avoid trapping the user inside a scene or hiding critical controls in decorative objects.

## 7. Living animation and motion grammar

Motion is a functional layer, not decoration running continuously for its own sake.

Use motion for:
- entering and leaving a world/room;
- revealing spatial depth and destination relationships;
- signaling focus, selection, progress, completion, warning, or error;
- making environmental elements feel gently alive;
- acknowledging a user action.

Preferred motion qualities:
- slow ambient drift, occasional particles, restrained fog/light changes;
- purposeful camera easing and parallax;
- short, clear interaction feedback;
- subtle transition continuity between related spaces;
- stable content during reading and editing.

Rules:
- no constant high-frequency motion behind text;
- no flashing, strobing, rapid zooms, or motion that simulates urgency without meaning;
- no animation that delays a critical action or hides state;
- honor OS/browser reduced-motion preferences and provide an in-app low-motion option;
- reduced-motion mode replaces spatial travel with short fades or direct cuts and disables ambient movement;
- sound is opt-in, independently muteable, never required to understand state, and off by default;
- ambient effects must not compromise performance, battery, thermals, or input responsiveness.

## 8. Typography, color, texture, and iconography

### Typography

Use a deliberate editorial type system:
- expressive condensed/display typography for world identity, room titles, and manifesto;
- highly legible text faces for body copy, labels, metadata, and long-form reading;
- monospace only for code, identifiers, timestamps, and technical status where appropriate;
- preserve readable sizes and line lengths; never use distressed display fonts for functional instructions.

### Color

Base palette direction:
- deep charcoal / near-black environment;
- warm bone-white text and paper;
- concrete and oxidized-steel neutrals;
- restrained industrial red/orange for selected signals and warnings;
- occasional warm luminous white for portals, focus, and depth.

Exact color tokens must be derived from the existing implementation and contrast-tested before being locked. Do not invent a large palette or use generic purple/blue gradients as a shortcut.

### Texture and imagery

Use grain, paper, photocopy, pencil, ink, and collage as controlled layers. Keep textures away from small text and essential controls. Prefer original assets or properly licensed assets; do not imitate a named artist, game IP, copyrighted character, or proprietary interface.

### Iconography

Icons must be semantically clear, consistent, and paired with labels when ambiguity is possible. Do not substitute decorative glyphs for accessible controls.

## 9. Layout and responsive desktop behavior

- Design for desktop-first use and the actual window sizes supported by the existing app.
- The world scene may occupy the main canvas; functional controls must remain anchored and discoverable.
- Avoid fixed compositions that clip content at common laptop aspect ratios or when the window is resized.
- Provide a compact layout fallback for smaller windows.
- Do not assume multi-window support, unrestricted filesystem access, or native OS integrations without an approved technical contract.
- Work surfaces should be calmer and denser than the Threshold; preserve a clear hierarchy between environment, navigation, and task content.

## 10. Trust, privacy, and honest state

- Private by default.
- Never show invented recent work, fake counts, fabricated agent activity, or simulated success as real state.
- Label demo/sample content as sample content.
- Distinguish unavailable, preview, planned, running, failed, and completed states.
- AI suggestions are not accepted actions until the owner approves them.
- Destructive, external, publication, repository-write, and agent-execution actions require explicit review/confirmation appropriate to their risk.
- No automatic publication, cloud upload, or cross-product sync is introduced by visual implementation.

## 11. Accessibility and usability

- Full keyboard navigation and visible focus states.
- Semantic labels and accessible names for interactive controls.
- Contrast must be tested; texture and motion must not reduce text legibility.
- Never communicate status through color alone.
- Reduced motion is a first-class supported mode.
- Sound is never required.
- Provide direct navigation alternatives to spatial interactions.
- Preserve text selection, standard editing behavior, and predictable shortcuts in work surfaces.

## 12. Anti-patterns — reject

- Generic SaaS dashboard, admin template, KPI cards, analytics-first home.
- Sidebar/topbar/card-grid as the main Threshold layout.
- Game HUD overload, tiny unreadable labels, arbitrary coordinates, fake telemetry.
- Generic cyberpunk neon, purple-blue gradients, indiscriminate glassmorphism.
- Constant particles, camera shake, glitch, scanlines, or motion without semantic purpose.
- 3D/WebGL complexity added only to appear futuristic.
- A static wallpaper with a few floating buttons pretending to be a living world.
- Navigation hotspots with no labels or keyboard equivalents.
- Fake room functionality or fake agent activity.
- Unreadable distressed typography on functional content.

## 13. Design and implementation acceptance criteria

A visual implementation passes only when:
- [ ] It reads immediately as ROCKSOUL, not a generic SaaS product.
- [ ] GAME WORLD and LIVING ANIMATION are visibly combined into one coherent experience.
- [ ] THE THRESHOLD is the clear entry point and primary spatial hub.
- [ ] The four canonical destinations are recognizable and individually labelled.
- [ ] The four-line manifesto is exact and line 04 is emphasized.
- [ ] Spatial navigation is discoverable and has keyboard/direct-navigation alternatives.
- [ ] Motion communicates place or state and respects reduced-motion settings.
- [ ] Functional work surfaces remain legible, calm, and efficient.
- [ ] No fabricated product data, functionality, or completion states are presented as real.
- [ ] The desktop experience works at the supported window sizes and can be resized without broken composition.
- [ ] No unapproved framework, backend, storage, sync, cloud, or OS permission decision is introduced.
- [ ] A screenshot set and a concise interaction walkthrough demonstrate the result.

## 14. Relationship to other specifications

- Product scope and first-release boundary: [Product Scope Decision](PRODUCT-SCOPE-DECISION.md).
- Product identity and owner language: [Master Narrative](MASTER-NARRATIVE.md).
- Desktop and privacy invariants: [Desktop Product Contract](DESKTOP-PRODUCT-CONTRACT.md).
- Bounded first implementation: [Visual Foundation Work Package](VISUAL-FOUNDATION-WORK-PACKAGE.md).
- Technical framework direction: ADR-0007 in [Architecture Decisions](../GOVERNANCE/ARCHITECTURE-DECISIONS.md).

If a visual proposal conflicts with privacy, accessibility, desktop trust, or explicit owner wording, the latter takes precedence.
