# Evidence Specification

## Evidence classes

| Class | Meaning | Typical score weight |
|---|---|---:|
| `Q5` | direct Qur'anic statement | 1.00 |
| `Q4` | same explicit Qur'anic lexeme/form | 0.90 |
| `Q3` | supported Qur'anic root relation | 0.80 |
| `Q2` | strong Qur'anic semantic/context relation | 0.65 |
| `Q1` | model mapping from Qur'anic evidence | 0.45 |
| `S3` | direct Taurat/Zabur/Injil witness | 0.60 |
| `S2` | supplementary semantic witness | 0.45 |
| `S1` | supplement with uncertain identity binding | 0.25 |
| `T1` | tafsir/traditional identification | 0.25 |
| `E0` | unknown/insufficient | 0.00 |

## Comparison rules

- Evidence class describes support quality, not sacred rank.
- Q5 cannot be emitted by an automatic matcher.
- Multiple claims from the same passage are correlated and must not be counted as fully independent evidence.
- A supplementary source can add context but cannot convert itself into a Qur'anic class.
- Conflict penalties are claim-specific.
