# ADR-015 — Possibility availability is derived, never declared

**Status:** Accepted in P1 draft

## Decision

`Possibility` does not carry a trusted `available` boolean. Availability is derived from current knowledge, deterministic constraints, and explicit authority decisions.

The derived state is one of:

- `available` — all constraints are satisfied and all required authority decisions are allowed;
- `unavailable` — at least one constraint fails or a required authority decision is denied;
- `unknown` — nothing is proven false, but required knowledge or authority is unresolved.

## Constraint semantics

A constraint evaluates to `satisfied`, `failed`, or `unknown`.

By default, constraints accept only `fact` and `derived` knowledge. Estimate/claim/uncertain/conflicted/unknown knowledge cannot silently satisfy a strict constraint unless the constraint explicitly opts into those epistemic states.

## Authority interaction

Authority and constraint evaluation are independent inputs to possibility assessment. A satisfied constraint never creates authority, and authority never turns missing knowledge into truth.

## Invariant

Nothing may become actionable merely because a caller sets `available: true`.

## Reason

Actionability is a semantic conclusion about the current situation. Treating availability as caller-declared would recreate the same trust bug previously removed from witness verification.
