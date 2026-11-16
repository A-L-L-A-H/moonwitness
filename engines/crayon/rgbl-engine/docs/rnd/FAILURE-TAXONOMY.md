# RGBL Failure and Overreach Taxonomy

Failure codes are **quality diagnostics**, not automatic verdicts that a proposition is false. The v0.8 engine automatically detects only structurally supportable risks; other taxonomy entries remain research targets until a defensible detector exists.

## R1 failures — Reality contamination

### R_SOURCE_CONFUSION
A report, inference, or interpretation is presented as if directly observed.

### R_MISSING_CONTEXT
A record omits time, scope, comparison, or contextual information necessary for its intended use.

Example:

```text
Observed: "Three messages were not answered."
Overreach: "They hate me."
```

The second statement is not R1.

## G2 failures — Pattern/model overreach

### G_WITHOUT_R
Pattern/model claim with no recorded R1 support.

### G_PATTERN_JUMP
Repeated/general language is proposed from support too sparse for that level of generalization.

### G_CAUSAL_OVERREACH
Causation is asserted when the record establishes only association or sequence. v0.8 can flag a causal hypothesis when its support is sparse or untraced, but this remains a risk signal rather than an automatic causal verdict.

## B3 failures — Interpretation/projection

### B_WITHOUT_G
Meaning/agency/impact claim lacks an explicit pattern/interpretive bridge.

### B_PROJECTION_RISK
Internal intention/experience is inferred without adequate testimony or evidence. v0.8 can flag intention claims lacking testimonial/mixed provenance.

### B_IDENTITY_REDUCTION_RISK
A whole person/entity is reduced to one state, act, failure, or success.

## L4 failures — Wisdom leap

### L_WITHOUT_B / L_PREMATURE_CONCLUSION
A decision is produced before meaning, impact, stakeholders, or responsibility are examined.

### L_FALSE_CERTAINTY
Direction is presented with greater certainty than the support justifies. v0.8 can compare claim confidence with current L4 confidence when both are available.

### L_DISPROPORTIONATE_ACTION_RISK
Action magnitude/risk exceeds current confidence or evidence.

### LOW_CONFIDENCE_ACTION
A next action exists while L4 confidence is low; this is a prompt to consider reversibility and information gathering.

## Cross-level failures

### UNSUPPORTED_TRANSITION
A level advances without its required support chain.

### EVIDENCE_ERASURE
A later interpretation silently discards material R1 evidence.

### CONTRADICTION_SUPPRESSION
A conclusion proceeds as if an unresolved conflict does not exist.

### SOURCELESS_DERIVED_CLAIM
A derived claim has no dependency or source link.

### DUPLICATE_CLAIM_ID
Provenance graph contains non-unique claim IDs.

### LEVEL_BOUNDARY_MISMATCH
A claim type is placed outside its default RGBL admissibility level without a documented domain-specific exception.

### THEOLOGY_PROVENANCE_BOUNDARY
An Allah-domain theological claim is not distinguished from empirical/philosophical provenance.

## Detection principle

The engine should prefer:

```text
"possible overreach / incomplete support"
```

over:

```text
"this statement is definitely false"
```

unless falsity is independently established by the evidence itself.
