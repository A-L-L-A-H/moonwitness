# CRAYON Public API Review — alpha freeze candidates

The public npm surface is intentionally package-oriented. Internal source paths are not API.

## `allah-crayon-kernel`

Freeze candidates:
- semantic model types;
- reconciliation APIs;
- authority evaluation;
- deterministic constraint/possibility assessment;
- transition simulation/readiness;
- commitment record / execution gate / one-shot ExecutionLease;
- witness/retry reconciliation;
- TemporalRecord creation.

Still alpha-flexible: detailed reason-code expansion and policy extension points. Existing reason meaning must not be silently repurposed.

## `allah-crayon-physics`

Freeze candidates:
- consequence profile/explanation result shape;
- gravity, distance, depth, trace, disclosure, continuity, momentum as deterministic explainable semantic signals.

Still alpha-flexible: calibration weights. Changes require regression evidence and CHANGELOG notes.

## `allah-crayon-snapshot`

Freeze candidates:
- `createSemanticSnapshot`;
- `diffSemanticSnapshots`;
- Snapshot v0 semantic buckets and temporal history;
- explicit version guard.

## `allah-crayon-rir`

Freeze candidates:
- RIR v0 grammar;
- `planSituationRepresentation`;
- `renderRIRAsText`;
- semantic traversal/detail projection;
- explicit RIR version guard.

RIR is semantic, never a public component-tree API.

## `allah-crayon-inspector`

Freeze candidates:
- representation inspection;
- path inspection;
- temporal history inspection.

Inspector explanations are diagnostic output. Consumers should not parse human explanation sentences as stable machine codes.

## `allah-crayon-agent`

Freeze candidate:
- deterministic machine-readable representation containing orientation, epistemic knowledge, possibilities, semantic requirements, consequence, history, and explicit `rendererGrantsAuthority: false`.

## `allah-crayon-voice`

Freeze candidate:
- deterministic voice representation generated from RIR rather than Web labels.

Exact prose wording remains alpha-flexible; critical semantic inclusion is invariant.

## `allah-crayon-react`

Freeze candidates:
- `RIRView`;
- semantic detail levels;
- `deriveCommitmentInteraction`.

CSS class names and visual styling remain alpha-flexible unless later promoted to stable tokens.

## Dependency direction

`kernel` ← `physics` ← semantic consumers. `snapshot` consumes kernel/physics. `rir` consumes kernel/physics/snapshot. Inspector and renderers consume RIR/Snapshot as required. No renderer may become a dependency of kernel, physics, snapshot, RIR, or another semantic core package.

## Import rule

Consumers should import only package entry points. Imports from repository `src/`, `dist/packages/...`, Lab fixtures, or monorepo-relative paths are unsupported.
