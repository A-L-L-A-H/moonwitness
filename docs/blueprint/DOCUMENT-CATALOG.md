# Blueprint Document Catalog

The organization repository `ArsyBelovedLabs/moonwitness-blueprint` is the authoritative home for active MoonWitness architecture decisions.

## Status

**DESIGN FROZEN / FOUNDATION EXECUTION AUTHORIZED / CERTIFICATION PENDING**

Do not treat any worker prompt, execution issue, legacy repository, or generated plan as an architectural source of truth. The design-freeze declaration is authoritative for post-freeze change control. The only Genesis execution authorization source is `17-genesis/GENESIS-READINESS-CHECKLIST.md`; the root-level `GENESIS-READINESS-CHECKLIST.md` is a deprecated compatibility pointer.

## Sections

- `00-constitution/` — architecture truth, identifiers, readiness, quality gates, freeze
- `01-architecture/` — system structure, Golden Path, boundaries, ADRs
- `02-domain/` — capabilities, bounded contexts, domain model, state machines, events, runtime/work model
- `03-contracts/` — canonical schemas, compatibility, errors, idempotency
- `04-data/` — persistence, lineage, artifacts, classification, ownership
- `05-engineering/` — toolchain, package engineering, environment, supply chain
- `06-api/` — canonical HTTP/OpenAPI surface, lifecycle, API validation, correlation context
- `07-ui-ux/` — frontend platform, experience constitution, design tokens, component ownership, component-first workflow, application IA, canonical user flows/interactions, Figma/showcase matrix, navigation and UX states
- `08-ai/` — intelligence, retrieval, tools, model/provider lifecycle, evaluation and cost/provenance
- `09-security/` — identity, authorization, isolation, supply chain, threat model
- `10-observability/` — telemetry, logs, metrics, traces, audit, semantic conventions
- `11-performance/` — performance, workload, concurrency and cost budgets
- `12-reliability/` — retries, timeout, cancellation, backup, restore, rollback, DR
- `13-deployment/` — environments, serverless, containers, runtime compatibility and promotion
- `14-governance/` — GitHub workflow, release controls, architecture change governance
- `15-migration/` — legacy-to-Gen2 evidence, golden fixtures, lifecycle and decommissioning
- `16-repositories/` — repository/package topology and dependency direction
- `17-genesis/` — canonical readiness gate, active Wave 0 foundation execution plan, handoff contract, and certification evidence tracking

## Key API / contract artifacts

- `00-constitution/ADR-026-API-OPERATION-RECONCILIATION.md` — approved post-freeze reconciliation for readiness, ResearchRun cancellation, and complete catalog/OpenAPI parity.
- `06-api/API-OPERATION-CATALOG-V1.yaml` — design-locked canonical operation inventory and capability mapping.
- `06-api/openapi/openapi.yaml` — canonical machine-readable HTTPS contract projected from the operation inventory.
- `06-api/OPENAPI-CONTRACT-COVERAGE-MATRIX-V1.yaml` — operation/schema/authorization/idempotency coverage with executable parity policy.
- `03-contracts/schemas/` — canonical reusable JSON wire schemas referenced by OpenAPI where an existing shared contract owns the shape.

## Key UI / UX artifacts

- `07-ui-ux/EXPERIENCE-CONSTITUTION-V1.md` — canonical scene, operating-mode, epistemic, depth, response, motion, sonic, live/frozen/candidate, performance and accessibility grammar for the MoonWitness Experience Engine.
- `07-ui-ux/UI-PLATFORM-CONTRACT-V1.yaml` — canonical reusable UI-platform boundary.
- `07-ui-ux/UI-COMPONENT-OWNERSHIP-V1.yaml` — component/page ownership rules and required states.
- `07-ui-ux/WEB-PRODUCT-CONTRACT-V1.yaml` — primary public Web data/integration contract.
- `07-ui-ux/APPLICATION-INFORMATION-ARCHITECTURE-V1.md` — implementation-aligned mapping from capabilities to application navigation, maturity, and Figma/showcase status.
- `07-ui-ux/FIGMA-COMPONENT-FIRST-WORKFLOW-V1.md` — mandatory design execution order from visual constitution and variables through raw primitives, components, variants, domain instruments and templates.
- `07-ui-ux/USER-FLOW-AND-INTERACTION-MODEL-V1.md` — canonical task-first/object-first UX flow model covering entry, drill-down, return path, state preservation, evidence traversal, responsive behavior, accessibility and the `BLOCKED_BY_UX_FLOW` readiness gate.
- `07-ui-ux/FIGMA-SHOWCASE-SCREEN-MATRIX-V1.md` — page-level Figma/showcase execution control, curated-image coverage, maturity classification, readiness gates, and one-screen-per-image generation queue.

## Non-canonical AI research drafts

- `08-ai/ROCKSOUL-LAZARUS-PROPHETIC-ETHICS-RESEARCH-V1.md` — research proposal for source-linked prophetic ethics, bounded machine agency, non-impersonation, provenance, and measurable conformance. It is not implementation authority.
- `08-ai/PROPHETIC-ETHICS-PROFILE-DRAFT-V1.yaml` — machine-readable companion proposal, source boundaries, profile mappings, runtime roles, and adversarial gates. It is not a canonical contract.
- `08-ai/ROCKSOUL-LAZARUS-PROGRAM-PLAN-DRAFT-V1.md` — planning draft that records the inspected ROCKSOUL baseline, confirmed blockers, trust architecture, gated execution waves, effort envelope, maturity claims, and definition of done. It does not classify repositories or authorize execution.
- `08-ai/ROCKSOUL-LAZARUS-ISSUE-BACKLOG-DRAFT-V1.yaml` — proposed issue inventory with repository targets, dependencies, acceptance criteria, and evidence requirements. Publishing is disabled until human review and the architecture-ownership decision.

These drafts require explicit review and, where their adoption changes a frozen
boundary or contract, a new ADR before implementation.

## Genesis execution artifacts

- `17-genesis/GENESIS-READINESS-CHECKLIST.md` — canonical authorization and certification gate.
- `17-genesis/GENESIS-WAVE-PLAN-V1.md` — active ordered implementation plan under the frozen architecture.
- `17-genesis/GENESIS-00-EXECUTION-SPECIFICATION-V1.md` — Wave 0 foundation execution contract.
- `17-genesis/WAVE-0-MULTI-REPO-EXECUTION-PACKETS-V1.md` — repository-specific Wave 0 worker packets.
- `17-genesis/IMPLEMENTATION-HANDOFF-CONTRACT-V1.md` — required worker handoff/evidence schema.

## Active artifacts

The active artifact for a decision is identified by the decision registry and completion matrix. Versioned historical artifacts must be explicitly marked `superseded` and must not be treated as active guidance.

## Reference repositories audited 2026-08-30

- `bjo163/moonwitness@dev`
- `bjo163/moonwitness-corpus@dev`
- `bjo163/cosmic@dev`
- `bjo163/ALLAH-CRAYON-RGBL-ENGINE@dev`
- `bjo163/propetic@main`

These repositories are implementation evidence only. They do not override this blueprint.

## Canonicality rule

Exactly one active decision source exists for each architectural decision. Any conflict must be resolved through the decision registry and a new ADR when the conflict changes architecture; workers must never choose between conflicting documents on their own. Status/evidence conflicts that do not alter the frozen architecture must be resolved by pointing all execution records to the canonical gate.

## Freeze rule

The architecture is design-frozen. Post-freeze implementation/evidence work may add tests, fixtures, generated artifacts, benchmarks, operational configuration, and execution-status records without reopening architectural choices. Changes to ownership, contracts, repository topology, protocol strategy, database boundaries, deployment architecture, or UI platform boundaries require a new ADR and a freeze update.
