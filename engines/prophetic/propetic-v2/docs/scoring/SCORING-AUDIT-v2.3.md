# Scoring Audit v2.3

Scores measure evidence/data/research quality, never prophetic worth and never probability of metaphysical truth.

## Native RID correction

A Qur'anic verse attached to a `native_name_root` may attest the Qur'anic name/identity without independently proving the proposed historical etymology. v2.3 therefore caps native-name RID evidence below direct Qur'anic attribute evidence.

## Profile ASMA-quality correction

Data Confidence previously used the single strongest relation score. v2.3 uses the **mean of all curated ASMA relation scores for that profile**, preventing one excellent relation from hiding weaker encoded relations. Automatic-only candidates are excluded from this profile-quality component.

## Matcher diagnostic target

The automatic matcher is mainly a root/identity/trait candidate generator. Comparing it against `MISSION_ALIGNMENT` or `DIVINE_INTERACTION` edges is not a like-for-like accuracy test.

Therefore `scoring-audit.v2.3.json` reports two diagnostics:

1. **trait_target** — compares auto candidates with curated `SHARED_LEXEME_TRAIT`, `SHARED_ROOT_TRAIT`, and `SEMANTIC_TRAIT_REFLECTION` relations. Current internal top-1 agreement: **14/17 = 82.35%**.
2. **all_curated_edges_context_only** — current **17/25 = 68%**, retained only as context because it mixes relation targets.

Neither number is external accuracy because curated relations are not an independent labeled gold standard.

## Remaining score limitations

- Data Confidence remains high/saturated; use bands and components, not tiny decimal differences, for interpretation.
- Trait Evidence has only four score levels because it intentionally mirrors evidence classes.
- World Trait Salience is available only where conservative external trait mappings exist; missing profiles are not imputed.
- A score of 100 is a rubric ceiling only.

## Calibration

Raw 0–100 scores remain uncalibrated research indices. Probability remains unavailable until an independent benchmark and calibration protocol exist.
