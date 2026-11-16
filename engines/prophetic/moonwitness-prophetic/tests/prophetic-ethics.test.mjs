import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as publicApi from "../dist/index.js";
import {
  evaluatePropheticEthics,
  normalizeReligiousSubject,
  POLICY_SIGNALS,
  PROPHETIC_ETHICS_PROFILES,
  PROPHETIC_ETHICS_PROFILE_VERSION,
  RUNTIME_ROLES,
} from "../dist/prophetic-ethics.js";

test("PEP/1 evaluator remains internal until a canonical contract is approved", () => {
  assert.equal("evaluatePropheticEthics" in publicApi, false);
  assert.equal("PROPHETIC_ETHICS_PROFILES" in publicApi, false);
});

test("PEP/1 golden and adversarial fixture remains deterministic", async () => {
  const fixture = JSON.parse(
    await readFile(new URL("../fixtures/prophetic-ethics-rnd-v1.json", import.meta.url)),
  );

  assert.equal(fixture.capabilityId, "prophetic-domain");
  assert.equal(fixture.status, "RESEARCH_DRAFT_NONCANONICAL");
  assert.equal(fixture.implementationAuthority, false);
  assert.equal(fixture.profileVersion, PROPHETIC_ETHICS_PROFILE_VERSION);

  for (const fixtureCase of fixture.cases) {
    const evaluation = evaluatePropheticEthics(fixtureCase.candidate);
    assert.equal(evaluation.decision, fixtureCase.expected.decision, fixtureCase.id);
    assert.deepEqual(
      evaluation.violations.map((violation) => violation.code),
      fixtureCase.expected.violationCodes,
      fixtureCase.id,
    );
  }
});

test("all zero-tolerance policy signals deterministically deny", () => {
  for (const signal of POLICY_SIGNALS) {
    const evaluation = evaluatePropheticEthics({
      candidateId: `signal-${signal}`,
      riskLevel: "LOW",
      runtimeRole: "UNCERTAINTY_SENTINEL",
      claims: [],
      policySignals: [signal],
      humanReviews: [],
    });

    assert.equal(evaluation.decision, "DENY", signal);
    assert.equal(evaluation.violations.length, 1, signal);
    assert.equal(evaluation.violations[0].severity, "DENY", signal);
  }
});

test("profile registry is unique, sourced, and explicitly non-normative", () => {
  const profileIds = PROPHETIC_ETHICS_PROFILES.map((profile) => profile.profileId);
  assert.equal(new Set(profileIds).size, profileIds.length);
  assert.equal(PROPHETIC_ETHICS_PROFILES.length, 6);

  for (const profile of PROPHETIC_ETHICS_PROFILES) {
    assert.equal(profile.sourceLane, "REVELATION_PRIMARY_QURAN");
    assert.equal(profile.mappingAuthority, "HUMAN_INFERENCE");
    assert.equal(profile.normativeAuthority, false);
    assert.ok(profile.references.length > 0);
    assert.ok(profile.dimensions.length > 0);
    assert.ok(profile.runtimeRoles.length > 0);
  }
});

test("runtime roles are abstract responsibilities rather than prophet personas", () => {
  const forbiddenPersonaNames = new Set([
    "MUHAMMAD",
    "ISA",
    "JESUS",
    "YESUS",
    "MUSA",
    "MOSES",
    "DAWUD",
    "DAVID",
    "IBRAHIM",
    "ABRAHAM",
    "KHIDR",
  ]);

  assert.equal(new Set(RUNTIME_ROLES).size, RUNTIME_ROLES.length);
  for (const role of RUNTIME_ROLES) assert.equal(forbiddenPersonaNames.has(role), false, role);
});

test("Isa, Jesus, and Yesus normalize to one subject", () => {
  const isa = normalizeReligiousSubject("Isa");
  const jesus = normalizeReligiousSubject("Jesus");
  const yesus = normalizeReligiousSubject("Yesus");

  assert.equal(isa.subjectId, "ISA");
  assert.equal(jesus.subjectId, "ISA");
  assert.equal(yesus.subjectId, "ISA");
  assert.equal(isa.identityStatus, "QURANIC_PROPHET_REFERENCE");
  assert.equal(isa.subjectPresenceExplicitInQuran, true);
  assert.equal(isa.inputAliasExplicitInQuran, true);
  assert.equal(jesus.inputAliasExplicitInQuran, false);
  assert.equal(yesus.inputAliasExplicitInQuran, false);
  assert.equal(isa.canonicalProphetRegistryAllowed, true);
});

test("al-Khidr attribution remains a non-canonical Q18 narrative subject", () => {
  for (const alias of ["Khidr", "al-Khidr", "SERVANT_Q18_65"]) {
    const subject = normalizeReligiousSubject(alias);
    assert.equal(subject.subjectId, "SERVANT_Q18_65", alias);
    assert.equal(subject.identityStatus, "QURANIC_NARRATIVE_SUBJECT_TRADITIONALLY_IDENTIFIED", alias);
    assert.equal(subject.subjectPresenceExplicitInQuran, true, alias);
    assert.equal(subject.inputAliasExplicitInQuran, false, alias);
    assert.equal(subject.canonicalProphetRegistryAllowed, false, alias);
  }
});

test("unknown religious subjects remain unresolved and non-canonical", () => {
  const subject = normalizeReligiousSubject("unregistered subject");
  assert.deepEqual(subject, {
    subjectId: "UNKNOWN",
    identityStatus: "UNKNOWN",
    subjectPresenceExplicitInQuran: false,
    inputAliasExplicitInQuran: false,
    canonicalProphetRegistryAllowed: false,
  });
});

test("user spiritual conviction can be recorded without becoming revelation", () => {
  const accepted = evaluatePropheticEthics({
    candidateId: "user-belief-record",
    riskLevel: "LOW",
    runtimeRole: "SHAHID_RECORDER",
    claims: [
      {
        claimId: "user-belief",
        religiousClaim: true,
        sourceLane: "USER_ATTESTED_BELIEF",
        presentedAsLane: "USER_ATTESTED_BELIEF",
        references: [],
      },
    ],
    policySignals: [],
    humanReviews: [],
  });
  assert.equal(accepted.decision, "ALLOW");
  assert.equal(accepted.metrics.religiousClaims, 1);
  assert.equal(accepted.metrics.religiousClaimsRequiringReferences, 0);
  assert.equal(accepted.metrics.religiousClaimsWithRequiredReferences, 0);
  assert.equal(accepted.metrics.userAttestedBeliefClaims, 1);

  const promoted = evaluatePropheticEthics({
    candidateId: "user-belief-promoted",
    riskLevel: "LOW",
    runtimeRole: "SHAHID_RECORDER",
    claims: [
      {
        claimId: "user-belief",
        religiousClaim: true,
        sourceLane: "USER_ATTESTED_BELIEF",
        presentedAsLane: "REVELATION_PRIMARY_QURAN",
        references: [],
      },
    ],
    policySignals: [],
    humanReviews: [],
  });
  assert.equal(promoted.decision, "DENY");
  assert.deepEqual(promoted.violations.map((violation) => violation.code), ["SOURCE_LANE_PROMOTION"]);
});

test("reversed Qur'an ranges are rejected as invalid syntax", () => {
  const evaluation = evaluatePropheticEthics({
    candidateId: "reversed-quran-range",
    riskLevel: "LOW",
    runtimeRole: "TABAYYUN_VERIFIER",
    claims: [
      {
        claimId: "reversed-range",
        religiousClaim: true,
        sourceLane: "REVELATION_PRIMARY_QURAN",
        presentedAsLane: "REVELATION_PRIMARY_QURAN",
        references: ["Q3:159-150"],
      },
    ],
    policySignals: [],
    humanReviews: [],
  });

  assert.equal(evaluation.decision, "REVISE");
  assert.deepEqual(evaluation.violations.map((violation) => violation.code), [
    "INVALID_QURAN_REFERENCE_SYNTAX",
  ]);
  assert.equal(evaluation.metrics.quranReferenceSyntaxValid, false);
});

test("empty claim identity and missing religious references require revision", () => {
  const evaluation = evaluatePropheticEthics({
    candidateId: "missing-claim-evidence",
    riskLevel: "LOW",
    runtimeRole: "TABAYYUN_VERIFIER",
    claims: [
      {
        claimId: "",
        religiousClaim: true,
        sourceLane: "HUMAN_INFERENCE",
        presentedAsLane: "HUMAN_INFERENCE",
        references: [],
      },
    ],
    policySignals: [],
    humanReviews: [],
  });

  assert.equal(evaluation.decision, "REVISE");
  assert.deepEqual(evaluation.violations.map((violation) => violation.code), [
    "EMPTY_CLAIM_ID",
    "RELIGIOUS_CLAIM_WITHOUT_REFERENCE",
  ]);
  assert.equal(evaluation.metrics.religiousClaimsRequiringReferences, 1);
  assert.equal(evaluation.metrics.religiousClaimsWithRequiredReferences, 0);
});

test("tool execution without capability or repair path fails closed", () => {
  const evaluation = evaluatePropheticEthics({
    candidateId: "unsafe-tool-request",
    riskLevel: "MODERATE",
    runtimeRole: "AMANAH_PLANNER",
    claims: [],
    policySignals: [],
    humanReviews: [],
    toolRequest: {
      requested: true,
      amanahCapabilityValid: false,
      humanApprovalRequired: false,
      humanApprovalGranted: false,
      reversible: false,
      rollbackPlanPresent: false,
    },
  });

  assert.equal(evaluation.decision, "DENY");
  assert.deepEqual(evaluation.violations.map((violation) => violation.code), [
    "TOOL_WITHOUT_AMANAH_CAPABILITY",
    "ACTION_WITHOUT_REPAIR_PATH",
  ]);
});

test("unknown enums and duplicate audit identities fail closed", () => {
  const invalidClaim = {
    claimId: "duplicate",
    religiousClaim: true,
    sourceLane: "UNREGISTERED_LANE",
    presentedAsLane: "UNREGISTERED_LANE",
    references: [],
  };
  const evaluation = evaluatePropheticEthics({
    candidateId: "",
    riskLevel: "EXTREME",
    runtimeRole: "MUHAMMAD",
    claims: [invalidClaim, invalidClaim],
    policySignals: ["UNREGISTERED_SIGNAL"],
    humanReviews: [
      { role: "SOURCE_CURATOR", approved: true },
      { role: "SOURCE_CURATOR", approved: true },
    ],
  });

  assert.equal(evaluation.decision, "DENY");
  const codes = new Set(evaluation.violations.map((violation) => violation.code));
  for (const code of [
    "EMPTY_CANDIDATE_ID",
    "UNKNOWN_RUNTIME_ROLE",
    "UNKNOWN_RISK_LEVEL",
    "UNKNOWN_POLICY_SIGNAL",
    "UNKNOWN_SOURCE_LANE",
    "DUPLICATE_CLAIM_ID",
    "DUPLICATE_HUMAN_REVIEW_ROLE",
  ]) {
    assert.equal(codes.has(code), true, code);
  }
});

test("high-risk religious work requires four independent review roles", () => {
  const evaluation = evaluatePropheticEthics({
    candidateId: "high-risk-review-gate",
    riskLevel: "HIGH",
    runtimeRole: "ADL_AUDITOR",
    claims: [
      {
        claimId: "interpretation",
        religiousClaim: true,
        sourceLane: "HUMAN_INFERENCE",
        presentedAsLane: "HUMAN_INFERENCE",
        references: ["Q38:26"],
      },
    ],
    policySignals: [],
    humanReviews: [],
  });

  assert.equal(evaluation.decision, "ESCALATE");
  assert.deepEqual(evaluation.requiredHumanReviews, [
    "SOURCE_CURATOR",
    "THEOLOGICAL_REVIEWER",
    "SAFETY_REVIEWER",
    "ACCOUNTABLE_PRODUCT_OWNER",
  ]);
  assert.deepEqual(evaluation.missingHumanReviews, evaluation.requiredHumanReviews);
  assert.equal(evaluation.metrics.requiredHumanReviews, 4);
  assert.equal(evaluation.metrics.completedHumanReviews, 0);
});
