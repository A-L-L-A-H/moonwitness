# Calibration benchmark

Raw v1.1 scores are **UNCALIBRATED evidence-quality scores**, not probabilities.

To perform empirical calibration, create an independently reviewed label file:

```json
[
  {"raw_score": 82.4, "label": 1},
  {"raw_score": 31.0, "label": 0}
]
```

- `label=1`: benchmark reviewers accept the claim under a predeclared rubric.
- `label=0`: benchmark reviewers reject the claim under that rubric.
- Labels must be assigned independently of the score itself.
- Use a held-out test set. Do not evaluate on the same data used to tune the scoring rules.
- The engine requires at least 20 observations to compute Brier; 100+ is preferred.

The benchmark validates **the scoring system's calibration against the chosen review rubric**, not metaphysical truth.
