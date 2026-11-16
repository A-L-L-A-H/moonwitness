# Blueprint Readiness Definitions v1

The blueprint distinguishes design maturity from executable evidence.

## States

### DESIGN_COMPLETE
Canonical architecture, ownership, contracts, invariants, and acceptance criteria are documented and internally consistent.

### EVIDENCE_PENDING
The design is complete, but an executable test, benchmark, deployment proof, or migration fixture has not yet been captured.

### IMPLEMENTATION_CERTIFIED
The relevant Gen2 implementation exists and its required evidence passes CI/certification.

### GENESIS_READY
All required design artifacts are DESIGN_COMPLETE, all required cross-cutting evidence gates are either passed or explicitly waived by an ADR, and repository governance prerequisites are configured.

## Rule

`DESIGN_COMPLETE` never implies `IMPLEMENTATION_CERTIFIED`.

`EVIDENCE_PENDING` is not an architecture defect; it is an execution-evidence gap.

No worker may reinterpret an EVIDENCE_PENDING item as permission to invent architecture. The worker must implement the specified verification path or report BLOCKED when prerequisites are missing.
