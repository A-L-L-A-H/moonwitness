# Architecture v2.3

## Purpose

Prophet Research Engine v2.3 is an auditable research graph for the conventional 25-name prophetic dataset. It separates textual claims, lexical roots, identity modeling, Divine-name/attribute relations, historical context, research scoring, persistence, API, and UI so that no single layer can silently overwrite another.

## Research pipeline

`REVEALED SOURCE → TEXTUAL WITNESS → PASSAGE → CLAIM → TOKEN/ROOT → IDENTITY/RID → ASMA EDGE → MISSION/EVENT → CONTEXT → CONFLICT/UNCERTAINTY → SCORE`

The arrow denotes data dependency, not theological equivalence.

## Application pipeline

`VERSIONED RESEARCH DATA → TypeScript engine → generated reports/registries → SQLite derived read-model → Node local API → React/Vite UI`

SQLite is not the research authority; it is a reproducible local serving/query layer.

## Major modules

### Source layer
Four allowed source IDs: `quran`, `taurat`, `zabur`, `injil`. Qur'an has priority 1 / `CORE_MUHAIMIN`; the others are explicitly labeled supplements.

### Provenance layer
Claims carry prophet/category/source/reference/evidence/confidence and, where relevant, root/lexeme support, cross-source relation, uncertainty reason, and alternatives.

### Identity layer
The 0–9 Identity Stack is a system model, not a Qur'anic numbered taxonomy. `NAME ROOT`, `RID`, and identity layers remain distinct.

### ASMA graph
Divine-name/attribute families and prophet relations are separate graph entities. Relation modes distinguish shared lexeme/root, semantic trait reflection, mission alignment, bestowed capability, and divine interaction. `RELATION_NOT_IDENTITY` is invariant.

### Mission/event layer
Eight slots: `CALL → TEST → GIFT → MISSION → CONFLICT → RESPONSE → JUDGMENT → LEGACY`, materialized as event nodes.

### Context layer
`RELIGION_CONTEXT`, `PEOPLE_REGION_CONTEXT`, and `LANGUAGE_CONTEXT` remain independent. Modern geography is a crosswalk, never nationality.

### Conflict/uncertainty
Conflicts attach to specific claims. Unknown/disputed information remains explicit rather than inferred into certainty.

### Scoring
Trait evidence, data confidence, context evidence, world-trait salience, Human Preference, and any future composite remain separate. Automatic matching is diagnostic/candidate generation, not independent evidence.

### Persistence
Active runtime persistence is SQLite. `apps/api/schema.sql` is canonical for the local read-model and is enforced by the runtime. A SHA-256 seed fingerprint prevents stale data.

### API
The Node local API exposes global registries plus prophet-scoped provenance/event/relation/timeline endpoints. Only GET/OPTIONS are part of the v2 local research surface.

### UI
The active UI is React + Vite + TypeScript using shadcn-style component source and Tailwind. In development Vite proxies API requests; in packaged/local production the Node server serves the built SPA same-origin.

## Architectural invariants

- supplement evidence cannot be relabeled Qur'anic;
- automatic matcher cannot emit authoritative Q5 evidence;
- unrelated conflicts cannot penalize an ASMA edge;
- score cannot imply prophetic superiority or calibrated probability;
- historical uncertainty cannot be silently replaced by modern assumptions;
- derived scores must be reproducible from versioned inputs;
- runtime database changes cannot silently redefine research semantics.
