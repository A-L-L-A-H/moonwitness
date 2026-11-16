# First Living CRAYON

This checkpoint is the first end-to-end representation path:

`Situation -> Semantic Snapshot -> Explainable Consequence -> RIR -> Web Renderer`

## Reference situation

The initial scenario is a $14,200 transfer from `account:A` to `account:B` with a $12 fee and external settlement dependency.

The Lab deliberately renders the action as a **transition path** from present state toward a possible future, with consequences opened along the path. It is not a final visual identity and must not be treated as one.

## Invariants preserved

- prediction remains separate from observed reality;
- availability is derived from knowledge + constraints + authority;
- resistance is deterministic and explainable;
- RIR contains semantic representation primitives rather than framework/component vocabulary;
- Web rendering may change without changing the semantic snapshot or RIR meaning;
- the same RIR can be rendered as text for non-visual invariance checks.

## Developer loop

```bash
npm install
npm run verify
npm run dev:lab
```

The `verify` script typechecks the semantic packages, executes the regression/falsification tests, typechecks the Lab, and builds the Vite application.

## Current representation primitives

- Field
- Mark
- Line
- Region
- Path
- Anchor
- Portal
- Layer

## Not yet frozen

Visual styling, spatial algorithms, salience/gravity, semantic zoom, motion, final accessibility behavior, distributed execution trust, and the final public API are still experimental.
