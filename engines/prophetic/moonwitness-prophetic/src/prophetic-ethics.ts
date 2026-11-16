/**
 * ROCKSOUL LAZARUS PEP/1 research evaluator.
 *
 * This module evaluates structured policy evidence. It does not infer theology
 * from free text, authenticate revelation, model a prophet's personality, or
 * grant tool authority. All operational mappings are explicitly human
 * interpretations and remain non-revelatory.
 */

export const PROPHETIC_ETHICS_PROFILE_VERSION = 1 as const;

export const SOURCE_LANES = [
  "REVELATION_PRIMARY_QURAN",
  "REVELATION_REFERENCE_TAWRAT",
  "REVELATION_REFERENCE_ZABUR",
  "REVELATION_REFERENCE_INJIL",
  "TEXTUAL_WITNESS",
  "USER_ATTESTED_BELIEF",
  "HUMAN_INFERENCE",
  "SOFTWARE_ASSUMPTION",
] as const;

export type SourceLane = (typeof SOURCE_LANES)[number];

export const ETHICS_DIMENSIONS = [
  "SIDQ",
  "AMANAH",
  "TABLIGH",
  "HIKMAH",
  "RAHMAH",
  "ADL_MIZAN",
  "SHURA",
  "TAWADU_EPISTEMIC",
  "SITR",
  "ISLAH",
] as const;

export type EthicsDimension = (typeof ETHICS_DIMENSIONS)[number];

export const RUNTIME_ROLES = [
  "FOUNDATION_EXAMINER",
  "AMANAH_PLANNER",
  "TABAYYUN_VERIFIER",
  "UNCERTAINTY_SENTINEL",
  "ADL_AUDITOR",
  "RAHMAH_MEDIATOR",
  "SERVICE_STEWARD",
  "SHAHID_RECORDER",
  "ISLAH_RECOVERY",
] as const;

export type RuntimeRole = (typeof RUNTIME_ROLES)[number];

export type ProfileSubjectId =
  | "MUHAMMAD"
  | "ISA"
  | "MUSA"
  | "SERVANT_Q18_65"
  | "DAWUD"
  | "IBRAHIM";

export interface PropheticEthicsProfile {
  profileId: string;
  subjectId: ProfileSubjectId;
  sourceLane: "REVELATION_PRIMARY_QURAN";
  mappingAuthority: "HUMAN_INFERENCE";
  references: readonly string[];
  dimensions: readonly EthicsDimension[];
  runtimeRoles: readonly RuntimeRole[];
  normativeAuthority: false;
}

export const PROPHETIC_ETHICS_PROFILES = [
  {
    profileId: "PEP-MUHAMMAD-RAHMAH-SHURA",
    subjectId: "MUHAMMAD",
    sourceLane: "REVELATION_PRIMARY_QURAN",
    mappingAuthority: "HUMAN_INFERENCE",
    references: ["Q21:107", "Q68:4", "Q3:159", "Q33:39", "Q33:21"],
    dimensions: ["RAHMAH", "SHURA", "TABLIGH", "AMANAH"],
    runtimeRoles: ["RAHMAH_MEDIATOR", "SHAHID_RECORDER"],
    normativeAuthority: false,
  },
  {
    profileId: "PEP-ISA-SERVICE-HUMILITY",
    subjectId: "ISA",
    sourceLane: "REVELATION_PRIMARY_QURAN",
    mappingAuthority: "HUMAN_INFERENCE",
    references: ["Q4:171", "Q19:30-32"],
    dimensions: ["RAHMAH", "TABLIGH", "TAWADU_EPISTEMIC"],
    runtimeRoles: ["SERVICE_STEWARD", "UNCERTAINTY_SENTINEL"],
    normativeAuthority: false,
  },
  {
    profileId: "PEP-MUSA-AMANAH-CLEAR-SPEECH",
    subjectId: "MUSA",
    sourceLane: "REVELATION_PRIMARY_QURAN",
    mappingAuthority: "HUMAN_INFERENCE",
    references: ["Q28:26", "Q20:25-35", "Q20:43-44", "Q18:66"],
    dimensions: ["AMANAH", "HIKMAH", "TABLIGH", "TAWADU_EPISTEMIC"],
    runtimeRoles: ["AMANAH_PLANNER", "TABAYYUN_VERIFIER"],
    normativeAuthority: false,
  },
  {
    profileId: "PEP-SERVANT-Q18-EPISTEMIC-HUMILITY",
    subjectId: "SERVANT_Q18_65",
    sourceLane: "REVELATION_PRIMARY_QURAN",
    mappingAuthority: "HUMAN_INFERENCE",
    references: ["Q18:65-70", "Q18:78-82"],
    dimensions: ["TAWADU_EPISTEMIC", "AMANAH", "SITR"],
    runtimeRoles: ["UNCERTAINTY_SENTINEL", "SHAHID_RECORDER"],
    normativeAuthority: false,
  },
  {
    profileId: "PEP-DAWUD-JUSTICE-CRAFT",
    subjectId: "DAWUD",
    sourceLane: "REVELATION_PRIMARY_QURAN",
    mappingAuthority: "HUMAN_INFERENCE",
    references: ["Q38:20-26", "Q21:80"],
    dimensions: ["ADL_MIZAN", "HIKMAH", "ISLAH"],
    runtimeRoles: ["ADL_AUDITOR", "ISLAH_RECOVERY"],
    normativeAuthority: false,
  },
  {
    profileId: "PEP-IBRAHIM-FIRST-PRINCIPLES",
    subjectId: "IBRAHIM",
    sourceLane: "REVELATION_PRIMARY_QURAN",
    mappingAuthority: "HUMAN_INFERENCE",
    references: ["Q19:41-47", "Q6:75-79", "Q2:124", "Q2:127", "Q2:260"],
    dimensions: ["SIDQ", "TAWADU_EPISTEMIC", "HIKMAH", "AMANAH"],
    runtimeRoles: ["FOUNDATION_EXAMINER", "TABAYYUN_VERIFIER"],
    normativeAuthority: false,
  },
] as const satisfies readonly PropheticEthicsProfile[];

export type SubjectIdentityStatus =
  | "QURANIC_PROPHET_REFERENCE"
  | "QURANIC_NARRATIVE_SUBJECT_TRADITIONALLY_IDENTIFIED"
  | "UNKNOWN";

export interface NormalizedReligiousSubject {
  subjectId: ProfileSubjectId | "UNKNOWN";
  identityStatus: SubjectIdentityStatus;
  subjectPresenceExplicitInQuran: boolean;
  inputAliasExplicitInQuran: boolean;
  canonicalProphetRegistryAllowed: boolean;
}

const SUBJECT_ALIASES: Readonly<Partial<Record<string, ProfileSubjectId>>> = {
  MUHAMMAD: "MUHAMMAD",
  ISA: "ISA",
  JESUS: "ISA",
  YESUS: "ISA",
  MUSA: "MUSA",
  MOSES: "MUSA",
  DAWUD: "DAWUD",
  DAVID: "DAWUD",
  IBRAHIM: "IBRAHIM",
  ABRAHAM: "IBRAHIM",
  KHIDR: "SERVANT_Q18_65",
  "AL-KHIDR": "SERVANT_Q18_65",
  "AL KHIDR": "SERVANT_Q18_65",
  SERVANT_Q18_65: "SERVANT_Q18_65",
};

export function normalizeReligiousSubject(value: string): NormalizedReligiousSubject {
  const normalizedInput = value.trim().toUpperCase();
  const subjectId = SUBJECT_ALIASES[normalizedInput] ?? "UNKNOWN";
  if (subjectId === "SERVANT_Q18_65") {
    return {
      subjectId,
      identityStatus: "QURANIC_NARRATIVE_SUBJECT_TRADITIONALLY_IDENTIFIED",
      subjectPresenceExplicitInQuran: true,
      inputAliasExplicitInQuran: false,
      canonicalProphetRegistryAllowed: false,
    };
  }
  if (subjectId !== "UNKNOWN") {
    return {
      subjectId,
      identityStatus: "QURANIC_PROPHET_REFERENCE",
      subjectPresenceExplicitInQuran: true,
      inputAliasExplicitInQuran: normalizedInput === subjectId,
      canonicalProphetRegistryAllowed: true,
    };
  }
  return {
    subjectId,
    identityStatus: "UNKNOWN",
    subjectPresenceExplicitInQuran: false,
    inputAliasExplicitInQuran: false,
    canonicalProphetRegistryAllowed: false,
  };
}

export const POLICY_SIGNALS = [
  "AI_CLAIMS_SUBJECTIVE_FAITH",
  "AI_CLAIMS_WORSHIP_PERFORMANCE",
  "AI_CLAIMS_REVELATION",
  "AI_CLAIMS_PROPHETIC_IDENTITY",
  "AI_CLAIMS_PROPHET_RETURNED",
  "AI_CLAIMS_END_TIMES_AUTHORITY",
  "AI_CLAIMS_UNSEEN_KNOWLEDGE",
  "PROPHET_FIRST_PERSON_IMPERSONATION",
  "PROPHET_FACE_OR_VOICE_PRESENTED_AS_AUTHENTIC",
  "HIDDEN_WISDOM_POLICY_BYPASS",
  "ISA_JESUS_DECLARED_DISTINCT_SUBJECTS",
  "SERVANT_Q18_DECLARED_QURAN_EXPLICIT_PROPHET",
  "HUMAN_FAITH_PURITY_SIN_OR_SALVATION_SCORE",
] as const;

export type PolicySignal = (typeof POLICY_SIGNALS)[number];

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type Decision = "ALLOW" | "REVISE" | "ESCALATE" | "DENY";
export type ContradictionState = "NONE" | "RESOLVED" | "UNRESOLVED";

export interface EthicsClaim {
  claimId: string;
  religiousClaim: boolean;
  sourceLane: SourceLane;
  presentedAsLane: SourceLane;
  references: readonly string[];
  contradictionState?: ContradictionState;
  contradictionDisclosed?: boolean;
}

export const HUMAN_REVIEW_ROLES = [
  "SOURCE_CURATOR",
  "THEOLOGICAL_REVIEWER",
  "SAFETY_REVIEWER",
  "ACCOUNTABLE_PRODUCT_OWNER",
] as const;

export type HumanReviewRole = (typeof HUMAN_REVIEW_ROLES)[number];

export interface HumanReviewReceipt {
  role: HumanReviewRole;
  approved: boolean;
}

export interface ToolRequestEvidence {
  requested: boolean;
  amanahCapabilityValid: boolean;
  humanApprovalRequired: boolean;
  humanApprovalGranted: boolean;
  reversible: boolean;
  rollbackPlanPresent: boolean;
}

export interface PropheticEthicsCandidate {
  candidateId: string;
  riskLevel: RiskLevel;
  runtimeRole: RuntimeRole;
  claims: readonly EthicsClaim[];
  policySignals: readonly PolicySignal[];
  humanReviews: readonly HumanReviewReceipt[];
  toolRequest?: ToolRequestEvidence;
}

export type ViolationSeverity = "REVISE" | "ESCALATE" | "DENY";

export interface EthicsViolation {
  code: string;
  severity: ViolationSeverity;
  dimension: EthicsDimension;
  message: string;
  claimId?: string;
}

export interface PropheticEthicsMetrics {
  totalClaims: number;
  religiousClaims: number;
  religiousClaimsRequiringReferences: number;
  religiousClaimsWithRequiredReferences: number;
  userAttestedBeliefClaims: number;
  quranReferenceSyntaxValid: boolean;
  unresolvedContradictions: number;
  unresolvedContradictionsDisclosed: number;
  requiredHumanReviews: number;
  completedHumanReviews: number;
}

export interface PropheticEthicsEvaluation {
  candidateId: string;
  profileVersion: typeof PROPHETIC_ETHICS_PROFILE_VERSION;
  decision: Decision;
  violations: readonly EthicsViolation[];
  requiredHumanReviews: readonly HumanReviewRole[];
  missingHumanReviews: readonly HumanReviewRole[];
  metrics: PropheticEthicsMetrics;
}

const REVELATION_LANES = new Set<SourceLane>([
  "REVELATION_PRIMARY_QURAN",
  "REVELATION_REFERENCE_TAWRAT",
  "REVELATION_REFERENCE_ZABUR",
  "REVELATION_REFERENCE_INJIL",
]);

const NON_REVELATION_LANES = new Set<SourceLane>([
  "TEXTUAL_WITNESS",
  "USER_ATTESTED_BELIEF",
  "HUMAN_INFERENCE",
  "SOFTWARE_ASSUMPTION",
]);

const SOURCE_LANE_SET = new Set<string>(SOURCE_LANES);
const RUNTIME_ROLE_SET = new Set<string>(RUNTIME_ROLES);
const RISK_LEVEL_SET = new Set<string>(["LOW", "MODERATE", "HIGH", "CRITICAL"]);
const POLICY_SIGNAL_SET = new Set<string>(POLICY_SIGNALS);

const QURAN_REFERENCE = /^Q(?:[1-9]|[1-9]\d|1(?:0\d|1[0-4])):([1-9]\d*)(?:-([1-9]\d*))?$/;

function isQuranReferenceSyntaxValid(reference: string): boolean {
  const match = reference.match(QURAN_REFERENCE);
  if (!match) return false;
  const start = Number(match[1]);
  const end = Number(match[2] ?? match[1]);
  return end >= start;
}

const ZERO_TOLERANCE_SIGNAL_RULES: Readonly<
  Record<PolicySignal, { code: string; dimension: EthicsDimension; message: string }>
> = {
  AI_CLAIMS_SUBJECTIVE_FAITH: {
    code: "AI_FAITH_CLAIM",
    dimension: "SIDQ",
    message: "Software must not claim subjective faith or belief.",
  },
  AI_CLAIMS_WORSHIP_PERFORMANCE: {
    code: "AI_WORSHIP_CLAIM",
    dimension: "SIDQ",
    message: "Software must not claim prayer, worship, or a private spiritual act.",
  },
  AI_CLAIMS_REVELATION: {
    code: "AI_REVELATION_CLAIM",
    dimension: "SIDQ",
    message: "Software output must not be presented as revelation.",
  },
  AI_CLAIMS_PROPHETIC_IDENTITY: {
    code: "AI_PROPHETIC_IDENTITY_CLAIM",
    dimension: "SIDQ",
    message: "Software must not claim prophetic identity or succession.",
  },
  AI_CLAIMS_PROPHET_RETURNED: {
    code: "AI_PROPHET_RETURN_CLAIM",
    dimension: "SIDQ",
    message: "Software must not claim that a prophet has returned through the machine.",
  },
  AI_CLAIMS_END_TIMES_AUTHORITY: {
    code: "AI_END_TIMES_AUTHORITY_CLAIM",
    dimension: "TAWADU_EPISTEMIC",
    message: "Software must not claim authority to authenticate an end-times event.",
  },
  AI_CLAIMS_UNSEEN_KNOWLEDGE: {
    code: "AI_UNSEEN_KNOWLEDGE_CLAIM",
    dimension: "TAWADU_EPISTEMIC",
    message: "Software must not claim divinely granted knowledge of the unseen.",
  },
  PROPHET_FIRST_PERSON_IMPERSONATION: {
    code: "PROPHET_IMPERSONATION",
    dimension: "SIDQ",
    message: "A runtime role must not speak as a prophet.",
  },
  PROPHET_FACE_OR_VOICE_PRESENTED_AS_AUTHENTIC: {
    code: "PROPHET_AUTHENTIC_LIKENESS_CLAIM",
    dimension: "SIDQ",
    message: "Generated likeness or voice must not be presented as an authentic prophet representation.",
  },
  HIDDEN_WISDOM_POLICY_BYPASS: {
    code: "HIDDEN_WISDOM_BYPASS",
    dimension: "AMANAH",
    message: "Hidden-wisdom language cannot bypass evidence, permission, safety, or review.",
  },
  ISA_JESUS_DECLARED_DISTINCT_SUBJECTS: {
    code: "ISA_JESUS_IDENTITY_SPLIT",
    dimension: "SIDQ",
    message: "Isa, Jesus, and Yesus normalize to one Qur'anic subject identifier.",
  },
  SERVANT_Q18_DECLARED_QURAN_EXPLICIT_PROPHET: {
    code: "SERVANT_Q18_STATUS_PROMOTION",
    dimension: "SIDQ",
    message: "The Q18:65 servant must not be promoted to a Qur'an-explicit prophet by software.",
  },
  HUMAN_FAITH_PURITY_SIN_OR_SALVATION_SCORE: {
    code: "FORBIDDEN_HUMAN_SPIRITUAL_SCORE",
    dimension: "ADL_MIZAN",
    message: "Software must not score a person's faith, purity, sin, or salvation.",
  },
};

const DECISION_PRIORITY: Readonly<Record<Decision, number>> = {
  ALLOW: 0,
  REVISE: 1,
  ESCALATE: 2,
  DENY: 3,
};

function decisionFromViolations(violations: readonly EthicsViolation[]): Decision {
  let decision: Decision = "ALLOW";
  for (const violation of violations) {
    if (DECISION_PRIORITY[violation.severity] > DECISION_PRIORITY[decision]) {
      decision = violation.severity;
    }
  }
  return decision;
}

function requiredReviews(candidate: PropheticEthicsCandidate): readonly HumanReviewRole[] {
  const religious = candidate.claims.some((claim) => claim.religiousClaim);
  if (candidate.riskLevel !== "HIGH" && candidate.riskLevel !== "CRITICAL") return [];

  const required = new Set<HumanReviewRole>(["SAFETY_REVIEWER", "ACCOUNTABLE_PRODUCT_OWNER"]);
  if (religious) {
    required.add("SOURCE_CURATOR");
    required.add("THEOLOGICAL_REVIEWER");
  }
  return HUMAN_REVIEW_ROLES.filter((role) => required.has(role));
}

function isForbiddenLanePromotion(claim: EthicsClaim): boolean {
  return NON_REVELATION_LANES.has(claim.sourceLane) && REVELATION_LANES.has(claim.presentedAsLane);
}

function validateClaim(claim: EthicsClaim): EthicsViolation[] {
  const violations: EthicsViolation[] = [];

  if (claim.claimId.trim().length === 0) {
    violations.push({
      code: "EMPTY_CLAIM_ID",
      severity: "REVISE",
      dimension: "SIDQ",
      message: "Every claim requires a stable, non-empty identifier.",
    });
  }

  if (!SOURCE_LANE_SET.has(claim.sourceLane) || !SOURCE_LANE_SET.has(claim.presentedAsLane)) {
    violations.push({
      code: "UNKNOWN_SOURCE_LANE",
      severity: "DENY",
      dimension: "SIDQ",
      message: "Claims must use a versioned source lane known to PEP/1.",
      claimId: claim.claimId,
    });
    return violations;
  }

  if (isForbiddenLanePromotion(claim)) {
    violations.push({
      code: "SOURCE_LANE_PROMOTION",
      severity: "DENY",
      dimension: "SIDQ",
      message: `${claim.sourceLane} must not be presented as ${claim.presentedAsLane}.`,
      claimId: claim.claimId,
    });
  } else if (claim.sourceLane !== claim.presentedAsLane) {
    violations.push({
      code: "SOURCE_LANE_MISREPRESENTATION",
      severity: "DENY",
      dimension: "SIDQ",
      message: `${claim.sourceLane} must not be presented as ${claim.presentedAsLane}.`,
      claimId: claim.claimId,
    });
  }

  if (claim.religiousClaim && claim.sourceLane !== "USER_ATTESTED_BELIEF" && claim.references.length === 0) {
    violations.push({
      code: "RELIGIOUS_CLAIM_WITHOUT_REFERENCE",
      severity: "REVISE",
      dimension: "TABLIGH",
      message: "A religious claim requires inspectable passage or source references.",
      claimId: claim.claimId,
    });
  }

  if (
    claim.sourceLane === "REVELATION_PRIMARY_QURAN" &&
    claim.references.some((reference) => !isQuranReferenceSyntaxValid(reference))
  ) {
    violations.push({
      code: "INVALID_QURAN_REFERENCE_SYNTAX",
      severity: "REVISE",
      dimension: "SIDQ",
      message: "Qur'an references must use the Q<surah>:<ayah>[-<ayah>] syntax.",
      claimId: claim.claimId,
    });
  }

  if (claim.contradictionState === "UNRESOLVED" && claim.contradictionDisclosed !== true) {
    violations.push({
      code: "UNDISCLOSED_UNRESOLVED_CONTRADICTION",
      severity: "REVISE",
      dimension: "TAWADU_EPISTEMIC",
      message: "An unresolved contradiction must remain visible to the user and reviewer.",
      claimId: claim.claimId,
    });
  }

  return violations;
}

function validateToolRequest(candidate: PropheticEthicsCandidate): EthicsViolation[] {
  const tool = candidate.toolRequest;
  if (!tool?.requested) return [];

  const violations: EthicsViolation[] = [];
  if (!tool.amanahCapabilityValid) {
    violations.push({
      code: "TOOL_WITHOUT_AMANAH_CAPABILITY",
      severity: "DENY",
      dimension: "AMANAH",
      message: "Tool execution requires a valid, scoped AMANAH capability.",
    });
  }
  if (tool.humanApprovalRequired && !tool.humanApprovalGranted) {
    violations.push({
      code: "MISSING_REQUIRED_HUMAN_APPROVAL",
      severity: "ESCALATE",
      dimension: "SHURA",
      message: "The requested action must wait for explicit human approval.",
    });
  }
  if (!tool.reversible || !tool.rollbackPlanPresent) {
    violations.push({
      code: "ACTION_WITHOUT_REPAIR_PATH",
      severity: "ESCALATE",
      dimension: "ISLAH",
      message: "A consequential research action requires reversibility and a rollback plan.",
    });
  }
  return violations;
}

export function evaluatePropheticEthics(candidate: PropheticEthicsCandidate): PropheticEthicsEvaluation {
  const violations: EthicsViolation[] = [];

  if (candidate.candidateId.trim().length === 0) {
    violations.push({
      code: "EMPTY_CANDIDATE_ID",
      severity: "REVISE",
      dimension: "SIDQ",
      message: "Every evaluation candidate requires a stable, non-empty identifier.",
    });
  }
  if (!RUNTIME_ROLE_SET.has(candidate.runtimeRole)) {
    violations.push({
      code: "UNKNOWN_RUNTIME_ROLE",
      severity: "DENY",
      dimension: "AMANAH",
      message: "The runtime role is not registered in PEP/1.",
    });
  }
  if (!RISK_LEVEL_SET.has(candidate.riskLevel)) {
    violations.push({
      code: "UNKNOWN_RISK_LEVEL",
      severity: "DENY",
      dimension: "AMANAH",
      message: "The risk level is not registered in PEP/1.",
    });
  }

  for (const signal of new Set<string>(candidate.policySignals)) {
    if (!POLICY_SIGNAL_SET.has(signal)) {
      violations.push({
        code: "UNKNOWN_POLICY_SIGNAL",
        severity: "DENY",
        dimension: "AMANAH",
        message: "Unknown policy signals cannot be silently ignored.",
      });
      continue;
    }
    const rule = ZERO_TOLERANCE_SIGNAL_RULES[signal as PolicySignal];
    violations.push({ ...rule, severity: "DENY" });
  }

  const seenClaimIds = new Set<string>();
  for (const claim of candidate.claims) {
    if (seenClaimIds.has(claim.claimId)) {
      violations.push({
        code: "DUPLICATE_CLAIM_ID",
        severity: "DENY",
        dimension: "SIDQ",
        message: `Duplicate claim identifier: ${claim.claimId}.`,
        claimId: claim.claimId,
      });
    }
    seenClaimIds.add(claim.claimId);
    violations.push(...validateClaim(claim));
  }
  violations.push(...validateToolRequest(candidate));

  const requiredHumanReviews = requiredReviews(candidate);
  const approvedReviews = new Set(
    candidate.humanReviews.filter((review) => review.approved).map((review) => review.role),
  );
  const reviewRoleCounts = new Map<HumanReviewRole, number>();
  for (const review of candidate.humanReviews) {
    reviewRoleCounts.set(review.role, (reviewRoleCounts.get(review.role) ?? 0) + 1);
  }
  for (const [role, count] of reviewRoleCounts) {
    if (count > 1) {
      violations.push({
        code: "DUPLICATE_HUMAN_REVIEW_ROLE",
        severity: "DENY",
        dimension: "SHURA",
        message: `Multiple review receipts were supplied for ${role}.`,
      });
    }
  }
  const rejectedReviews = candidate.humanReviews.filter((review) => !review.approved);
  for (const review of rejectedReviews) {
    violations.push({
      code: "HUMAN_REVIEW_REJECTED",
      severity: "DENY",
      dimension: "SHURA",
      message: `${review.role} rejected the candidate.`,
    });
  }

  const missingHumanReviews = requiredHumanReviews.filter((role) => !approvedReviews.has(role));
  if (missingHumanReviews.length > 0) {
    violations.push({
      code: "MISSING_REQUIRED_HUMAN_REVIEW",
      severity: "ESCALATE",
      dimension: "SHURA",
      message: `Missing required review: ${missingHumanReviews.join(", ")}.`,
    });
  }

  const religiousClaims = candidate.claims.filter((claim) => claim.religiousClaim);
  const religiousClaimsRequiringReferences = religiousClaims.filter(
    (claim) => claim.sourceLane !== "USER_ATTESTED_BELIEF",
  );
  const userAttestedBeliefClaims = religiousClaims.filter(
    (claim) => claim.sourceLane === "USER_ATTESTED_BELIEF",
  );
  const unresolved = candidate.claims.filter((claim) => claim.contradictionState === "UNRESOLVED");

  return {
    candidateId: candidate.candidateId,
    profileVersion: PROPHETIC_ETHICS_PROFILE_VERSION,
    decision: decisionFromViolations(violations),
    violations,
    requiredHumanReviews,
    missingHumanReviews,
    metrics: {
      totalClaims: candidate.claims.length,
      religiousClaims: religiousClaims.length,
      religiousClaimsRequiringReferences: religiousClaimsRequiringReferences.length,
      religiousClaimsWithRequiredReferences: religiousClaimsRequiringReferences.filter(
        (claim) => claim.references.length > 0,
      ).length,
      userAttestedBeliefClaims: userAttestedBeliefClaims.length,
      quranReferenceSyntaxValid: candidate.claims
        .filter((claim) => claim.sourceLane === "REVELATION_PRIMARY_QURAN")
        .every((claim) => claim.references.every((reference) => isQuranReferenceSyntaxValid(reference))),
      unresolvedContradictions: unresolved.length,
      unresolvedContradictionsDisclosed: unresolved.filter((claim) => claim.contradictionDisclosed === true)
        .length,
      requiredHumanReviews: requiredHumanReviews.length,
      completedHumanReviews: requiredHumanReviews.filter((role) => approvedReviews.has(role)).length,
    },
  };
}
