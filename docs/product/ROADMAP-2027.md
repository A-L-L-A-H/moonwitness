# MoonWitness Product & Engineering Roadmap 2027

> **Direction:** Integrated Intelligence Ecosystem  
> **Priority:** Feature-led, gated by reliability, security and trust  
> **Scope:** MoonWitness Web, RIOT Intelligence, SIDRA Knowledge, Memory Vault, ROCKSOUL DX, Operations Intelligence and platform/addon infrastructure  
> **Planning branch:** `dev`  
> **Status:** Proposed roadmap. Quarterly targets are planning windows, not delivery commitments.

## 1. Vision

MoonWitness becomes one coherent ecosystem in which knowledge informs AI, AI helps users complete real work, completed work becomes traceable knowledge, and operational signals become actionable insight.

Integrate through shared identity, capability permissions, contracts, audit and provenance. Do not collapse product trust boundaries or duplicate domain ownership.

## 2. Product architecture

| Product surface | Responsibility | 2027 outcome |
|---|---|---|
| MoonWitness Web | Unified experience, navigation, dashboards, approvals | One entry point into the ecosystem |
| RIOT Intelligence | Model routing, research, tool use, agent orchestration/evaluation | Evidence-backed Research Workspace |
| SIDRA Knowledge | Entities, relations, timelines, graph provenance | Inspectable Knowledge Explorer |
| Memory Vault | Personal/project memory, source lineage, retention | Memory Timeline and Decision Memory |
| ROCKSOUL DX | Local repository context and agent execution | Safe Agent Mission Control |
| Operations Intelligence | Inventory, telemetry, event correlation, incident workflows | Evidence-led Incident Intelligence |
| Shared trust foundation | Identity, capability, contracts, audit, provenance, job lifecycle | Secure cross-domain integration |

### Architecture principles

1. **One identity, scoped capabilities.** Authentication can be shared; authorization remains resource-, workspace- and action-scoped.
2. **One provenance vocabulary.** Source facts, derived claims, model interpretation, hypotheses and unknowns remain distinguishable and traceable.
3. **Local-first where appropriate.** Memory Vault and ROCKSOUL local data remain local by default; cloud transfer is opt-in and visible.
4. **Human approval for consequential actions.** External side effects, permission expansion and production changes require explicit approval.
5. **Shared contracts, separate ownership.** Web is the experience layer; domain services own their models, storage and lifecycle.
6. **No silent success.** Skipped integration gates and mock-only checks are not passing evidence.

## 3. 2027 quarterly roadmap

### Q1 — Experience and integration foundations
- Complete existing release gates #529, #530, #531 and #532.
- Continue ORM correctness work under #535.
- Define cross-domain interaction envelope: stable resource IDs, actor/workspace scope, provenance, capability, audit correlation and job reference.
- Establish integrated Web navigation and entry points without moving domain ownership into Web.
- Baseline product metrics and key user journeys.

**Exit criteria:** authorization and PostgreSQL release gates are trustworthy; cross-domain contracts have tests and owners; one canonical navigation entry point exists.

### Q2 — Knowledge and research experiences
- RIOT Research Workspace v1 (#537).
- Memory Timeline & Decision Memory (#538).
- SIDRA Knowledge Explorer v1 (#539), reusing canonical provenance and source APIs.

**Exit criteria:** users can create a sourced research run, inspect/correct/expire memory, and explore an entity or relation back to its source without crossing workspace permissions.

### Q3 — Execution and operational intelligence
- ROCKSOUL Agent Mission Control (#540).
- Operations Incident Intelligence (#541).
- Add resumable job UX only after transaction, worker and checkpoint guarantees are verified.

**Exit criteria:** local agent work is isolated and approval-gated; incident correlations are explainable and read-only; failure, cancellation and recovery are observable.

### Q4 — Extensibility and ecosystem maturity
- Addon Lifecycle & Capability Console (#542), gated by ADR-010 implementation review.
- Cross-domain workflows connecting research → knowledge → memory → execution.
- Accessibility, localization/RTL, performance, disaster recovery, security and adoption hardening.

**Exit criteria:** signed add-on lifecycle and capability approvals are inspectable; cross-domain workflows preserve provenance and consent; reliability evidence is published.

## 4. Epics and GitHub execution tracker

The roadmap umbrella is [#536 — Integrated Intelligence Ecosystem](https://github.com/A-L-L-A-H/moonwitness/issues/536).

| Epic | GitHub issue | Target | Key dependency |
|---|---|---|---|
| RIOT Research Workspace v1 | [#537](https://github.com/A-L-L-A-H/moonwitness/issues/537) | Q2 | #536, #529–#532 gates, existing RIOT tool/model contracts |
| Memory Timeline & Decision Memory | [#538](https://github.com/A-L-L-A-H/moonwitness/issues/538) | Q2 | #536, #529, #531, existing Memory Vault archive/provenance |
| SIDRA Knowledge Explorer v1 | [#539](https://github.com/A-L-L-A-H/moonwitness/issues/539) | Q2–Q3 | #536 and canonical source/provenance APIs; coordinate with #538 |
| ROCKSOUL Agent Mission Control | [#540](https://github.com/A-L-L-A-H/moonwitness/issues/540) | Q3 | #536, ADR-007 local boundary, verified sandbox/runner/job lifecycle |
| Operations Incident Intelligence | [#541](https://github.com/A-L-L-A-H/moonwitness/issues/541) | Q3 | #536 and existing telemetry/inventory/event contracts |
| Addon Lifecycle & Capability Console | [#542](https://github.com/A-L-L-A-H/moonwitness/issues/542) | Q4 | #536, ADR-010 signed-addon lifecycle and canonical registry |

### Existing backlog — reuse, do not duplicate

- [#529 — Web enterprise foundation](https://github.com/A-L-L-A-H/moonwitness/issues/529): route/auth/provider/feature-boundary consolidation.
- [#530 — Mandatory PostgreSQL API-to-ORM conformance](https://github.com/A-L-L-A-H/moonwitness/issues/530).
- [#531 — Group-aware field read/write policies](https://github.com/A-L-L-A-H/moonwitness/issues/531).
- [#532 — Remove success-shaped PostgreSQL PRAGMA shims](https://github.com/A-L-L-A-H/moonwitness/issues/532).
- [#535 — ORM Core Reliability & Integrity Epic](https://github.com/A-L-L-A-H/moonwitness/issues/535).

These are dependencies or adjacent platform workstreams, not new roadmap epics.

## 5. Dependency graph

```text
#529 Web foundation ─┐
#530 PG conformance ├──> #536 Integrated contracts ─┬──> #537 RIOT Research
#531 field policies ┤                               ├──> #538 Memory Timeline
#532 PG integrity ──┘                               ├──> #539 SIDRA Explorer
#535 ORM reliability (parallel persistence work)   ├──> #540 ROCKSOUL Mission Control
                                                    ├──> #541 Operations Intelligence
                                                    └──> #542 Addon Console
```

Additional sequencing:
- #539 consumes canonical source/provenance contracts established with #538 where they overlap; it must not fork the Memory Vault archive.
- #540 must not claim safe resume until job/transaction/checkpoint behavior is verified.
- #541 remains read-only in this phase; remediation is a separate approval/security design.
- #542 starts with a gap matrix against ADR-010, not a replacement runtime.

## 6. Shared acceptance criteria and release gates

Every epic must satisfy these where applicable:

- Server-side authorization; client UI is never the security boundary.
- Workspace/tenant isolation in service and persistence layers.
- Cross-domain calls carry actor, workspace scope, purpose/capability and correlation ID.
- Provenance differentiates source facts, derived claims, model interpretation, hypotheses and unknowns.
- Local data is not uploaded/indexed remotely without explicit configuration and consent.
- Agent execution is sandboxed, least-privilege, auditable and approval-gated for external side effects.
- Long-running jobs have idempotency, bounded retries, cancellation and observable terminal states; checkpoint/resume is claimed only when proven.
- Preserve i18n (English/Indonesian/Arabic), RTL, accessibility, shared UI/SDK/contracts and existing test layers.
- Database guarantees use real database-backed tests. Missing URLs, skipped suites and mocks cannot be reported as passing integration evidence.
- Update documentation and ADRs when trust boundaries or supported contracts change.

## 7. Success measures

Establish baselines in Q1; do not invent targets before measuring current behavior.

| Domain | Measures |
|---|---|
| Research | Claims with inspectable evidence; successful reruns; time to produce a sourced report |
| Knowledge | Entity/relation provenance coverage; duplicate/conflict rate; time to trace a claim |
| Memory | Retrieval usefulness; correction/expiry success; unauthorized disclosure count (target zero) |
| Execution | Task completion; reproducible run records; approval compliance; recovery success |
| Operations | Signal-to-incident deduplication; incident timeline assembly time; operator-confirmed hypothesis usefulness |
| Platform | Authorization regression rate; contract coverage; job recovery; backup restore evidence; accessibility/localization |

## 8. Local AI execution protocol

For every child issue:

1. Start from latest `dev`; inspect current implementation, ADRs, related open/closed issues and in-flight PRs.
2. Map existing behavior to acceptance criteria before coding. If functionality already exists, improve or document it; do not create a parallel subsystem.
3. Execute one atomic issue per task/PR. No opportunistic unrelated refactor.
4. Add regression tests. Use live service/database tests for guarantees that depend on those systems.
5. Never fabricate test results, source citations, telemetry, benchmarks or deployment evidence. Report exact commands, counts, skipped tests and blockers.
6. Do not expose secrets or transfer private/local data to cloud. External side effects, permission expansion and destructive operations require explicit approval.
7. Keep changes on `dev`; do not push/merge to `main` or `master`.
8. Human review is required before merge, deployment, permission expansion or destructive operation.

## 9. Governance

Quarterly targets are planning windows, not delivery promises. Re-plan using verified dependencies, user feedback, reliability evidence and available capacity. Do not close an issue because code was generated; close only when acceptance criteria and evidence are reviewed.
