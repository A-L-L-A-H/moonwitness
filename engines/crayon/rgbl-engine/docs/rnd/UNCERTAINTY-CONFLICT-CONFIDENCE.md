# UNKNOWN, Conflict, and Confidence

## UNKNOWN taxonomy

`UNKNOWN` is not one undifferentiated state.

| Reason | Meaning | Typical next move |
|---|---|---|
| missing-evidence | required evidence is absent | collect information |
| conflicting-evidence | available records disagree materially | seek discriminating evidence |
| weak-source | provenance/reliability is inadequate | improve source quality |
| ambiguous-definition | key term/entity is unclear | define operationally |
| insufficient-sample | support is too sparse for the proposed pattern | collect more/comparative observations |
| competing-explanation | multiple models remain plausible | compare predictions/discriminators |
| out-of-scope | current method/source type cannot answer the claim | change method or narrow claim |

The engine currently infers only reasons it can justify structurally; it should not fabricate a sophisticated reason when the input does not establish one.

## Conflict preservation

Conflicts are explicit records:

```ts
{
  id: "conflict:1",
  description: "Source A reports X; Source B reports not-X",
  claimIds: ["r1:a", "r1:b"],
  status: "unresolved"
}
```

An unresolved conflict is preserved into later stages. If L4 is produced anyway, the engine emits `CONTRADICTION_SUPPRESSION` as a warning.

The preferred behavior is often:

```text
R1: conflicting records
G2: competing patterns/models
B3: interpretation unresolved
L4: gather discriminating evidence / choose reversible action
```

## Per-level confidence

v0.8 exposes `R1`, `G2`, `B3`, and `L4` confidence independently.

Interpretation:
- **R1 confidence** — quality/coverage of recorded information;
- **G2 confidence** — support for pattern/model claims;
- **B3 confidence** — support for meaning/agency/impact interpretation;
- **L4 confidence** — robustness of the responsible direction under current support.

The values are bounded to 0..1 and are workflow indicators. They are not universal probabilities of metaphysical truth.

Explicit values supplied by an application take precedence over the engine's lightweight structural heuristic.

## Action under uncertainty

Low L4 confidence does not always imply "do nothing." It changes the character of prudent action. Prefer, where context permits:
- reversible actions;
- smaller commitments;
- information-gathering experiments;
- explicit cautions;
- a scheduled return to R1.
