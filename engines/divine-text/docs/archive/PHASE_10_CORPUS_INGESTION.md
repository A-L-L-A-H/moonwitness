# Phase 10 — Corpus Ingestion

Goal: preserve raw source data and derive a normalized research representation.

## Rules
- Raw data is immutable after ingestion.
- Every corpus gets source URL/version/license/checksum metadata.
- Normalization never overwrites raw source.
- Missing corpora are marked `PENDING`, never synthesized.

## Current state
- Qur'an local corpus: available in `data/corpora/quran/`.
- Hadith: source registry and ingestion pipeline exist; full external corpus is pending local transfer.
- Torah/Psalms/Gospels: architecture defined; raw corpus ingestion pending.
