import type {
  Actor,
  AuthorityActorSelector,
  AuthorityDecision,
  AuthorityRequest,
  AuthorityRule,
  AuthorityScope,
} from "./model.js";

function actorMatches(selector: AuthorityActorSelector | undefined, actor: Actor): boolean {
  if (!selector) {
    return true;
  }

  if (selector.ids && !selector.ids.includes(actor.id)) {
    return false;
  }

  if (selector.kinds && !selector.kinds.includes(actor.kind)) {
    return false;
  }

  return true;
}

function scopeMatches(scope: AuthorityScope | undefined, request: AuthorityRequest): boolean {
  if (!scope) {
    return true;
  }

  if (scope.situationIds) {
    if (!request.situationId || !scope.situationIds.includes(request.situationId)) {
      return false;
    }
  }

  if (scope.subjectIds) {
    if (!request.subject || !scope.subjectIds.includes(request.subject.id)) {
      return false;
    }
  }

  if (scope.subjectTypes) {
    if (!request.subject?.type || !scope.subjectTypes.includes(request.subject.type)) {
      return false;
    }
  }

  return true;
}

function ruleMatches(rule: AuthorityRule, request: AuthorityRequest): boolean {
  return (
    rule.capabilities.includes(request.capability) &&
    actorMatches(rule.actors, request.actor) &&
    scopeMatches(rule.scope, request)
  );
}

export function evaluateAuthority(args: {
  request: AuthorityRequest;
  rules: AuthorityRule[];
}): AuthorityDecision {
  const matched = args.rules.filter((rule) => ruleMatches(rule, args.request));

  if (matched.length === 0) {
    return {
      status: "unknown",
      request: structuredClone(args.request),
      matchedRuleIds: [],
      reasons: [{ code: "NO_MATCHING_RULE" }],
    };
  }

  const denied = matched.filter((rule) => rule.effect === "deny");
  const allowed = matched.filter((rule) => rule.effect === "allow");

  if (denied.length > 0) {
    return {
      status: "denied",
      request: structuredClone(args.request),
      matchedRuleIds: matched.map((rule) => rule.id),
      reasons: [
        ...denied.map((rule) => ({
          code: "EXPLICIT_DENY" as const,
          ruleId: rule.id,
          detail: rule.reason ? { reason: rule.reason } : undefined,
        })),
        ...(allowed.length > 0
          ? [
              {
                code: "DENY_OVERRIDES_ALLOW" as const,
                detail: {
                  allowRuleIds: allowed.map((rule) => rule.id),
                  denyRuleIds: denied.map((rule) => rule.id),
                },
              },
            ]
          : []),
      ],
    };
  }

  return {
    status: "allowed",
    request: structuredClone(args.request),
    matchedRuleIds: allowed.map((rule) => rule.id),
    reasons: allowed.map((rule) => ({
      code: "EXPLICIT_ALLOW",
      ruleId: rule.id,
      detail: rule.reason ? { reason: rule.reason } : undefined,
    })),
  };
}
