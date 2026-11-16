# CRAYON Visual Regression Policy

Status: production-hardening work for #127

CRAYON visual regression is not a screenshot beauty test. It protects two independent things:

1. **semantic representation evidence** — truth/availability/resistance/witness metadata carried by the real rendered DOM;
2. **visual/layout evidence** — the pixels and geometry produced by the verified build.

A semantic regression and a pixel/layout regression are reported separately because a visually similar screen can still lose meaning, while a harmless visual refinement can change pixels without changing semantics.

## Matrix

The main verification workflow captures the real production Lab across:

- Banking, File, Email, ERP, Deploy, and AI;
- Dark Flagship and Light Companion;
- compact, standard, and expanded semantic detail;
- desktop and mobile viewports.

Each filename encodes scenario, theme, detail, and viewport.

## Manifest

`artifacts/ui-matrix/manifest.json` records for every capture:

- exact source SHA;
- screenshot SHA-256;
- semantic SHA-256;
- semantic refs, epistemic states, availability/resistance, witness state, and redaction markers;
- viewport/layout evidence;
- clipping/overflow issues.

Concept/showcase images are explicitly excluded from this system.

## Layout gate

The matrix capture rejects critical horizontal clipping or document overflow in:

- orientation strip;
- primary representation zone;
- CRAYON representation;
- consequence field;
- witness history.

Intentional scroll containers such as raw Inspector data are not treated as semantic layout failure.

## Approved baseline

An approved baseline is optional during the current alpha hardening phase. Once admitted, it lives at:

`docs/visual-baselines/approved-manifest.json`

Main verification compares current captures against it and reports:

- `SEMANTIC_DRIFT` when semantic hashes change;
- `VISUAL_DRIFT` when screenshot hashes change;
- `LAYOUT_DRIFT` when geometry fails;
- `BASELINE_MISSING` / `BASELINE_ORPHAN` when the matrix changes without explicit admission.

Baseline changes are never automatic.

To approve a baseline intentionally, first obtain the matrix from a **verified main build**, then run with the exact verified SHA:

```bash
CRAYON_APPROVE_VISUAL_BASELINE=YES \
CRAYON_VERIFIED_MAIN_SHA=<verified-main-sha> \
npm run approve:visual-baseline
```

Review and commit the resulting manifest deliberately. The command refuses local-unverified captures and mismatched SHAs.

## Truthfulness rule

A green pixel comparison cannot override a semantic failure. A green semantic comparison cannot excuse clipped consequence/witness content. Both evidence classes remain independently visible.
