# World Trait Research Layer v1.2

This layer is deliberately separate from Qur'anic/textual evidence scoring.

## What it can score now

`WORLD_TRAIT_SALIENCE` is an ordinal research index for textually mapped VIA character strengths.
It uses only:

1. Qur'an/Taurat/Zabur/Injil textual evidence strength for the trait mapping.
2. VIA-IS-R published psychometric reliability (`alpha`).
3. Whether the trait appears in the published moral-valuation top five.
4. Whether the trait appears in the 54-nation prevalence top five.

Formula, for at most three curated traits per prophet:

`W = 100 × Σ[top-2 contributions] / 4`, where `contribution = evidence_strength × mapping_confidence × VIA_alpha × (I_moral_top5 + I_prevalence_top5)`

At least two conservative mappings are required. Only the two strongest contributions are used, so adding another positive mapped trait cannot lower the score. Missing top-five membership gives zero salience bonus; it does **not** mean the trait is bad. Stahlmann & Ruch (2020) found all 24 VIA strengths positively morally valued.

## What it does NOT score

- holiness or divine rank
- objective moral superiority
- probability that a revelation is true
- human preference probability

`HUMAN_PREFERENCE_SCORE` remains `null` until an external pairwise survey exists. A future survey can use a Bradley–Terry model. `COMPOSITE_SCORE` remains disabled until that calibration exists.

## Research sources encoded

- VIA Institute, VIA-IS-R psychometrics: 24 reliability coefficients; mean alpha reported around .85.
- Park, Peterson & Seligman (2006), 117,676 adults / 54 nations: common strengths kindness, fairness, honesty, gratitude, judgment.
- Stahlmann & Ruch (2020), Frontiers in Psychology: all strengths positively morally valued; top five judgment, honesty, kindness, fairness, hope.
- Schwartz et al. (2012): refined 19-value circular motivational model; classification context only, not a numeric preference input.
- 2026 meta-analysis of 114 RCTs / 20,853 participants: selected strength interventions and well-being; stored as research context, not as a universal score multiplier.
