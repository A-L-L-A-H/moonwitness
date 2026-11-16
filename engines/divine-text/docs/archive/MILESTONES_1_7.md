# Milestones 1–7 — Execution Report

## 1. Quran normalization
Input: local Uthmani witness. Output: normalized JSONL. Only the known TeX verse-number marker was removed; no lexical substitutions were made.

## 2. Hadith ingestion
Full remote corpus is PENDING because the runtime cannot fetch the external archive. The repository retains pinned source metadata and a reproducible downloader.

## 3. Evidence/claim database
Claim records are stored under `data/claims/` and evidence cards under `data/evidence/`.

## 4. Torah / Pentateuch mapping
Modern Jewish Torah/Pentateuch witness is modeled as Genesis, Exodus, Leviticus, Numbers, and Deuteronomy. This is not asserted to be identical to the Qur'anic revelation called al-Tawrat.

## 5. Psalms / Zabur mapping
Psalms is treated as a candidate modern textual witness, not automatically equated with the Qur'anic Zabur.

## 6. Gospel / Injil mapping
Matthew, Mark, Luke, and John are modeled as four canonical Gospels in the Christian Bible. The system does not automatically equate them with the Injil given to Isa.

## 7. Cross-scripture report
The report compares claim classes, text witnesses, transmission evidence, and interpretation gaps. It does not score religions as a whole.
