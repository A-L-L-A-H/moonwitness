# CRAYON Design Token Admission Criteria

Design tokens are downstream representation constants. They must never become semantic truth.

## May become stable tokens later

A value may be considered for a stable design token only when:

- it is renderer-specific rather than semantic;
- changing it cannot alter possibility availability, authority, consequence, certainty, witness, or physics scores;
- it survives cross-domain representation experiments;
- accessibility constraints are documented;
- it has demonstrated stability across multiple releases rather than one visual fashion cycle.

Examples that may eventually qualify: typographic scale ratios, baseline spacing primitives, line thickness ranges, focus affordance geometry, motion duration ceilings, neutral surface primitives.

## Must remain derived runtime signals

The following must not be frozen as visual tokens:

- gravity;
- semantic distance;
- depth/disclosure demand;
- trace demand;
- continuity;
- momentum;
- commitment resistance;
- certainty/epistemic state;
- authority or action availability;
- consequence severity/impact.

A renderer may map these semantic signals into modality-specific representation, but the signal remains upstream and explainable.

## Admission gate

Before introducing a stable token API, CRAYON must have:

1. cross-domain calibration evidence;
2. Web/Text/Agent/Voice invariance for critical semantics;
3. accessibility behavior under semantic zoom and uncertainty;
4. a representation experiment audit/rubric;
5. public API review showing tokens do not leak into kernel/RIR semantics;
6. migration guidance for visual-only changes.

Until those gates are met, renderer CSS values are implementation details, not CRAYON semantic contracts.
