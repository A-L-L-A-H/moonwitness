# HADITH EVIDENCE MODEL v1.0

## Purpose

This module treats hadith as **prophetic reports** and keeps them separate from Qur'anic revelation. The model records both the classical Muslim verification layer and a separate historical/textual assessment.

## Core rule

> Hadith can be strongly supported as a transmitted report without being classified as revelation.

Classical Muslim hadith criticism explicitly discusses isnad, trustworthy transmitters, and narrator criticism. Sahih Muslim's introduction contains chapters on the chain of transmission, trustworthy narrators, and criticism of narrators. [Sahih Muslim, Introduction 26–31](https://sunnah.com/muslim/introduction/25).

## Evidence card

Each hadith claim must contain:

1. **Identity** — collection, book/chapter, hadith identifier, edition.
2. **Matn** — brief paraphrase, original-language text reference, wording variants.
3. **Isnad** — ordered chain of transmitters.
4. **Narrator audit** — per-narrator reliability evidence and disputes.
5. **Continuity** — whether links are historically plausible and contemporaneous.
6. **Parallel routes** — independent or overlapping chains and wording.
7. **Classical grading** — e.g. sahih/hasan/da'if, with grader/source.
8. **Historical assessment** — separate modern/source-critical evaluation.
9. **CRAYON Layers (v7.0.0)** — R (Fakta), G (Konteks), B (Makna), L (Hikmah), Caution.
10. **Score** — project score out of 100, dynamically aggregated from the bottom up.

## Scoring dimensions

| Component | Weight |
|---|---:|
| Source quality | 20 |
| Transmission | 25 |
| Proximity | 20 |
| Independent corroboration | 20 |
| Interpretation gap | 15 |
| **Total** | **100** |

## Non-equivalence rule

`classical_grade != project_score != revelation_status`

A hadith marked *sahih* in a classical collection remains a hadith report. The project must not convert the label directly into `REVELATION_EXPLICIT`.

## Chain model

```text
Compiler/collection
  ↓
Immediate transmitter
  ↓
Narrator N-1
  ↓
Narrator N-2
  ↓
...
  ↓
Companion / source layer
  ↓
Prophetic attribution
```

Each link receives its own evidence record. The model supports disputes and multiple scholarly judgments rather than forcing one narrator rating.

## Matn model

The matn is assessed separately from the isnad:

- wording stability
- semantic variants
- parallel narrations
- chronology
- geographical/social context
- compatibility with stronger textual witnesses
- evidence for interpolation or later wording

This is an assessment framework, not an instruction to reject a report merely because it differs from another report.

## Evidence rule

If a field is unknown, use `pending` or `unknown`, **never zero by default**. Zero means evidence was assessed and found absent; pending means the audit has not been completed.
