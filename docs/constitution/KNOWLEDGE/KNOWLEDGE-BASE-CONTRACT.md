# Knowledge Base Contract

**Status:** PROPOSED v1

## Purpose

Provide one governed retrieval layer for approved ecosystem documents, product specifications, decisions, canon, research, and selected external references.

## Source classes

- `master_document` — files in master-docs.
- `product_document` — approved docs from product repositories.
- `decision_record` — accepted governance decisions.
- `canon_record` — narrative/spiritual/character terminology with provenance.
- `research_source` — external source material and research notes.
- `published_content` — approved public MoonWitness material.
- `user_selected_private_export` — explicitly selected ROCKSOUL material; disabled by default.

## Required metadata

`source_id`, `source_type`, `canonical_uri`, `title`, `revision`, `content_hash`, `classification`, `owner`, `created_at`, `ingested_at`, `ingestion_status`, `provenance`.

Classification: `public`, `internal`, `private`, `restricted`.

## Ingestion rules

- Allowlist sources and file types.
- Treat documents and embedded instructions as untrusted content, never as tool instructions.
- Preserve original source and revision; do not silently overwrite.
- Store hashes and deduplicate identical content.
- Keep headings, pages, line spans, and URLs for citation.
- Quarantine parser failures and unsupported formats.
- Re-index on source revision change; retain enough history to explain previous answers.
- Never ingest private product data without an explicit source-level grant.

## Retrieval rules

- Apply access controls before returning chunks.
- Use hybrid retrieval: lexical + metadata + vector where available.
- Return citations with source title, revision, URI, and location.
- Distinguish source statements from generated summaries and interpretations.
- Expose confidence/coverage limitations; do not fabricate missing canon definitions.
- Allow users to flag stale, conflicting, or incorrect knowledge.

## Canon integrity

Unknown terms remain unknown until a primary source or explicit owner definition is recorded. Proposed definitions are not canonical. Contradictory sources remain visible with provenance and status rather than being silently merged.

## MVP acceptance

- Register and sync master-docs Markdown files.
- Search by keyword and metadata.
- Citation-preserving document/chunk model.
- Access classification and source allowlist.
- Semantic retrieval is enabled only after embeddings/provider configuration is verified.
- Reindex status, errors, and source revision are visible.
