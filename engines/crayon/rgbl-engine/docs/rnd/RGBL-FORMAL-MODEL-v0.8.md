# RGBL Formal Model v0.8

## Status

**Research specification — not a validated scientific theory.**

The goal of v0.8 is to make RGBL operational enough that classification agreement, reasoning traceability, uncertainty behavior, and decision discipline can later be evaluated empirically.

## 1. Canonical levels

### R1 — Reality → Information

Admits records whose primary function is to state what was observed, measured, recorded, sourced, contextualized, or explicitly left unknown.

Facets:
- observation;
- measurement;
- source;
- context;
- unknown.

R1 does not silently include motive, meaning, causal explanation, or recommendation.

### G2 — Governing Order → Knowledge

Admits supported claims about patterns, relations, comparisons, rules, mechanisms, models, and causal hypotheses.

Facets:
- pattern;
- relation;
- comparison;
- rule;
- mechanism;
- model;
- causal hypothesis.

G2 is accountable to R1. The strength of a G2 claim may not exceed the support supplied by R1 without being marked provisional.

### B3 — Being → Understanding / Meaning

Admits claims about entities/beings in context, state, agency, intention, dependency, relationship, experience, impact, value, responsibility, and meaning.

Facets:
- entity;
- state;
- agency;
- intention;
- dependency;
- relationship;
- experience;
- impact;
- value;
- responsibility;
- meaning.

B3 is the interpretive layer with the highest risk of projection. Claims about another person's intention, identity, or experience require appropriate evidence or testimony.

### L4 — Light → Wisdom / Responsible Direction

Admits integrated lessons, options, trade-offs, benefits, risks, limitations, decisions, actions, and next questions.

Facets:
- lesson;
- option;
- trade-off;
- benefit;
- risk;
- limitation;
- decision;
- action;
- next question.

L4 is not a certainty label. It is the most responsible direction available under the current R1/G2/B3 support and stated limitations.

## 2. Cumulative invariant

```text
R1
R1 + G2
R1 + G2 + B3
R1 + G2 + B3 + L4
```

Later interpretation may revise how earlier information is understood, but it may not erase inconvenient R1 evidence without an explicit reason.

## 3. Proof-chain invariant

A mature RGBL analysis contains not only four outputs but also a justification chain:

```text
R1 --support--> G2 --interpretive bridge--> B3 --integration--> L4
                                                        |
                                                        v
                                                      ACTION
                                                        |
                                                        v
                                                      R1'
```

Each derived claim can carry:
- a stable claim ID;
- RGBL level;
- claim type;
- source references;
- dependency claim IDs;
- evidence class;
- optional claim confidence.

The absence of a dependency does not automatically make a claim false. It makes the reasoning chain **unsubstantiated in the current record**.

## 4. Temporal RGBL

RGBL is iterative rather than terminal:

```text
Reality(t0)
  → RGBL(t0)
  → Action(t0)
  → Consequence
  → Reality(t1)
  → RGBL(t1)
  → ...
```

`L4 → R1'` remains **pending** until consequences are actually observed. This prevents a planned benefit from being recorded as if it had already occurred.

## 5. UNKNOWN invariant

UNKNOWN is a valid epistemic state. v0.8 distinguishes at least:
- missing evidence;
- conflicting evidence;
- weak source;
- ambiguous definition;
- insufficient sample;
- competing explanation;
- out-of-scope question.

The reason for uncertainty is itself information that guides the next inquiry.

## 6. Confidence invariant

Confidence may differ by level:

```text
R1 = 0.95
G2 = 0.72
B3 = 0.48
L4 = 0.31
```

This expresses a common condition: facts can be relatively secure while interpretation or action remains uncertain. Confidence is a workflow indicator, not a universal probability that a proposition is metaphysically true.

## 7. Domain-source invariant

Different domains legitimately use different source classes. A source class does not become another source class merely because it is placed in the same framework.

For the ALLAH application:
- observable signs remain empirical/observational records;
- arguments about ultimate source remain philosophical reasoning;
- claims about Allah grounded in revelation remain revelation-based theological claims.

The framework must not present revelation-based attributes as empirical measurements of Allah.

## 8. Quality target

A high-quality RGBL result should be:
- **grounded** — R1 is explicit;
- **supported** — G2 shows what supports the pattern/model;
- **interpretively disciplined** — B3 distinguishes evidence from projection;
- **proportionate** — L4 does not outrun support;
- **traceable** — sources/dependencies can be followed;
- **uncertainty-honest** — unresolved matters remain visible;
- **iterative** — action returns to Reality for feedback.
