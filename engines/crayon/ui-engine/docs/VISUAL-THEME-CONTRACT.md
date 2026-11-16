# CRAYON Visual Theme Contract

Status: alpha visual contract

CRAYON uses one semantic representation system with two visual themes:

- **Dark Flagship** — the primary showcase and default Lab identity.
- **Light Companion** — a calm, high-legibility companion for daytime, enterprise, documentation, and print-oriented contexts.

These are not two different products and must not change semantic meaning.

## Invariants across themes

A theme may change surface, contrast, glow, line softness, elevation, and accent intensity. A theme must not change:

- epistemic state or certainty;
- possibility availability;
- consequence severity;
- resistance / commitment demand;
- authority requirements;
- witness history or temporal ordering;
- semantic zoom guarantees;
- raw semantic identifiers;
- accessibility roles / labels;
- renderer authority boundaries.

## Dark Flagship

Character: deep midnight, restrained gold, semantic cyan, witness emerald, consequence red/amber, subtle spatial depth.

Use as the default for:

- CRAYON Lab;
- repository showcase/hero imagery;
- conference/demo views;
- Visual DNA exploration.

Dark mode must remain readable without depending on glow or color alone.

## Light Companion

Character: warm ivory/pearl surfaces, graphite text, restrained gold, semantic blue/cyan, witness green, consequence red/amber.

Use for:

- daytime Lab use;
- enterprise environments;
- docs and printable material;
- users who prefer light appearance.

Light mode must not degrade resistance, uncertainty, witness, or hierarchy into generic SaaS cards.

## Runtime implementation

The Lab owns a `data-theme="dark|light"` theme selector. Theme values are expressed through CSS custom properties. The semantic packages and RIR do not know which theme is active.

The selected theme is persisted locally and defaults to Dark Flagship when no preference exists.

## Concept imagery vs real screenshots

Generated showcase images are **EXPECTATION / CONCEPT** artifacts. They are never evidence that the current Lab implementation looks exactly like the concept.

Real UI proof is produced only from an executable Lab build. Documentation must label concept imagery and real screenshots separately.

## Admission rule

No visual token becomes a stable public semantic API merely because both themes use it. Visual tokens remain renderer concerns unless repeated falsification shows they are necessary to preserve semantic meaning across contexts.
