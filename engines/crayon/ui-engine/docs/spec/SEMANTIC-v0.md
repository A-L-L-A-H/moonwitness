# CRAYON Semantic Specification v0

Status: pre-stable normative alpha specification.

The words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are normative requirements for CRAYON-compatible implementations.

## 1. Reality and observation

CRAYON does not claim direct access to reality. A system MUST distinguish external reality from observations about it.

An Observation MUST identify a subject, property, time, source, and reliability context. Missing observation value MUST NOT be interpreted as a false or zero value.

## 2. Knowledge and epistemic state

Knowledge MUST expose its epistemic state. Supported v0 states are fact, derived, estimate, claim, uncertain, conflicted, and unknown.

Conflicting trustworthy observations MUST remain conflicted until an explainable reconciliation establishes another state. Stale observation MUST NOT silently become current truth.

## 3. Situation and orientation

A Situation is the bounded semantic context presented to a human or machine. It MUST identify an anchor and preserve enough entity/relation context to answer where/what the user is dealing with.

Renderer-specific layout is not part of Situation semantics.

## 4. Possibility and constraints

A Possibility expresses a real semantic action that might be available. Availability MUST be derived from current constraints and authority; caller-provided availability flags MUST NOT be trusted.

Unknown constraint or authority state MUST NOT become implicit allow.

Actionable possibilities require `intend` authority unless an explicit future specification revises this rule.

## 5. Intent, commitment, and authority

Proposal, Intent, Commitment, and execution are distinct states.

Agent intelligence MUST NOT imply authority. Capabilities observe, propose, intend, commit, execute, verify, and override are independent. Deny MUST override matching allow. Override MUST be explicit and scoped.

A renderer MUST NOT grant authority merely by rendering an action.

## 6. Consequence and commitment resistance

Consequence MUST be evaluated before commitment. Risk, impact, reversibility, uncertainty, external dependency, and relevant policy MAY contribute to resistance.

High-impact, low-reversibility, or materially uncertain changes MUST NOT be silently downgraded to a low-resistance commitment path because a caller supplied a low risk number.

Unknown consequence MUST NOT be interpreted as safe consequence.

## 7. Transition and execution

Transition prediction is not observed truth. A raw Transition MUST NOT cross the execution boundary.

Execution MUST require a validated request bound to transition identity, possibility identity, consequence, commitment identity, committer authority, executor authority, and current-world readiness.

The world MUST be revalidated immediately before execution begins. A stale permit MUST NOT later become valid because the state returned to a prior value. An execution permit is one-shot.

Execution output MUST be observations/evidence, not a trusted `success=true` claim.

## 8. Witness and reconciliation

Every meaningful committed change SHOULD leave a Witness. Witness verification MUST be derived from evidence coverage and agreement.

A historical Witness and its prediction MUST be immutable. Later evidence MUST create reconciliation/temporal records rather than rewriting history.

Retry of an ambiguous external outcome MUST be blocked while duplicate or contradictory effects remain plausible. The semantic reason and required reconciliation action MUST remain representable.

## 9. Temporal record v0

A TemporalRecord separates:

1. prediction;
2. observations;
3. reconciliations;
4. historical witness state;
5. retry/reconciliation assessment.

Temporal identity and timestamps MUST survive renderer changes. Prediction and observation MUST remain separately addressable even when they eventually agree.

## 10. Representation Intermediate Representation v0

RIR v0 kinds are:

- Field — semantic representation field;
- Mark — semantic fact/state/effect/future/temporal mark;
- Line — semantic relation;
- Region — semantic grouping/context/consequence/evidence/history;
- Path — semantic possibility trajectory;
- Anchor — current orientation subject;
- Portal — related semantic context;
- Layer — semantic present/future/context/history layer.

RIR MUST NOT encode framework/component vocabulary such as React component names, buttons, modals, CSS layout instructions, hover state, pixels, or platform-specific event handlers.

RIR Path SHOULD retain semantic constraint identifiers and authority capability requirements so non-Web renderers do not lose actionability rules.

## 11. Representation physics v0

Implemented explainable signals are Gravity, Distance, Depth, Trace, Disclosure, Continuity, and Momentum.

Physics signals MUST be deterministic for the same semantic input and MUST expose explanations. They describe semantic representation demand, not visual styling instructions.

## 12. Renderer invariance

Web, Text, Agent, Voice, or future renderers MAY vary presentation but MUST preserve critical semantic claims:

- orientation;
- epistemic truth/certainty;
- possibility availability;
- constraints and authority requirements where actionability is exposed;
- material consequence/resistance;
- unresolved/conflicted outcome;
- witness/reconciliation/retry state.

A renderer MUST NOT create intent, commitment, authority, verification, or evidence merely by presentation.

## 13. Versioning

Semantic Snapshot v0 and RIR v0 carry `version: "0"`.

Consumers MUST explicitly reject unsupported semantic versions. They MUST NOT silently reinterpret an unknown version under current semantics.

Breaking changes to the meaning of a v0 field require either a new version or an explicit migration with documented preservation/loss rules.

## 14. Explainability

Every derived availability, authority decision, reconciliation result, resistance, and implemented representation-physics score MUST be explainable by deterministic reasons sufficient to inspect why the result occurred.

## 15. Human authority

The system MUST keep human authority and system limits explicit. Representation may help understanding; it MUST NOT conceal uncertainty, fabricate confidence, or imply an action occurred before evidence establishes the outcome.
