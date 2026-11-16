# ADR-022 — Cross-Cutting Platform Contracts

Status: LOCKED
Date: 2026-08-30

## Decision

MoonWitness standardizes the cross-cutting contracts that must remain consistent across all repositories:

- immutable canonical identifiers;
- explicit domain state machines and event envelopes;
- stable Problem Details error taxonomy;
- idempotency for retryable mutations;
- propagated request/trace/correlation context;
- data classification, retention, and artifact lifecycle;
- API lifecycle and compatibility states;
- provider-agnostic AI operations, retrieval provenance, tool allowlists, and evaluation metadata;
- portable design tokens, component ownership, and UI state semantics;
- environment/config boundaries;
- supply-chain controls;
- cost attribution;
- recovery/DR semantics;
- explicit migration lifecycle;
- one Golden Path for end-to-end architecture validation;
- machine-checkable blueprint invariants.

## Rationale

The ecosystem contains multiple specialized repositories with different legacy toolchains and runtime assumptions. Cross-cutting behavior cannot be left to repository-local interpretation without reintroducing drift.

## Consequences

These contracts are architectural invariants. Implementations may differ internally, but observable semantics and ownership rules must conform. Provider-specific or framework-specific details remain adapters.

## Change rule

Breaking changes require a new ADR with migration, compatibility, rollback, and affected-repository analysis.
