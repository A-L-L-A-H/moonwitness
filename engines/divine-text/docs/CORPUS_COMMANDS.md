# Corpus Commands — v6.3

This release includes one command surface for corpus discovery, download, verification, and status.

```bash
npm run corpus:list
npm run corpus:status
npm run corpus:download:all
npm run corpus:download -- bukhari
npm run corpus:verify
npm run corpus:verify -- hadith
```

Configured families:

- `quran` — existing local normalized witness
- `hadith` — pinned `AhmedBaset/hadith-json` v1.2.0, discovered from its pinned GitHub release layout
- `torah` — Genesis, Exodus, Leviticus, Numbers, Deuteronomy via Sefaria API (Hebrew primary text request)
- `psalms` — Psalms via Sefaria API (Hebrew primary text request)
- `gospels` — Matthew, Mark, Luke, John from a public-domain KJV machine-readable source

The downloader preserves raw files and writes SHA-256 manifests. It never edits the source text. A failed external download remains `PENDING`/`MISSING`; it is never converted to a zero score.
