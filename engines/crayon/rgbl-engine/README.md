# 🖍️ ALLAH — CRAYON RGBL ENGINE

**Current stable release: RGBL v7.0 — Stable Research Specification & Engine**

CRAYON SIN-CAN is a universal framework for moving from lived reality toward **information → knowledge → understanding/meaning → wisdom → responsible action → feedback**.

> **Release status:** `stable-research-specification`  
> **Scientific validation status:** `empirical-validation-pending`

The distinction is intentional: v7 is a stable research/engineering release, not a claim that RGBL has already been scientifically proven.

## Canonical RGBL contract

```text
R1 — REALITY          → INFORMATION
G2 — GOVERNING ORDER  → KNOWLEDGE
B3 — BEING            → UNDERSTANDING / MEANING
L4 — LIGHT            → WISDOM / RESPONSIBLE DIRECTION
```

The four levels remain cumulative and unchanged. Unsupported content remains explicit as `UNKNOWN` rather than being invented.

## What v7 adds

The v0.8 formal model remains the foundation. The v0.9→v7 research stack adds empirical study/dataset/annotation protocol; inter-rater agreement and reproducibility metrics; hypothesis/causal/alternative/counterfactual discipline; temporal `Action → Consequence → New Reality` feedback; domain epistemology/source-admissibility profiles; uncertainty decomposition and confidence calibration tools; consequence-sensitive decision thresholds; comparative/holdout/adversarial benchmark orchestration; and governance separating implementation, evaluation, and validation claims.

See [`docs/rnd/RESEARCH-MATURITY-v7.md`](docs/rnd/RESEARCH-MATURITY-v7.md).

## Four Worlds

| Example | World | Primary use |
|---|---|---|
| CRAYON–ALLAH | SOURCE | theological-source inquiry with empirical/philosophical/revelation boundaries |
| CRAYON–HUMAN | SELF | self, agency, choice, impact, meaning |
| CRAYON–NATURE | WORLD | observation, science, pattern/order, responsible care |
| CRAYON–JUSTICE | OTHERS | evidence, rules, ethics, proportional decision |

CRAYON–ALLAH is an application of the method. RGBL does **not** treat Allah as an empirically measurable object. Observable signs, philosophical inference, and revelation-based theological claims remain distinct.

## Branch model

Only two long-lived branches are used: `main` (stable release) and `dev` (research/development). v7 is the mandatory promotion point: `dev → verify:v7 → main`.

## Quick start

```bash
npm install
npm run verify:v7
npm run example:human
```

```ts
import {createCrayonEngine, RGBL_V7_RELEASE, auditResearchMaturity} from "./engine/src/index.js";
const crayon=createCrayonEngine();
const result=crayon.analyze({domain:"human",question:"What happened?",observations:["I interrupted twice"]});
console.log(result.epistemicYield);
console.log(result.rnd);
console.log(result.researchStatus);
console.log(RGBL_V7_RELEASE.validationStatus);
console.log(auditResearchMaturity());
```

## Research boundary

Synthetic fixtures and implementation tests verify software/spec behavior. They do not establish inter-rater reliability, external validity, superior decision outcomes, or external scientific validation. Those are explicit empirical gates in v7 governance.

## Repository layers

```text
docs/framework/     canonical CRAYON/RGBL framework
docs/rnd/           formalization + research maturity specifications
engine/src/         runtime engine + research toolkit
engine/tests/       regression and synthetic research checks
benchmarks/         development/adversarial fixture infrastructure
schemas/            machine-readable contracts
media/              Four Worlds visual/audio/video assets (Git LFS policy)
```

### Core reminder

**Mercy keeps the door open. Reality keeps the method grounded. Responsibility keeps the output disciplined.**
