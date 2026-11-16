# v4.0 QA Report

## Runtime
- Node.js ESM
- Zero runtime dependencies
- No npm registry access required

## Automated tests
5/5 passed.

### Verified
1. Qur'an corpus: 6,236 records and 114 surahs.
2. Arabic normalized search: `الله` matches Uthmani forms with harakat/alif variants.
3. Evidence-score bounds: all component maxima enforced.
4. Revelation/text identity boundary: Injil identity claim remains `UNRESOLVED`.
5. Manuscript registry contains the three baseline witnesses with source URLs.

## Known pending evidence
- Full hadith corpus raw ingestion.
- Primary Torah/Pentateuch corpus.
- Primary Psalms corpus.
- Primary Gospel corpus.

## Interpretation
v4 is a reproducible research runtime and evidence registry, not a completed historical verdict. Pending datasets must be ingested before corpus-level conclusions are scored.
