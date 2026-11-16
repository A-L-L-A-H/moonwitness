# Source Versioning Policy

## Why versioning is required

A passage reference is stable only at the reference level. Exact wording can depend on manuscript, edition, translation, orthography, or normalization. Therefore quoted text and lexical analysis require edition metadata.

## Version object

Recommended fields:

```ts
interface SourceEdition {
  edition_id: string;
  source_id: 'quran'|'taurat'|'zabur'|'injil';
  work: string;
  language: string;
  script?: string;
  publisher_or_repository?: string;
  edition_label?: string;
  publication_year?: number;
  access_date?: string;
  checksum?: string;
  license?: string;
  notes?: string;
}
```

## Rules

1. Reference-only claims may omit edition ID if wording is not used computationally.
2. Direct quotation or token/root analysis should carry `edition_id`.
3. Translation is never treated as the lexical source for an Arabic/Hebrew/Greek root claim.
4. Updating an edition does not mutate old claims silently; provenance records are versioned.
5. Corpus hashes/checksums should be added once raw approved corpora are ingested.
