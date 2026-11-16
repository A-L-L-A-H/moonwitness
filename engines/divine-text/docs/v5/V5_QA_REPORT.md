# v5.0 QA Report

## Automated tests
13/13 passed.

## Runtime smoke tests
- `/` → 200
- `/api/health` → 200, version 5.0.0
- `/api/quran/search?q=الله&limit=2` → results
- `/api/research/run?topic=isa` → deterministic report
- `/api/graph` → 4 active edges
- `/api/ai/ask` → safe fallback when no local model is running
- `/api/scoring` → PENDING when evidence basis is incomplete
- missing asset → 404

## Research integrity gates
- No score without evidence basis.
- PENDING never becomes zero.
- AI output is never treated as evidence.
- Local AI is optional; deterministic mode always works.
- Missing external corpora are explicitly reported.

## Known data gaps
- Full hadith corpus not locally ingested.
- Torah/Psalms/Gospels primary corpora are not locally ingested.
