# ROCKSOUL DX — Product Experience Contract

**Status:** DECIDED visual direction and v0.1 experience boundary; detailed technical implementation remains open  
**Version:** 1.0.0  
**Owner:** Product owner  
**Last reviewed:** 2026-11-15

## 1. Purpose

This contract defines the product experience for ROCKSOUL DX as a layered desktop universe. The owner has approved the combination of **GAME WORLD + LIVING ANIMATION**. This is a world to explore that feels alive while supporting real creative, research, and execution work.

The normative art direction and interaction rules live in the [Visual Constitution](VISUAL-CONSTITUTION.md). The bounded first implementation is defined by the [v0.1 Visual Foundation Work Package](VISUAL-FOUNDATION-WORK-PACKAGE.md).

## 2. Product form and identity

- Dedicated desktop application, not a browser-first web product.
- Tauri is the selected desktop framework direction (ADR-0007).
- Experience concept: **THE LIVING UNIVERSE**.
- Visual core: **NOISE × SILENCE**.
- Primary entry: **THE THRESHOLD**.
- Canonical destinations: THE ARCHIVE, THE STUDIO, THE RIOT DECK, THE SIGNAL ROOM.

The world is the primary navigation metaphor, not a claim that the app is a game. It must never make essential work difficult or hide the actual state of the application.

## 3. Experience architecture

### The World

The World layer establishes place, identity, atmosphere, spatial orientation, and discovery. It may use cinematic depth, environmental storytelling, spatial landmarks, original textures, and restrained living motion.

### The Work

The Work layer contains real actions and content: writing, research, artifacts, missions, reviews, and other approved workflows. It must be calm, legible, keyboard-accessible, and honest about its state.

Transitions between World and Work must preserve context. The user must always know where they are and how to return.

## 4. Navigation and room semantics

- THE THRESHOLD is the entry hub and stable return point.
- Four destinations are visually distinct and consistently named.
- Each destination has a visible label and an accessible focus/keyboard equivalent.
- Every room provides a clear return path.
- Direct navigation must remain available; users must not be forced to explore a scene to find a basic action.
- A destination shown as preview, planned, unavailable, or incomplete must be labelled honestly.
- Do not use dashboard cards as the primary representation of the universe.

## 5. Noise × Silence

- **NOISE:** raw, expressive, grunge, punk/riot, brutalist editorial, collage, pencil/ink, manga-line accents, experimental future-tech.
- **SILENCE:** calm reading, clear hierarchy, stable work surfaces, negative space, accessible controls, predictable feedback.

NOISE communicates identity and energy. SILENCE protects focus and comprehension. They are complementary modes, not competing themes.

## 6. Motion and sound

- Motion must communicate transition, focus, state, progress, or environmental life.
- Ambient motion is restrained and must not run at high intensity behind reading/editing content.
- Respect OS reduced-motion preferences and provide a low-motion option.
- Reduced-motion mode replaces spatial travel with brief fades/direct cuts and disables ambient movement.
- Sound is opt-in, independently muteable, off by default, and never required to understand state.
- Animation must not delay approvals, hide destructive actions, or misrepresent operation status.
- Effects must not impair performance, battery, thermals, or input responsiveness.

## 7. Desktop usability and accessibility

- Keyboard-first operation for frequent actions, with discoverable alternatives.
- Visible focus and semantic labels for interactive elements.
- Direct navigation alternative to spatial interactions.
- Readable typography, sufficient contrast, and no status communication by color alone.
- Preserve standard text editing, selection, and predictable shortcuts in work surfaces.
- Support resizing and smaller desktop windows without clipping essential controls.
- Provide clear empty, loading, preview, unavailable, error, offline, permission-denied, unsaved, and recovery states as applicable.
- Avoid assuming multi-window behavior or unrestricted filesystem access.

## 8. Privacy and honest state

- Private by default.
- No hidden upload, automatic publication, or cross-product sync.
- AI access to private material must be visible and scoped.
- External, destructive, repository-write, and agent-execution actions require risk-appropriate review and approval.
- Never fabricate recent activity, statistics, agent statuses, or completed operations.
- Clearly distinguish real, sample, preview, planned, running, failed, and completed states.

## 9. v0.1 acceptance

The v0.1 visual foundation is acceptable only when the acceptance criteria in the [Visual Constitution](VISUAL-CONSTITUTION.md) and [Visual Foundation Work Package](VISUAL-FOUNDATION-WORK-PACKAGE.md) are met. This contract does not certify that the product code already implements them.

## 10. Open technical decisions

Frontend framework, rendering strategy, Rust command/API boundaries, persistence, filesystem permissions, OS targets, packaging/signing, updater, AI runtime, and backup/security design remain open. Inspect the existing project and require separate ADRs for decisions outside the visual-only work package.
