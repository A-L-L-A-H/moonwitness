# 08 — AI

AI is an adapter-driven capability, not the system of record.

```text
retrieval
  ↓
context assembly
  ↓
model/provider abstraction
  ↓
tools/capabilities
  ↓
evaluation
  ↓
provenance / witness
```

Provider SDKs must remain behind adapters. Model execution metadata must support reproducibility, cost accounting, evaluation, and audit.

## Research drafts

The following artifacts are exploratory and **non-canonical**. They do not
authorize implementation or change the frozen architecture:

- `ROCKSOUL-LAZARUS-PROPHETIC-ETHICS-RESEARCH-V1.md` — research paper for
  source-linked prophetic ethics, non-impersonation, bounded agency, provenance,
  evaluation, and human accountability.
- `PROPHETIC-ETHICS-PROFILE-DRAFT-V1.yaml` — machine-readable proposal and
  adversarial conformance targets accompanying the paper.
- `ROCKSOUL-LAZARUS-PROGRAM-PLAN-DRAFT-V1.md` — evidence-based incubation plan,
  confirmed blockers, gated delivery sequence, maturity definitions, and
  production-pilot definition of done.
- `ROCKSOUL-LAZARUS-ISSUE-BACKLOG-DRAFT-V1.yaml` — proposed machine-readable
  issue backlog with priorities, dependencies, target repositories, acceptance
  criteria, and required evidence. Issue publication remains disabled pending
  human review and an architecture-ownership decision.

Implementation of these proposals requires an ADR when it changes contracts,
ownership, protocols, persistence, API exposure, or user-facing religious
behavior.
