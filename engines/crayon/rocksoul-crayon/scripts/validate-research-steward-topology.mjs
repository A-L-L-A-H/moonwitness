import fs from "node:fs";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), "utf8"));
}

const topology = readJson("../contracts/research-steward-topology.v1.json");
const issueContract = readJson("../contracts/research-issue-contract.v1.json");
const policy = readJson("../contracts/research-steward-policy.v2.json");
const signal = readJson("../contracts/research-signal.v1.json");
const handoff = readJson("../contracts/relationship-handoff.v1.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const expectedOwners = {
  STORY: "rocksoul-mftl",
  EVENT: "rocksoul-legend",
  PERSON: "rocksoul-superhero",
  TEXT: "rocksoul-rgbl",
  LAW: "rocksoul-aws",
  PERSPECTIVE: "rocksoul-jizz",
  RELATIONSHIP: "rocksoul-correlation"
};

assert(topology.mode === "BOOTSTRAP", "Steward topology must currently be BOOTSTRAP");
assert(topology.canonical_branch === "main", "Canonical branch must be main");
assert(topology.max_scheduled_slots === 5, "Maximum scheduled slots must be 5");
assert(topology.slots.length === 5, "Exactly five scheduled slots are required");

const offsets = topology.slots.map((slot) => slot.minute_offset);
assert(new Set(offsets).size === offsets.length, "Scheduled minute offsets must be unique");
assert(JSON.stringify(offsets) === JSON.stringify([0,10,20,30,40]), "Bootstrap slots must be staggered :00/:10/:20/:30/:40");
assert(topology.slots.every((slot) => slot.cadence === "HOURLY"), "All bootstrap slots must run hourly");

for (const [domain, repository] of Object.entries(expectedOwners)) {
  assert(topology.ownership?.[domain] === repository, `Owner mismatch for ${domain}`);
}

for (const slot of topology.slots.filter((slot) => slot.shared_clock)) {
  assert(slot.context_isolation === "REQUIRED", `${slot.id} must require context isolation`);
  assert(Array.isArray(slot.passes) && slot.passes.length === 2, `${slot.id} must have two isolated passes`);
}

assert(topology.relationship_layer.domain === "RELATIONSHIP", "Relationship layer domain mismatch");
assert(topology.relationship_layer.repository === "rocksoul-correlation", "Correlation must own RELATIONSHIP");
assert(topology.relationship_layer.scheduled_slot === false, "Correlation must not consume a scheduled intelligence slot");
assert(topology.relationship_layer.mode === "EVENT_DRIVEN_REVIEW", "Correlation must remain event-driven");
assert(topology.research_issue_contract?.issue_first_required === true, "Issue-first research gate must be required");
assert(issueContract.schema_version === "rocksoul.research-issue.v1", "Research issue contract version mismatch");
assert(issueContract.principle === "ISSUE FIRST. SOURCE SECOND. CANON LAST.", "Research issue principle drift");
assert(issueContract.lifecycle[0] === "discovered", "Issue lifecycle must start discovered");
assert(issueContract.lifecycle.includes("source_inspected"), "Issue lifecycle must include source_inspected");
assert(issueContract.lifecycle.includes("ready_for_observation"), "Issue lifecycle must include ready_for_observation");
assert(issueContract.lifecycle.includes("merged"), "Issue lifecycle must include merged");
assert(issueContract.lifecycle.includes("duplicate"), "Issue lifecycle must include duplicate terminal state");
assert(issueContract.state_mapping?.["steward_decision:stage_candidate"] === "needs_sources", "stage_candidate must map to needs_sources");
assert(issueContract.state_mapping?.["steward_decision:needs_sources"] === "needs_sources", "needs_sources mapping drift");
assert(issueContract.state_mapping?.["steward_decision:hold"] === "triaged", "hold must map to triaged");
assert(issueContract.state_mapping?.["steward_decision:duplicate"] === "duplicate", "duplicate mapping drift");
for (const [domain, repository] of Object.entries(expectedOwners)) {
  assert(issueContract.domains?.[domain]?.repository === repository, `Issue owner mismatch for ${domain}`);
  assert(issueContract.domains?.[domain]?.hero?.includes("rocksoul-assets/main/"), `Missing canonical hero image for ${domain}`);
}
for (const section of ["research_card","research_question","source_candidates","counterevidence_uncertainty","steward_gate","machine_metadata"]) {
  assert(issueContract.required_sections.includes(section), `Missing required issue section: ${section}`);
}

const expectedDecisionOrder = [
  "HEALTH",
  "BACKLOG",
  "BLOCKERS",
  "PROGRESSION",
  "CANDIDATE_STAGING",
  "CONVERGENCE",
  "RELATIONSHIP_HANDOFF",
  "DISCOVERY",
  "VALIDATION",
  "SIGNAL"
];
assert(policy.schema_version === "rocksoul.research-steward-policy.v2", "Scheduler V2 policy version mismatch");
assert(policy.principles?.progression_before_discovery === true, "Progression must precede discovery");
assert(policy.principles?.hourly_does_not_force_discovery === true, "Hourly execution must allow NO_UPDATE");
assert(policy.principles?.domain_owners_do_not_mint_relationship_edges === true, "Producer domains must not mint relationship edges");
assert(policy.principles?.correlation_is_event_driven === true, "Correlation must remain event driven in V2 policy");
assert(JSON.stringify(policy.decision_order) === JSON.stringify(expectedDecisionOrder), "Scheduler V2 decision order drift");
for (const state of policy.actionable_lifecycle_states) {
  assert(issueContract.lifecycle.includes(state), `V2 actionable lifecycle state is not in V1 contract: ${state}`);
}
for (const slotId of ["story-history-bootstrap", "attestation-bootstrap"]) {
  const protocol = policy.shared_slot_context_protocol?.[slotId];
  assert(Array.isArray(protocol) && protocol.length === 3, `${slotId} must be RUN/RESET/RUN`);
  assert(protocol[0]?.operation === "RUN_DOMAIN_PASS", `${slotId} first operation must run a domain pass`);
  assert(protocol[1]?.operation === "RESET_CONTEXT", `${slotId} must explicitly reset context between passes`);
  assert(protocol[2]?.operation === "RUN_DOMAIN_PASS", `${slotId} final operation must run a domain pass`);
}
assert(policy.shared_slot_context_protocol["story-history-bootstrap"][0].domain === "STORY", "Story/history slot must run STORY first");
assert(policy.shared_slot_context_protocol["story-history-bootstrap"][2].domain === "EVENT", "Story/history slot must run EVENT after reset");
assert(policy.shared_slot_context_protocol["attestation-bootstrap"][0].domain === "TEXT", "Attestation slot must run TEXT first");
assert(policy.shared_slot_context_protocol["attestation-bootstrap"][2].domain === "PERSON", "Attestation slot must run PERSON after reset");
assert(policy.wip_backpressure?.configurable === true, "WIP backpressure must be configurable");
assert(policy.wip_backpressure?.defaults?.soft_actionable_limit < policy.wip_backpressure?.defaults?.hard_actionable_limit, "WIP soft limit must be below hard limit");
assert(policy.rps_v1?.name === "RPS_V1", "RPS_V1 definition missing");
assert(policy.rps_v1?.formula?.includes("progression_value"), "RPS_V1 must explain progression contribution");
assert(policy.rps_v1?.formula?.includes("diversity_redundancy_penalty"), "RPS_V1 must include diversity penalty");
assert(policy.diversity_governor?.rules?.includes("ARTICLE_COUNT_IS_NOT_CONSENSUS"), "Diversity governor must reject article-count consensus");
assert(policy.diversity_governor?.rules?.includes("REPEATED_SIMILAR_SOURCES_ARE_NOT_DIVERSITY"), "Diversity governor must reject repeated-source pseudo-diversity");
assert(policy.relationship_handoff?.producer_may_create_canonical_edge === false, "V2 producer must not mint canonical relationship edge");
assert(policy.relationship_handoff?.reviewer_repository === "rocksoul-correlation", "V2 handoff reviewer must be Correlation");
assert(policy.relationship_handoff?.review_mode === "EVENT_DRIVEN_REVIEW", "V2 handoff review must remain event driven");

const requiredSignalFields = [
  "run_id", "timestamp", "slot", "action", "domain", "repository", "headline", "why_it_matters",
  "evidence_gain", "cross_domain_value", "novelty", "lifecycle_before", "lifecycle_after",
  "related_domains", "relationship_handoff", "next_gate", "evidence"
];
assert(signal.$id === "rocksoul.research-signal.v1", "Research Signal schema id mismatch");
for (const field of requiredSignalFields) assert(signal.required?.includes(field), `Research Signal missing field: ${field}`);
for (const action of policy.allowed_terminal_run_outcomes) {
  assert(signal.properties?.action?.enum?.includes(action), `Research Signal missing allowed action: ${action}`);
}

const requiredHandoffFields = [
  "schema_version", "handoff_id", "created_at", "origin_domain", "origin_repository", "origin_issue",
  "source_ref", "target_ref", "proposed_relation_type", "support", "counterevidence", "alternative_relations",
  "confidence", "freshness_state", "review_status"
];
assert(handoff.$id === "rocksoul.relationship-handoff.v1", "Relationship Handoff schema id mismatch");
for (const field of requiredHandoffFields) assert(handoff.required?.includes(field), `Relationship Handoff missing field: ${field}`);
assert(handoff["x-rocksoul-invariants"]?.producer_may_create_canonical_edge === false, "Handoff producer must not create canonical edge");
assert(handoff["x-rocksoul-invariants"]?.similarity_alone_is_sufficient === false, "Similarity alone must not establish a relationship");
assert(handoff["x-rocksoul-invariants"]?.reviewer_repository === "rocksoul-correlation", "Handoff reviewer must be Correlation");
assert(handoff["x-rocksoul-invariants"]?.review_mode === "EVENT_DRIVEN_REVIEW", "Handoff review must be event driven");

console.log("ROCKSOUL Steward topology valid: V1 invariants preserved; V2 progression, WIP, RPS_V1, diversity, reset protocol, Research Signal, and event-driven relationship handoff validated.");
