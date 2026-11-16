# CRAYON Architectural Decision Log

This document records decisions that should not be casually reversed. If a decision changes, add a new entry explaining why.

## ADR-001 — Kernel is platform-agnostic

**Status:** Accepted

The semantic kernel must not know about React, browsers, screens, buttons, cards, modals, hover, pixels, CSS, or device-specific gestures.

**Reason:** CRAYON should preserve meaning across Web, Mobile, Voice, Agent, and future renderers.

**Consequence:** UI frameworks are renderer concerns only.

---

## ADR-002 — Reality is never accessed directly

**Status:** Accepted

CRAYON models `Observation` rather than claiming direct access to reality.

**Reason:** software sees APIs, sensors, databases, caches, humans, and agents. These are observations with differing reliability, freshness, and conflicts.

**Consequence:** `Knowledge` must be derived from observations/evidence and retain epistemic state.

---

## ADR-003 — Prediction is not truth

**Status:** Accepted; implemented in Kernel v0.1 draft

A simulated transition describes a predicted future, not the actual post-execution world.

**Required model:**

`Before -> Prediction -> Commitment -> Execution -> Observation -> Reconciliation -> Witness`

**Implementation invariant:**
- `Transition.prediction` contains simulated state only.
- `ObservedOutcome` contains post-execution observations only.
- `Witness` carries prediction and observed outcome separately.
- No `Witness.after` field may be populated from simulation.
- Witness verification status is derived from observation reconciliation rather than caller input.

---

## ADR-004 — Possibility precedes intent

**Status:** Accepted

An actionable capability exists as a `Possibility`. Selection by an authorized actor creates `Intent`.

**Reason:** a system can expose possible actions without claiming the human or agent has chosen them.

---

## ADR-005 — Intent is not commitment

**Status:** Accepted

Intent expresses desired action. Commitment accepts the relevant consequences and authorizes execution.

**Reason:** high-impact actions require a semantic distinction between wanting and authorizing.

---

## ADR-006 — Commitment friction is derived, not styled

**Status:** Accepted

Interaction resistance must be derived from consequence, impact, reversibility, uncertainty, authority, and policy rather than a developer choosing `variant="danger"`.

**Consequence:** resistance calculations must be deterministic and explainable.

---

## ADR-007 — Every meaningful action closes the loop

**Status:** Accepted

Execution is incomplete from CRAYON's perspective until the resulting world is observed/reconciled or explicitly remains unknown.

**Reason:** `success=true` is not enough evidence that intended effects actually occurred.

---

## ADR-008 — Unknown and conflict are first-class states

**Status:** Accepted

CRAYON must represent `unknown`, `uncertain`, and `conflicted` rather than silently converting them into a value, zero, empty state, or guessed answer.

---

## ADR-009 — Adaptation must be explainable

**Status:** Accepted

Any adaptive prominence, resistance, disclosure, or representation decision must expose structured reasons.

**Forbidden explanation:** `AI decided`.

---

## ADR-010 — Human authority remains explicit

**Status:** Accepted

AI or automated agents may observe, suggest, simulate, or execute only according to explicit authority capabilities.

**Reason:** agent intelligence must not create invisible privilege escalation.

---

## ADR-011 — RIR is semantic, not visual-component IR

**Status:** Planned

Representation Intermediate Representation may describe state, transition, evidence, relation, uncertainty, temporal direction, consequence, and collection semantics.

It must not become a serialized React component tree.

---

## ADR-012 — Visual DNA is derived after falsification

**Status:** Accepted

CRAYON will not optimize early for a unique button shape, dashboard style, glass effects, gradients, or fashionable design language.

Visual identity should emerge from semantics such as transition, consequence, evidence, uncertainty, context, and witness.

---

## ADR-013 — Verification is derived, never declared

**Status:** Accepted; implemented in Kernel v0.1 draft

`ObservedOutcome` does not accept a verification status.

`Witness.status` is derived by reconciling observed values against every predicted effect target.

Rules:
- all predicted targets observed as fact and matching prediction -> `verified`;
- some matching evidence plus unresolved targets -> `partial`;
- no established effect evidence -> `unverified`;
- conflicting sources or observed values that contradict prediction -> `conflicted`.

**Reason:** truth status is an epistemic conclusion. It must never be a flag supplied by an external caller.

---

## ADR-014 — Intelligence is not authority

**Status:** Accepted; implemented in P1 draft

CRAYON models authority as independent capabilities:

- `observe`
- `propose`
- `intend`
- `commit`
- `execute`
- `verify`
- `override`

An actor may possess any subset without inheriting the others.

Authority rules are explicit `allow` / `deny` rules scoped by actor, subject, and/or situation.

Decision rules:
- a matching explicit deny overrides matching allows;
- a matching allow with no deny produces `allowed`;
- no matching rule produces `unknown`, never implicit allow;
- actor intelligence, reasoning ability, visibility, or proposal capability never creates commit/execute authority.

**Reason:** capability must represent entrusted agency, not inferred power. Separating intelligence from authority prevents invisible privilege escalation, particularly for automated actors.

---

## ADR-015 — Possibility availability is derived and fail-closed

**Status:** Accepted; implemented in P1 draft

A `Possibility` does not own an authoritative `available` boolean. Availability is derived from current knowledge, constraint evaluation, and authority evaluation.

Possible results are:
- `available` — constraints are satisfied and required authority is explicitly allowed;
- `unavailable` — at least one constraint fails or required authority is explicitly denied;
- `unknown` — required knowledge or authority cannot currently be established.

Additional invariants:
- missing values must never accidentally satisfy comparison predicates;
- absent or empty possibility authority requirements default to an `intend` authority requirement for the possibility subject;
- `unknown` never becomes implicit allow.

**Reason:** actionability must correspond to a real current capability, not a caller-declared UI state.

---

## ADR-016 — Execution requires an opaque validated permit

**Status:** Accepted; implemented in P1 draft

A raw `Transition` is a prediction and cannot cross the execution boundary by itself.

A validated execution request is produced only after CRAYON establishes:
- current-world transition readiness;
- possibility availability;
- commit authority;
- execute authority;
- a valid commitment record bound to the committer and transition.

For the current single-process kernel, commitment records and validated execution requests are process-local capability objects tracked by private `WeakSet` membership. Validated requests are deeply frozen before being issued.

Consequences:
- plain-object copies cannot forge commitment or execution authority;
- a copied validated request is not itself a valid permit;
- post-validation mutation cannot alter a permit;
- execution returns observations/evidence, not a trusted `success=true` assertion.

**Future constraint:** distributed or cross-process execution will require a different permit trust mechanism, potentially signed or otherwise verifiable, without weakening the semantic gate.
