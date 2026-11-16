# ADR 0001 — Four-Corpus Source Model

**Status:** Accepted  
**Release:** v2.1.0

## Decision
The engine recognizes exactly four revealed-source categories in this project model:

1. `QURAN` — core / muhaimin / primary evidence
2. `TAURAT` — supplementary textual-witness layer
3. `ZABUR` — supplementary textual-witness layer
4. `INJIL` — supplementary textual-witness layer

`BIBLE` is not a fifth source ID.

## Consequence
Every claim must retain its source category, witness corpus, reference, evidence class, and uncertainty. Cross-scripture differences remain visible.
