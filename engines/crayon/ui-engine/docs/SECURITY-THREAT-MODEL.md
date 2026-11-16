# CRAYON Security Threat Model — alpha

This document describes semantic trust boundaries. It is not a production security certification.

## Assets to protect

- truth/epistemic state;
- authority decisions;
- intent and commitment identity;
- transition/consequence binding;
- execution capability identity;
- observation/evidence provenance;
- historical witness integrity;
- renderer semantic invariance;
- release credentials and package integrity.

## Trust boundaries

### Observation ingestion
Attacker may supply forged/stale/low-reliability observations or conflicting sources.

Mitigations: explicit source/reliability/time, freshness evaluation, explainable reconciliation, conflict state, verification derived from evidence rather than caller status.

Residual: cryptographic source authentication and distributed evidence trust remain future work.

### Authority
Attacker may omit authority requirements, present a powerful agent as a human/service, or rely on scope mismatch as implicit allow.

Mitigations: actor kind/identity, independent capabilities, default intend requirement, unknown never allow, deny overrides allow, explicit scoped override, adversarial human-agent tests.

### Commitment
Attacker may forge a plain object shaped like CommitmentRecord or understate consequence risk.

Mitigations: process-local WeakSet authenticity for CommitmentRecord; actor/transition binding; deterministic high-impact/irreversibility/uncertainty policy floors; caller risk is provenance, not sole truth.

Residual: process-local authenticity is not distributed trust or cryptographic signing.

### Execution
Attacker may submit raw Transition, clone validated request, mutate request after validation, replay request, exploit stale state, or exploit ABA state return.

Mitigations: raw transition rejected; process-local validated-request capability; deep freeze; start-time world revalidation; stale invalidation permanent; one-shot request; authentic ExecutionLease required for observation batch.

Residual: crash recovery and cross-process capability transfer are intentionally unsupported in alpha.

### Witness/history
Attacker may rewrite prediction after seeing outcome, mark success directly, replace historical witness with reconciliation, or retry ambiguous external action.

Mitigations: verification derived; immutable Witness; immutable TemporalRecord; reconciliation is a new record; prediction/observation separate; retry blocked while unresolved/conflicted.

### RIR / renderers
Attacker or developer may introduce Web/component vocabulary into RIR, hide uncertainty in one renderer, omit high-impact consequence for brevity, or let an Agent renderer imply authority.

Mitigations: token/import-aware architecture guard; cross-renderer semantic invariance tests; Agent renderer explicitly states it grants no authority; semantic detail projection preserves critical uncertainty/consequence/witness.

### Package/release
Attacker may inject mismatched package versions, publish partial release, expose npm token, or publish a name owned by another repository.

Mitigations: canonical public package set; exact internal versions; release-set validator; repository ownership check for existing npm names; sequential idempotent publisher; GitHub Actions secret injection only at publish step.

Operational requirement: credentials must never be committed to repository or pasted into project documentation/logs. Exposed tokens must be revoked/rotated.

## Abuse/falsification matrix

| Threat | Required regression |
| --- | --- |
| forged verification flag | remains unverified without evidence |
| stale observation | cannot become current fact silently |
| authority omission | still requires intend |
| agent self-escalation | commit remains unknown/denied |
| raw transition execution | cannot obtain ExecutionLease |
| copied validated request | rejected |
| request mutation | deep freeze blocks mutation |
| stale after prepare | beginExecution rejects and permanently invalidates permit |
| ABA replay | invalid permit never revives |
| ambiguous timeout retry | blocked until reconciliation |
| prediction rewrite | TemporalRecord/Witness immutable |
| low declared risk on destructive action | deterministic policy floor remains high |
| renderer semantic suppression | invariance tests fail |
| RIR component leakage | architecture guard fails |
| mixed package release versions | release-set validation fails |

## Deferred high-risk areas

Before stable production claims, CRAYON still needs:
- cryptographically attributable evidence/witnesses;
- durable persistence and crash recovery semantics;
- distributed ordering/idempotency model;
- tenant/isolation model for hosted runtimes;
- dependency/SBOM/signing policy;
- production penetration/security review.

These limitations must remain visible; alpha semantics must not imply they are solved.
