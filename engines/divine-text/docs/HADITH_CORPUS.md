# Hadith Corpus Integration

## Pinned corpus
- Repository: AhmedBaset/hadith-json
- Version: v1.2.0
- Scope: 17 named collections, 50,884 hadiths as reported by the upstream README
- Source stated by upstream: Sunnah.com

## Why this is a corpus, not “all hadith”
“Hadith” is not a finite universal database. This repository is a selected digital corpus of specific collections. It is therefore indexed as a **research corpus**, not as the complete universe of hadith transmission.

## Known limitation
The upstream README states that Musnad Ahmad chapters 8–30 are missing from this release.

## Reproducibility
The fetch script is pinned to `v1.2.0`. Use `scripts/fetch_hadith_corpus.sh` when the runtime has outbound Git access.

## Licensing / redistribution
The upstream README says the data were scraped from Sunnah.com. Before redistributing the full scraped English corpus, review the upstream repository terms and Sunnah.com terms.
