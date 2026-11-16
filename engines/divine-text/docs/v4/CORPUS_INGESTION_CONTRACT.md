# Corpus Ingestion Contract

Every new corpus must arrive as a raw, unmodified file plus:

- source URL or archive reference
- version/tag/date
- license/usage note
- expected record count if published
- SHA-256 checksum
- language
- edition/tradition

The pipeline must then produce:

1. raw copy
2. normalized JSONL
3. manifest
4. validation report
5. checksum report

No corpus is considered `LOCAL_COMPLETE` until all five are present.
