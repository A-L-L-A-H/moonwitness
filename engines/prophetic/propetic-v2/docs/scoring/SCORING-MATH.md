# Mathematical Evidence Scoring v1.2

## Scope

The score measures **strength and quality of evidence in the dataset**. It does **not** score the rank, holiness, worth, or truth-status of a prophet, and it is **not** a probability that revelation is true.

## 1. Evidence aggregation

Each evidence class already has a normalized strength `s ∈ [0,1]` (`Q5=1.00`, `Q4=0.90`, ...).

Independent-looking support is aggregated with a correlation-aware noisy-OR:

`E = 1 - Π_i (1 - s_i · 2^{-i})`

where evidence is sorted strongest-first and repeated evidence is discounted by `1, 1/2, 1/4, ...`.

Properties:
- `0 ≤ E ≤ 1` (bounded)
- adding positive support cannot lower `E` (monotonic)
- repeated support has diminishing marginal effect
- machine-generated matcher output is **not added as independent evidence** when curated evidence exists, preventing statistical double counting; automatic-only hypotheses receive a conservative 0.25 factor

## 2. Components

Each ASMA relation has five components in `[0,1]`:

1. `evidence_strength`
2. `linguistic_match`
3. `provenance`
4. `cross_source_consistency`
5. `reproducibility`

The total is an equal-weight geometric mean:

`S = 100 · (x1·x2·x3·x4·x5)^(1/5)`

The geometric mean is used because one very weak dimension should materially reduce a claim that is otherwise strong, and equal default weights avoid silently privileging one dimension.

## 3. Conflict rule

Explicit cross-scripture divergence does not get erased. It reduces `cross_source_consistency`; `AGREES` and `SUPPLEMENTS` do not incur a conflict penalty.

## 4. Why this is not yet a scientific probability

A numeric rubric is mathematically defined but is not automatically an empirically calibrated probability. To call a number a calibrated probability, the model needs an external labeled benchmark of claims (`accepted/rejected` or equivalent) and out-of-sample evaluation.

The repository therefore returns:

- `raw_score: 0..100`
- `calibration_status: UNCALIBRATED`
- `calibrated_probability: null`

until benchmark data exist.

## 5. Scientific calibration path

With an independently labeled benchmark:

- fit a calibration mapping on a training split
- evaluate on a held-out test split
- report Brier score: `BS = (1/N) Σ (p_i - y_i)^2`
- inspect reliability/calibration curves
- optionally report log loss

Only after calibration passes should a separate `calibrated_probability` field be enabled.

## 6. Bayesian extension

Bayesian updating is appropriate only when empirical or defensible likelihood ratios are available. The engine must not invent priors or likelihood ratios. In odds form:

`Posterior Odds = Prior Odds × Likelihood Ratio`

This is reserved for a later calibrated evidence layer rather than hard-coded theological probabilities.
