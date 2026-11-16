import { evaluateAuthority } from "./authority.js";
import type {
  Actor,
  AuthorityRequirement,
  AuthorityRule,
  Constraint,
  ConstraintCheck,
  ConstraintEvaluation,
  Knowledge,
  Possibility,
  PossibilityAssessment,
  PossibilityReason,
} from "./model.js";

const DEFAULT_ACCEPTED_EPISTEMIC = ["fact", "derived"] as const;

function findKnowledge(knowledge: Knowledge[], key: string): Knowledge | undefined {
  return knowledge.find((item) => item.key === key);
}

function acceptedEpistemic(constraint: Constraint): readonly string[] {
  return constraint.acceptedEpistemic ?? DEFAULT_ACCEPTED_EPISTEMIC;
}

function compareConstraint(constraint: Constraint, actual: unknown): ConstraintCheck {
  const base = {
    constraintId: constraint.id,
    knowledgeKey: constraint.knowledgeKey,
    actual,
    expected: constraint.expected,
  };

  if (constraint.operator !== "exists" && actual === undefined) {
    return { ...base, status: "unknown", reason: "MISSING_VALUE" };
  }

  switch (constraint.operator) {
    case "exists":
      return actual === undefined
        ? { ...base, status: "failed", reason: "MISSING_VALUE" }
        : { ...base, status: "satisfied", reason: "CONSTRAINT_SATISFIED" };

    case "equals":
      return Object.is(actual, constraint.expected)
        ? { ...base, status: "satisfied", reason: "CONSTRAINT_SATISFIED" }
        : { ...base, status: "failed", reason: "VALUE_MISMATCH" };

    case "not-equals":
      return !Object.is(actual, constraint.expected)
        ? { ...base, status: "satisfied", reason: "CONSTRAINT_SATISFIED" }
        : { ...base, status: "failed", reason: "VALUE_MISMATCH" };

    case "one-of": {
      if (!Array.isArray(constraint.expected)) {
        return { ...base, status: "unknown", reason: "INVALID_EXPECTED_VALUE" };
      }
      return constraint.expected.some((value) => Object.is(value, actual))
        ? { ...base, status: "satisfied", reason: "CONSTRAINT_SATISFIED" }
        : { ...base, status: "failed", reason: "VALUE_MISMATCH" };
    }

    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      if (typeof actual !== "number" || typeof constraint.expected !== "number") {
        return { ...base, status: "unknown", reason: "TYPE_MISMATCH" };
      }

      const satisfied =
        constraint.operator === "gt"
          ? actual > constraint.expected
          : constraint.operator === "gte"
            ? actual >= constraint.expected
            : constraint.operator === "lt"
              ? actual < constraint.expected
              : actual <= constraint.expected;

      return satisfied
        ? { ...base, status: "satisfied", reason: "CONSTRAINT_SATISFIED" }
        : { ...base, status: "failed", reason: "VALUE_MISMATCH" };
    }
  }
}

export function evaluateConstraint(args: {
  constraint: Constraint;
  knowledge: Knowledge[];
}): ConstraintCheck {
  const item = findKnowledge(args.knowledge, args.constraint.knowledgeKey);

  if (!item) {
    return {
      constraintId: args.constraint.id,
      status: "unknown",
      reason: "MISSING_KNOWLEDGE",
      knowledgeKey: args.constraint.knowledgeKey,
      expected: args.constraint.expected,
    };
  }

  if (!acceptedEpistemic(args.constraint).includes(item.epistemic)) {
    return {
      constraintId: args.constraint.id,
      status: "unknown",
      reason: "EPISTEMIC_STATE_NOT_ACCEPTED",
      knowledgeKey: args.constraint.knowledgeKey,
      actual: item.value,
      expected: args.constraint.expected,
      detail: { epistemic: item.epistemic },
    };
  }

  return compareConstraint(args.constraint, item.value);
}

export function evaluateConstraints(args: {
  constraints?: Constraint[];
  knowledge: Knowledge[];
}): ConstraintEvaluation {
  const checks = (args.constraints ?? []).map((constraint) =>
    evaluateConstraint({ constraint, knowledge: args.knowledge }),
  );

  const status = checks.some((check) => check.status === "failed")
    ? "failed"
    : checks.some((check) => check.status === "unknown")
      ? "unknown"
      : "satisfied";

  return { status, checks };
}

function authorityRequirements(possibility: Possibility): AuthorityRequirement[] {
  const supplied = structuredClone(possibility.authority ?? []);
  const hasIntentForSubject = supplied.some(
    (requirement) =>
      requirement.capability === "intend" &&
      (requirement.subject?.id ?? possibility.subject.id) === possibility.subject.id,
  );

  if (!hasIntentForSubject) {
    supplied.unshift({
      capability: "intend",
      subject: possibility.subject,
    });
  }

  return supplied;
}

export function assessPossibility(args: {
  possibility: Possibility;
  actor: Actor;
  knowledge: Knowledge[];
  authorityRules: AuthorityRule[];
  situationId?: string;
}): PossibilityAssessment {
  const constraints = evaluateConstraints({
    constraints: args.possibility.constraints,
    knowledge: args.knowledge,
  });

  const authority = authorityRequirements(args.possibility).map((requirement) =>
    evaluateAuthority({
      request: {
        actor: args.actor,
        capability: requirement.capability,
        subject: requirement.subject ?? args.possibility.subject,
        situationId: requirement.situationId ?? args.situationId,
      },
      rules: args.authorityRules,
    }),
  );

  const reasons: PossibilityReason[] = [];

  for (const check of constraints.checks) {
    if (check.status === "failed") {
      reasons.push({
        code: "CONSTRAINT_FAILED",
        constraintId: check.constraintId,
        detail: { reason: check.reason },
      });
    } else if (check.status === "unknown") {
      reasons.push({
        code: "CONSTRAINT_UNKNOWN",
        constraintId: check.constraintId,
        detail: { reason: check.reason },
      });
    }
  }

  for (const decision of authority) {
    if (decision.status === "denied") {
      reasons.push({
        code: "AUTHORITY_DENIED",
        capability: decision.request.capability,
        detail: { matchedRuleIds: decision.matchedRuleIds },
      });
    } else if (decision.status === "unknown") {
      reasons.push({
        code: "AUTHORITY_UNKNOWN",
        capability: decision.request.capability,
      });
    }
  }

  const status =
    constraints.status === "failed" || authority.some((item) => item.status === "denied")
      ? "unavailable"
      : constraints.status === "unknown" || authority.some((item) => item.status === "unknown")
        ? "unknown"
        : "available";

  return {
    possibilityId: args.possibility.id,
    status,
    constraints,
    authority,
    reasons,
  };
}
