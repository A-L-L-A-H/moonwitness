# CRAYON Reason-Code Reference

Status: alpha/experimental developer reference

Reason codes exist so applications, Inspector tooling, tests, and adapters can react to semantic decisions without parsing human-readable messages. Codes describe **why CRAYON reached a state**; they do not grant authority and do not replace the underlying evidence.

## Kernel — reconciliation

| Code | Meaning | Typical remediation |
| --- | --- | --- |
| `NO_OBSERVATION` | No usable observation exists for the requested fact. | Observe/reconcile before claiming current truth. |
| `NO_VALUE` | Observation exists but has no usable value. | Treat as unknown and obtain stronger evidence. |
| `SOURCE_AGREEMENT` | Relevant sources agree. | Preserve cited provenance; certainty still follows source quality/freshness. |
| `SOURCE_DISAGREEMENT` | Relevant sources conflict. | Keep state conflicted; investigate rather than selecting a convenient value. |
| `STALE_OBSERVATION` | Observation is outside its validity window. | Re-observe before action that requires current truth. |
| `LOW_RELIABILITY` | Source reliability is below the accepted threshold. | Seek stronger source/evidence or retain uncertainty. |

## Kernel — constraints

| Code | Meaning | Typical remediation |
| --- | --- | --- |
| `CONSTRAINT_SATISFIED` | Current accepted knowledge satisfies the constraint. | No action required. |
| `MISSING_KNOWLEDGE` | Required knowledge key is absent. | Observe/derive the missing knowledge. |
| `EPISTEMIC_STATE_NOT_ACCEPTED` | A value exists but its certainty/state is not acceptable for this constraint. | Obtain evidence strong enough for an accepted epistemic state. |
| `MISSING_VALUE` | Knowledge exists without a usable value. | Keep action unknown/unavailable until value is established. |
| `INVALID_EXPECTED_VALUE` | Constraint configuration is malformed. | Fix adapter/domain configuration. |
| `VALUE_MISMATCH` | Current value does not satisfy expected value/operator. | Do not bypass; change reality or choose another possibility. |
| `TYPE_MISMATCH` | Comparison cannot be performed safely across the supplied types. | Normalize domain data explicitly. |

## Kernel — authority

| Code | Meaning | Typical remediation |
| --- | --- | --- |
| `EXPLICIT_ALLOW` | A matching allow rule authorizes the requested capability/scope. | Continue only within that exact scope. |
| `EXPLICIT_DENY` | A matching rule denies the capability/scope. | Do not execute; require policy/authority change. |
| `DENY_OVERRIDES_ALLOW` | Both allow and deny matched; deny wins. | Resolve policy conflict rather than selecting allow. |
| `NO_MATCHING_RULE` | CRAYON has no rule proving authority. | Treat authority as unknown, never implicit allow. |

## Kernel — possibility

| Code | Meaning | Typical remediation |
| --- | --- | --- |
| `CONSTRAINT_FAILED` | One or more preconditions are known false. | Change state or choose another possibility. |
| `CONSTRAINT_UNKNOWN` | Preconditions cannot yet be established. | Observe/derive required knowledge. |
| `AUTHORITY_DENIED` | Required capability is explicitly denied. | Do not commit/execute. |
| `AUTHORITY_UNKNOWN` | Required capability has no proven allow. | Obtain explicit authority; unknown is not allow. |

## Kernel — execution gate

`TRANSITION_STALE`, `TRANSITION_POSSIBILITY_MISMATCH`, `POSSIBILITY_UNAVAILABLE`, `POSSIBILITY_UNKNOWN`, `COMMIT_AUTHORITY_DENIED`, `COMMIT_AUTHORITY_UNKNOWN`, `EXECUTE_AUTHORITY_DENIED`, `EXECUTE_AUTHORITY_UNKNOWN`, `INVALID_COMMITMENT_RECORD`, `COMMITMENT_ACTOR_MISMATCH`, and `COMMITMENT_TRANSITION_MISMATCH` all mean the execution request is **not** valid for side effects. Remediation is to re-observe/re-simulate, correct identity binding, or obtain explicit authority as indicated; never bypass the gate.

## Kernel — retry safety

| Code | Meaning | Typical remediation |
| --- | --- | --- |
| `OUTCOME_UNRESOLVED` | Prior external outcome is not established. | Reconcile before retry to avoid duplicate side effects. |
| `OUTCOME_CONFLICTED` | Evidence about the prior outcome conflicts. | Investigate/reconcile before any retry. |
| `OUTCOME_VERIFIED` | Prior outcome is already verified. | Do not retry the same operation. |

## Experimental TemporalStore / external operation

`INVALID_RECORD` rejects incomplete TemporalRecords. `DUPLICATE_RECORD_ID`, `INCOMPLETE_ENTRY`, and `SEQUENCE_MISMATCH` protect append-only journal identity/order.

External-operation registry codes:

- `INVALID_OPERATION_IDENTITY` — operation/idempotency/transition/intent identity or timestamp is malformed;
- `OPERATION_ID_CONFLICT` — stable operation ID is being rebound;
- `IDEMPOTENCY_KEY_CONFLICT` — idempotency key belongs to another semantic operation;
- `OPERATION_NOT_FOUND` — durable operation identity is absent;
- `OPERATION_ALREADY_DISPATCHED` — another dispatch is unsafe without reconciliation;
- `TEMPORAL_IDENTITY_MISMATCH` — temporal evidence does not belong to the operation.

## Experimental Domain Adapter

`INVALID_ADAPTER_ID`, `INVALID_CONTEXT_TIME`, `ADAPTER_EXCEPTION`, `INVALID_SITUATION_ID`, `INVALID_SITUATION_TIME`, `ANCHOR_ENTITY_MISSING`, `DUPLICATE_ENTITY_ID`, `DANGLING_RELATION`, `INVALID_OBSERVATION_TIME`, `MISSING_OBSERVATION_SOURCE`, `INVALID_RELIABILITY`, and `FACT_WITHOUT_PROVENANCE` describe adapter normalization/conformance failures. They never represent a domain outcome.

## Observation ingestion

- `INVALID_OBSERVATION_ID`, `INVALID_SUBJECT_ID`, `INVALID_PROPERTY` — structural observation identity is malformed;
- `INVALID_OBSERVED_AT`, `OBSERVED_AT_IN_FUTURE`, `INVALID_VALID_UNTIL`, `VALID_UNTIL_BEFORE_OBSERVED_AT` — temporal provenance is invalid;
- `MISSING_SOURCE` — source provenance is absent;
- `INVALID_RELIABILITY`, `LOW_RELIABILITY` — reliability metadata fails policy;
- `MISSING_EVIDENCE`, `INVALID_EVIDENCE_ID`, `DUPLICATE_EVIDENCE_ID`, `MISSING_EVIDENCE_SOURCE`, `INVALID_EVIDENCE_TIME`, `EVIDENCE_TIME_IN_FUTURE` — evidence provenance is insufficient or malformed.

Ingestion rejection is not proof the underlying real-world claim is false; it means CRAYON cannot safely admit that observation under the current policy.

## Connector delivery

- `INVALID_DELIVERY_ID`, `INVALID_CONNECTOR_ID`, `INVALID_RECEIVED_AT` — transport envelope is malformed;
- `DUPLICATE_DELIVERY` — delivery identity was already accepted;
- `CURSOR_REGRESSION` — connector cursor moved behind accepted progress;
- `OBSERVATION_REJECTED` — transport delivery arrived but contained Observation failed semantic ingestion policy.

## Canonical codec / migration

Envelope/version reasons:

- `INVALID_JSON`, `ENVELOPE_NOT_OBJECT`, `UNSUPPORTED_ENVELOPE_VERSION`, `UNSUPPORTED_ARTIFACT_KIND`, `KIND_MISMATCH` — serialization envelope cannot be trusted;
- `SEMANTIC_VERSION_MISMATCH`, `UNSUPPORTED_SEMANTIC_VERSION` — declared/payload semantic version is unsupported or inconsistent.

Canonical-value/resource reasons:

- `UNSUPPORTED_CANONICAL_VALUE` — value type cannot be represented by the canonical codec without changing meaning;
- `CYCLIC_CANONICAL_VALUE` — cyclic input is rejected rather than truncated or silently rewritten;
- `INVALID_CANONICAL_NODE` — decoded canonical node shape is malformed;
- `PAYLOAD_TOO_LARGE` — encoded payload exceeds the configured byte budget;
- `PAYLOAD_TOO_DEEP` — nesting exceeds the configured depth budget;
- `COLLECTION_TOO_LARGE` — array/collection exceeds the configured element budget;
- `OBJECT_TOO_LARGE` — object exceeds the configured property budget.

Migration reasons:

- `MIGRATION_PATH_MISSING` — no explicit deterministic migration route exists;
- `MIGRATION_OUTPUT_INVALID` — migration output failed target validation.

No codec reason permits silent reinterpretation. Resource-limit rejection is a system safety decision, not a claim about the truth of the represented domain state.

## Renderer conformance

- `MISSING_CLAIM` — a required semantic claim disappeared in the renderer projection;
- `VALUE_MISMATCH` — renderer changed the value/kind of a required claim;
- `UNEXPECTED_AUTHORITY_GRANT` — renderer claimed authority it cannot possess.

## Safe Web RIR input

- `INVALID_DOCUMENT`, `UNSUPPORTED_VERSION`, `MISSING_SITUATION_ID`, `MISSING_ROOT`, `MISSING_NODES`, `ROOT_NODE_MISSING` — Web input is not safely renderable. The UI must show a **system limitation**, not a domain success/failure claim.

## Compensation planning

- `INVALID_COMPENSATION_ID` — corrective action has no stable identity;
- `MISSING_ORIGINAL_EFFECTS` — no original effect is available to relate the correction to;
- `CORRECTIVE_POSSIBILITY_REUSES_ORIGINAL` — attempted to disguise retry/history rewrite as compensation;
- `MISSING_RATIONALE` — corrective action lacks explicit rationale.

Compensation is always a newly assessed possibility, never deletion/rewrite of prior witness history.

## Stability policy

Kernel codes already used by public APIs are compatibility candidates but remain alpha until beta policy #116 is accepted. Private store/adapter/runtime/codec/conformance codes remain experimental until their packages are admitted.

`scripts/verify-reason-codes.mjs` extracts exported `*Reason*` / `*ErrorCode*` unions from production-boundary source files and fails verification when a source-defined code is absent from this document. Human explanations may evolve; callers should branch on stable codes only after the corresponding API reaches its declared stability tier.
