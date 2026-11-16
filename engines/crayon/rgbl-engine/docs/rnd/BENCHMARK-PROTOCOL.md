# RGBL Benchmark and Evaluation Protocol v0.8

## Research status

This is a protocol for future evaluation. It does not claim RGBL has already been scientifically validated.

## What is being evaluated

The benchmark evaluates **reasoning discipline and framework behavior**, not whether RGBL can mechanically determine ultimate truth.

Nine dimensions are scored from 0 to 4:

| Dimension | 0 | 4 |
|---|---|---|
| R accuracy | observation and inference are confused | R1 cleanly records facts/sources/context |
| G support | pattern/model unsupported | G claims explicitly supported and proportionate |
| B interpretive discipline | projection/identity reduction dominates | agency/impact/meaning are evidence-aware and bounded |
| L responsibility | premature or reckless direction | direction integrates prior levels, trade-offs, caution |
| provenance | claims cannot be traced | claim/source/dependency graph is auditable |
| UNKNOWN honesty | gaps are hidden | uncertainty reason and next evidence need are explicit |
| alternative coverage | preferred view is assumed | material alternatives/conflicts are preserved |
| confidence calibration | certainty ignores support | confidence tracks support and varies by level |
| action usefulness | action is vague/disproportionate | action is specific, proportionate, feedback-oriented |

Maximum score: **36**. A normalized score can be computed as `raw / 36`.

Scores are not universal truth probabilities.

## Initial tracks

- HUMAN / SELF
- NATURE / WORLD
- JUSTICE / OTHERS
- GENERAL
- ALLAH / SOURCE as a separate theological-source track

## Adversarial families

The initial fixture set includes cases designed to expose:
- single-event overgeneralization;
- correlation/causation confusion;
- emotional framing;
- missing context;
- conflicting evidence;
- authority/status bias;
- premature action;
- identity reduction;
- theology provenance collapse.

## Reproducibility study design

### Study A — inter-rater classification
Two or more analysts independently classify supplied statements into R/G/B/L and claim type.

Measure:
- percent agreement;
- Cohen's kappa for two raters or Fleiss' kappa for multiple raters where appropriate;
- disagreement categories.

### Study B — repeated analysis
The same analyst repeats selected cases after a delay.

Measure:
- level classification stability;
- diagnostic stability;
- score change;
- reasons for justified revision.

### Study C — baseline comparison
Compare ordinary unstructured reasoning with RGBL-assisted reasoning on the same cases.

Candidate outcomes:
- unsupported-claim rate;
- explicit-unknown rate;
- source traceability;
- alternative coverage;
- confidence calibration;
- evaluator-rated decision responsibility.

### Study D — adversarial robustness
Present misleading framing, sparse data, contradictory sources, or premature recommendations and record whether RGBL surfaces the intended quality warning.

## Benchmark governance

1. Keep training/development fixtures separate from later blinded evaluation fixtures.
2. Do not optimize solely for the current small fixture set.
3. Record rubric revisions by version.
4. Publish failures and disagreement, not only aggregate scores.
5. Do not call the framework validated until an actual empirical protocol is run and reported.
