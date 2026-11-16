# v1.0 production validation

Validation performed before promotion from `dev` to `main`.

## Local source validation

The production TypeScript source was compiled with strict NodeNext/ES2022 settings, including `noUncheckedIndexedAccess`. Result: **PASS**.

Runtime smoke checks were executed against the compiled engine for:

- engine version and result schema metadata;
- R1/G2/B3/L4 output contract;
- SOURCE / SELF / WORLD / OTHERS mapping;
- explicit `UNKNOWN` output for unsupported RGBL levels;
- completeness reporting;
- whitespace question rejection;
- confidence range validation;
- `analyzeMany()` batch behavior.

Result: **PASS**.

The expanded Vitest test source was also type-checked against the production API contract. Result: **PASS**.

The repository structural check (`node scripts/repo-check.mjs`) was exercised against the production-required paths. Result: **PASS**.

## Media integrity validation

The production media set contains exactly **37 binary assets**:

- 1 opener;
- 32 posters (8 SOURCE + 8 SELF + 8 WORLD + 8 OTHERS);
- 1 closing poster;
- 1 BGM WAV;
- 1 final MP4;
- 1 CRAYON Framework v1.9 DOCX.

SHA-256 digests were calculated for every production binary and recorded in `media/SHA256SUMS.txt`. The LFS-ready production bundle was reconstructed using the canonical repository paths and all 37 files were re-hashed against that manifest. Result: **PASS**.

`.gitattributes` tracks PNG, MP4, WAV, MOV, DOCX, PSD, and ZIP binaries with Git LFS. The strict media importer fails when a required asset is missing and stages the canonical media/research paths only after the import is complete.

## GitHub Actions environment

The configured CI workflow is valid for `dev`, pull requests to `main`, and manual dispatch. At validation time GitHub created the job but executed zero steps and reported `runner_id: 0`. Because checkout, Node setup, install, build, and test never started, this workflow result is treated as an unavailable Actions runner/account environment rather than a code-test result.

Until an Actions runner becomes available, local `npm run check` is the production release gate.

## Production invariant

A release must not weaken these rules:

1. R1 → Information.
2. G2 → Knowledge.
3. B3 → Understanding / Meaning.
4. L4 → Wisdom / Responsible Direction.
5. Unsupported levels remain explicit as `UNKNOWN`.
6. Confidence remains bounded to 0..1.
7. The Allah domain keeps observable signs, reasoning, and revelation-based theological claims distinct.
8. SIN-CAN evaluates conditions and actions without reducing a whole person to a permanent label.
9. Production media must match the checksum manifest before release.
