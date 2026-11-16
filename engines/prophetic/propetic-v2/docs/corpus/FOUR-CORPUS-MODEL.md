# Four-Corpus Model

## Source policy

The project has four allowed revelation-source categories:

1. `AL-QURAN` — core/muhaimin/primary evidence.
2. `TAURAT` — supplementary textual witness.
3. `ZABUR` — supplementary textual witness.
4. `INJIL` — supplementary textual witness.

This is a project research policy. It does not claim that every extant manuscript or later canon is identical to the original revelation referred to by those names.

## Revealed source vs textual witness

The engine deliberately models two levels:

`REVEALED SOURCE CATEGORY` → `EXTANT TEXTUAL WITNESS`

Examples:

- `TAURAT` → Torah/Pentateuch witness used for passage comparison.
- `ZABUR` → Psalms witness with attribution metadata.
- `INJIL` → Gospel witness corpus, while preserving the distinction between Qur'anic Injil and extant Gospel texts.

The distinction prevents a common modeling error: treating a later compiled canon as if its boundaries and transmission history were explicitly defined by the Qur'an.

## Fallback logic

1. Search Qur'anic evidence first.
2. If the requested property is absent, sparse, or requires cross-scripture comparison, inspect the approved supplementary witness layers.
3. Preserve source label and passage.
4. Record relation to Qur'anic claim.
5. Never replace Qur'anic wording with supplementary wording.

## Cross-source states

- `AGREES`
- `SUPPLEMENTS`
- `DIVERGES`
- `DIVERGES_FROM_LATER_IDENTIFICATION_NOT_FROM_QURAN_WORDING`
- `IDENTIFICATION_UNCERTAIN`

A difference is data, not an error to be hidden.
