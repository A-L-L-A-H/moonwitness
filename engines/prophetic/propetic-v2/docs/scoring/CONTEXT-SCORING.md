# Context Evidence Scoring v1.3

This score measures **documentation/provenance quality only**.
It must never be read as superiority of a prophet, religion, people, region, country, or language.

## Three dimensions

- `R` Religion Context Evidence
- `G` People + Historical Region Evidence
- `L` Language + Scripture-Language Evidence

Evidence values reuse the source scale (`Q5..Q1`, `S3..S1`, `T1`, `E0`).

For region and language, paired subfields are averaged:

`G = mean(people_evidence, historical_region_evidence)`

`L = mean(language_evidence, scripture_language_evidence)`

Overall context documentation score:

`ContextScore = 100 × (R × G × L)^(1/3)`

For numerical stability only, a floor of `0.05` is used inside the logarithmic geometric-mean implementation. This prevents undefined log(0) while keeping sparse profiles strongly penalized.

## Modern geography

Modern country/geography is **not included in the core ContextScore**. It is a separate crosswalk confidence:

- low = 35
- medium = 65
- high = 90

This prevents anachronistic modern-nationality assumptions from increasing a prophet's context score.

## Guardrails

1. `RELIGION_CONTEXT_IS_NOT_RELIGION_RANK`
2. `MODERN_GEOGRAPHY_IS_CROSSWALK_NOT_NATIONALITY`
3. `LANGUAGE_CONTEXT_SEPARATES_NAME_ROOT_FROM_SPOKEN_LANGUAGE`
4. Unknown is preferred to invented certainty.
