# CRAYON Compatibility Matrix

Status: beta admission candidate for #115 / #129

CRAYON package versions and semantic document versions are separate axes. A package version never authorizes silent reinterpretation of an unknown Snapshot/RIR version.

## Current alpha line

| Public package set | Snapshot | RIR | Codec envelope | Support level |
| --- | --- | --- | --- | --- |
| `0.9.0-alpha.1` exact eight-package set | `0` | `0` | `0` | current alpha candidate |
| mixed CRAYON public package versions | any | any | any | unsupported; release-set validation rejects internal drift |
| `0.9.0-alpha.1` + unknown Snapshot version | unknown | `0` | `0` | reject explicitly |
| `0.9.0-alpha.1` + unknown RIR version | `0` | unknown | `0` | reject explicitly |
| `0.9.0-alpha.1` + unknown codec envelope | any | any | unknown | reject explicitly |
| legacy semantic data with registered complete migration to `0` | migration target `0` | migration target `0` | `0` | supported only through explicit deterministic migration |
| legacy/unknown data without migration path | unknown | unknown | any | reject; never guess |

The eight public packages are versioned together during alpha. Private experimental workspaces are not compatibility promises and are not part of the public npm matrix.

## Semantic preservation requirements

A supported load/migration must preserve, where present:

- semantic identity and orientation;
- epistemic state and provenance;
- possibility availability and constraints;
- authority requirements;
- consequence and resistance;
- temporal prediction/observation/reconciliation distinctions;
- witness/retry history.

Migration may not manufacture authority, evidence, verification, or certainty. Lossy migration must identify loss and may not claim semantic equivalence.

## Fixture evidence

`fixtures/compatibility/` and `tests/compatibility-corpus.test.mjs` are the executable reference corpus. Release verification must prove both sides:

1. supported v0 fixtures remain readable without semantic reinterpretation;
2. unsupported versions and missing migration paths fail with stable explicit reason codes.

## Beta promise

Alpha may still add APIs and reason codes, but it may not silently repurpose existing semantic meaning. Once a beta release is admitted:

- a documented supported semantic version remains readable for the advertised beta support window;
- breaking semantic meaning requires a new semantic version and migration/rejection policy;
- public API removal follows `docs/DEPRECATION-POLICY.md`;
- package dependency direction remains frozen unless a versioned architecture migration is documented.

This matrix is a promise only after the corresponding main release gate is green and the release evidence names the exact source SHA.