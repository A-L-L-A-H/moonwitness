# CRAYON Domain Adapter Contract

Status: experimental v0.9 contract

A domain adapter translates already-obtained application/domain data into a CRAYON `Situation`. It is a deterministic normalization boundary, not an authority engine, executor, database, or transport connector.

## Boundary

```text
Domain data
   ↓
DomainAdapter<Input>
   ↓
Situation
   ↓
Kernel / Snapshot / Physics / RIR / Renderers
```

The adapter output type is only `Situation`. It cannot return `AuthorityDecision`, `Intent`, `Commitment`, `ExecutionLease`, `Witness`, or caller-declared verification.

A `Possibility` may carry **authority requirements** because those are requirements to be evaluated later; the adapter does not decide whether the actor is allowed.

## Determinism

The runtime provides `DomainAdapterContext.now`. An adapter should use that explicit time rather than reading ambient wall clock. Fetching/polling/webhook behavior belongs to the connector contract tracked in #89.

## Conformance

`validateAdaptedSituation()` / `runDomainAdapterConformance()` currently check:

- non-empty adapter/situation identity;
- valid explicit timestamps;
- anchor entity exists;
- entity IDs are unique;
- relation endpoints exist;
- observations have source provenance;
- reliability values remain in `0..1`;
- adapter-produced `fact` knowledge cites observation/evidence provenance;
- adapter exceptions remain adapter failures rather than semantic outcomes.

Reason codes are machine-readable and will feed the wider catalog in #90/#106.

## Current package state

`allah-crayon-adapter` is a private experimental workspace package. It is not part of the public npm release set yet. Promotion requires adapter conformance across the six falsification domains (#88) and a registry-based external consumer path.

## Non-goals

An adapter must not:

- infer truth because an HTTP request returned 200;
- grant an actor authority;
- create human intent/commitment;
- turn a prediction into an observation;
- rewrite historical witness records;
- choose Web components or visual themes.
