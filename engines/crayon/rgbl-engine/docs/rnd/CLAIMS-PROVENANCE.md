# Claim Types and Provenance Graph

## Why claim-level provenance matters

A source list at the end of an analysis is not enough to establish which source supports which conclusion. v0.8 therefore represents a reasoning output as a graph of claims.

## Structured claim

```ts
{
  id: "g2:plant-growth",
  text: "Growth rate differs consistently between the two sites.",
  level: "G2",
  type: "pattern",
  evidenceClass: "empirical",
  sourceRefs: ["weekly-heights"],
  dependsOn: ["r1:height-a", "r1:height-b"],
  confidence: 0.82
}
```

## Claim taxonomy

- **R1:** observation, measurement, source-statement.
- **G2:** pattern, relation, model, causal-hypothesis, inference.
- **B3:** interpretation, entity, agency, intention, impact, value, inference.
- **L4:** decision, caution, value, theological-claim.

The taxonomy is an admissibility default, not an ontology of every sentence humans can write.

## Evidence classes

- `empirical` — observation/measurement;
- `testimonial` — a person's report or testimony;
- `documentary` — document/record;
- `philosophical` — conceptual or philosophical reasoning;
- `revelation` — revelation used as a theological domain source;
- `mixed` — explicitly combines classes;
- `unspecified` — source class has not yet been established.

## Dependency graph

```text
source
  ↓
R1 claim(s)
  ↓
G2 claim
  ↓
B3 claim
  ↓
L4 claim
```

A derived claim should normally identify either `dependsOn`, `sourceRefs`, or both. Legacy array inputs are automatically dependency-linked across RGBL levels, but precise source-to-claim linkage requires `structuredClaims`. When neither provenance path is present, the engine emits `SOURCELESS_DERIVED_CLAIM`.

## Allah-domain provenance discipline

The ALLAH application must keep three categories machine-distinguishable:

```text
observable sign     → empirical / R1
the source question → philosophical / G2-B3
theological claim   → revelation or mixed / B3-L4
```

Example:

```text
allah-signs [R1, empirical]
    ↓
allah-source-question [G2, philosophical]
    ↓
allah-recognition [L4, revelation]
```

This graph represents how a conclusion is organized. It does **not** turn Allah into an empirically measurable object.
