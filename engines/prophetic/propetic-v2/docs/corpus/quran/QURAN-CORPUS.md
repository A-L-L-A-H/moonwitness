# Qur'an Corpus Policy

## Role

`AL-QURAN` is the core/muhaimin source in this project's four-corpus research hierarchy.

## Reference contract

Canonical reference key: `surah:ayah`.

Examples: `19:51`, `38:17`, `9:128`.

## Data policy

- Store normalized references and short verified excerpts only when needed.
- Keep Arabic lexical/root observations separate from translation glosses.
- Distinguish explicit wording from model inference.
- A Qur'anic verse may support multiple claims, but derived claims must each retain their own evidence class.

## Evidence ceiling

Only direct Qur'anic evidence can receive `Q5`. Automated semantic matching cannot promote a candidate to Q5.

## Interpretation guardrail

The 0–9 identity model, RID, graph types, and scores are research/system abstractions. They are not presented as Qur'anic terminology unless the term itself is directly Qur'anic.
