# Final Cross-check — v2.1.0

## Versioning

- Release: **2.1.0**
- Data schema: **2.0**
- API major: **v2**
- Change type: **non-breaking documentation/structure release**

## Verification

- Strict TypeScript typecheck: **PASS**
- Automated tests: **38/38 PASS**
- Dataset validation: **PASS**
- Validation errors: **0**
- Validation warnings: **0**
- HTTP API smoke test: **PASS**
- Python files: **0**

## Research counts

- Prophet profiles: **25**
- Positive RID: **25/25**
- Graph edges: **74**
- ASMA edges: **37**
- Provenance claims: **399**
- Event nodes: **200**
- Genealogy relations: **8**
- Conflict cases: **3**
- Approved corpus sources: **4**
- Human preference: **UNCALIBRATED**

## Documentation & structure

- Documentation files: **42**
- Registered normative documents: **35**
- TypeScript source/test files: **94**
- Total repository files: **342**

Structured docs:

- `docs/architecture/` + ADR
- `docs/corpus/` + Qur'an/Taurat/Zabur/Injil + Bible witness
- `docs/research/`
- `docs/scoring/`
- `docs/api/`
- `docs/project/` + CHANGELOG/TODO/ROADMAP

## Guardrails retained

- Bible is not source #5.
- TODO is not evidence.
- Release version and schema version are separate.
- Scores are evidence/research indices, not prophetic-worth rankings.
- Unknown remains unknown rather than guessed.
