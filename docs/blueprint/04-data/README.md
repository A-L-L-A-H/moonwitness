# 04 — Data

Data ownership, persistence boundaries, canonical corpus artifacts, operational state, search projections, retention, lineage, backup, and recovery.

Rules:

- Domain packages do not depend on database schemas.
- Corpus is the canonical knowledge owner.
- Operational PostgreSQL is private runtime state.
- SQLite is a supported local/read artifact where appropriate.
- Large immutable outputs use artifact storage plus manifest/checksum.
