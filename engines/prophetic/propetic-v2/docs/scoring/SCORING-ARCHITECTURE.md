# Scoring Architecture

## Separate score families

The engine deliberately avoids a single universal score.

### Trait Evidence

Measures support strength for documented positive traits/ASMA relations. Ties are preserved.

### Data Confidence

Measures completeness, provenance strength, and uncertainty across a profile.

### Context Evidence

Measures documentation quality for religion, people/region, and language context. It does not rank religions, peoples, countries, or languages.

### World Trait Salience

Maps documented traits to external psychology/value research. This is a research index, not a theological judgment.

### Human Preference

Uses pairwise observations and a Bradley–Terry model. It remains `UNCALIBRATED` while the observation set is empty or insufficient.

### Composite

Must remain disabled until required empirical components are calibrated and the weighting policy is frozen/versioned.

## Mathematical constraints

- bounded outputs;
- monotonicity when adding genuinely positive independent support;
- diminishing returns for correlated evidence;
- explicit conflict penalty only on affected claims;
- deterministic reproducibility from versioned inputs;
- no hidden tie-breaker.
