import { stripLocalePrefix } from "@/utils/i18n";

export type RoleName = "viewer" | "editor" | "admin";
export type RouteAccessKind = "public" | "guest-only" | "protected" | "preview-or-auth";

export interface RoutePolicyRule {
  pattern: RegExp;
  access: RouteAccessKind;
  minRole?: RoleName;
}

export interface RouteAccessEvaluation {
  allowed: boolean;
  policy: RoutePolicyRule;
  reason:
    | "public"
    | "guest-only"
    | "preview"
    | "authorized"
    | "already-authenticated"
    | "unauthenticated"
    | "forbidden";
  requiredRole?: RoleName;
}

export type RouteGroupName =
  | "(sanctuary)"
  | "(console)"
  | "auth"
  | "[lang]/(front-pages)"
  | "[lang]/(blank-layout-pages)"
  | "[lang]/(dashboard)/(private)";

export interface RouteInventoryEntry {
  path: string;
  routeGroup: RouteGroupName;
  kind: "canonical" | "locale-adapter" | "operations-alias";
  canonicalOwner: string;
  localeBehavior: "unprefixed-and-localized" | "localized-primary" | "unprefixed-alias";
  access: RouteAccessKind;
  minRole?: RoleName;
  notes?: string;
}

export const ROLE_RANK: Record<string, number> = {
  viewer: 1,
  creator: 1,
  editor: 2,
  admin: 3,
};

/**
 * Evaluates whether `actualRole` satisfies `minRole`.
 * Fails closed (`false`) for missing, empty, malformed, or unrecognized roles.
 */
export function hasRequiredRole(
  actualRole: string | undefined | null,
  minRole?: RoleName,
): boolean {
  if (!minRole) return true;
  if (typeof actualRole !== "string") return false;
  const normalized = actualRole.trim().toLowerCase();
  if (!normalized || !Object.hasOwn(ROLE_RANK, normalized)) {
    return false;
  }
  if (!Object.hasOwn(ROLE_RANK, minRole)) {
    return false;
  }
  const actualRank = ROLE_RANK[normalized]!;
  const requiredRank = ROLE_RANK[minRole]!;
  return actualRank >= requiredRank;
}

const ROUTE_POLICIES: readonly RoutePolicyRule[] = [
  { pattern: /^\/$/, access: "public" },
  { pattern: /^\/(moonwitness|scriptures|codex|mtime|auth\/callback)(\/|$)/, access: "public" },
  { pattern: /^\/(shadow|login|register|forgot-password)(\/|$)/, access: "guest-only" },
  { pattern: /^\/setup(\/|$)/, access: "guest-only" },
  { pattern: /^\/pages\/misc\/401-not-authorized(\/|$)/, access: "public" },
  { pattern: /^\/apps\/(permissions|roles|user)(\/|$)/, access: "protected", minRole: "admin" },
  { pattern: /^\/(dashboards|apps)(\/|$)/, access: "protected", minRole: "viewer" },
  {
    pattern:
      /^\/(mission-control|dock|memory|addons|control|intelligence|id-lab|skin-lab|models|vpn|syslog|snmp|radius|storage)(\/|$)/,
    access: "preview-or-auth",
    minRole: "viewer",
  },
];

export function resolveRoutePolicy(pathname: string): RoutePolicyRule {
  const clean = stripLocalePrefix(pathname.split("?")[0]?.split("#")[0] || "/");
  for (const rule of ROUTE_POLICIES) {
    if (rule.pattern.test(clean)) {
      return rule;
    }
  }
  return { pattern: /.*/, access: "protected", minRole: "viewer" };
}

/**
 * Single runtime policy evaluator consumed by server guards, `AuthGuard`, and tests.
 */
export function evaluateRouteAccess(
  pathname: string,
  input: {
    isAuthenticated: boolean;
    role?: string | null;
    enforcePreviewAuth?: boolean;
  },
): RouteAccessEvaluation {
  const policy = resolveRoutePolicy(pathname);

  if (policy.access === "public") {
    return { allowed: true, policy, reason: "public" };
  }

  if (policy.access === "guest-only") {
    return input.isAuthenticated
      ? { allowed: false, policy, reason: "already-authenticated" }
      : { allowed: true, policy, reason: "guest-only" };
  }

  const requiresAuth = policy.access === "protected" || Boolean(input.enforcePreviewAuth);
  if (!input.isAuthenticated) {
    if (requiresAuth) {
      return { allowed: false, policy, reason: "unauthenticated" };
    }
    return { allowed: true, policy, reason: "preview" };
  }

  const requiredRole = policy.minRole ?? "viewer";
  if (!hasRequiredRole(input.role, requiredRole)) {
    return { allowed: false, policy, reason: "forbidden", requiredRole };
  }

  return { allowed: true, policy, reason: "authorized" };
}

/**
 * Canonical route ownership inventory across all Next.js App Router route groups.
 */
export const ROUTE_INVENTORY: readonly RouteInventoryEntry[] = [
  {
    path: "/",
    routeGroup: "(sanctuary)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/components/empire-of-light-experience.tsx",
    localeBehavior: "unprefixed-and-localized",
    access: "public",
  },
  {
    path: "/scriptures",
    routeGroup: "(sanctuary)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/components/scriptures-studio.tsx",
    localeBehavior: "unprefixed-and-localized",
    access: "public",
  },
  {
    path: "/codex",
    routeGroup: "(sanctuary)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/components/canon-codex-sanctum.tsx",
    localeBehavior: "unprefixed-and-localized",
    access: "public",
  },
  {
    path: "/mtime",
    routeGroup: "(sanctuary)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/components/mtime-observatory.tsx",
    localeBehavior: "unprefixed-and-localized",
    access: "public",
  },
  {
    path: "/moonwitness",
    routeGroup: "(console)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/components/landing/index.tsx",
    localeBehavior: "unprefixed-and-localized",
    access: "public",
  },
  {
    path: "/auth/callback",
    routeGroup: "auth",
    kind: "canonical",
    canonicalOwner: "apps/web/src/app/auth/callback/page.tsx",
    localeBehavior: "unprefixed-alias",
    access: "public",
  },
  {
    path: "/shadow",
    routeGroup: "(console)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/auth/ShadowLoginView.tsx",
    localeBehavior: "unprefixed-and-localized",
    access: "guest-only",
  },
  {
    path: "/setup",
    routeGroup: "(console)",
    kind: "operations-alias",
    canonicalOwner: "apps/web/src/views/auth/ShadowLoginView.tsx",
    localeBehavior: "unprefixed-alias",
    access: "guest-only",
    notes: "Redirects cleanly to /shadow?mode=setup",
  },
  {
    path: "/[lang]/login",
    routeGroup: "[lang]/(blank-layout-pages)",
    kind: "locale-adapter",
    canonicalOwner: "apps/web/src/views/auth/ShadowLoginView.tsx",
    localeBehavior: "localized-primary",
    access: "guest-only",
  },
  {
    path: "/[lang]/shadow",
    routeGroup: "[lang]/(blank-layout-pages)",
    kind: "locale-adapter",
    canonicalOwner: "apps/web/src/views/auth/ShadowLoginView.tsx",
    localeBehavior: "localized-primary",
    access: "guest-only",
  },
  {
    path: "/[lang]/pages/misc/401-not-authorized",
    routeGroup: "[lang]/(blank-layout-pages)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/NotAuthorized.tsx",
    localeBehavior: "localized-primary",
    access: "public",
  },
  {
    path: "/mission-control",
    routeGroup: "(console)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/features/command-center/index.ts",
    localeBehavior: "unprefixed-and-localized",
    access: "preview-or-auth",
    minRole: "viewer",
  },
  {
    path: "/dock",
    routeGroup: "(console)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/components/dock/index.tsx",
    localeBehavior: "unprefixed-and-localized",
    access: "preview-or-auth",
    minRole: "viewer",
  },
  {
    path: "/memory",
    routeGroup: "(console)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/features/memory/index.ts",
    localeBehavior: "unprefixed-and-localized",
    access: "preview-or-auth",
    minRole: "viewer",
  },
  {
    path: "/addons",
    routeGroup: "(console)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/apps/addons/index.tsx",
    localeBehavior: "unprefixed-and-localized",
    access: "preview-or-auth",
    minRole: "viewer",
  },
  {
    path: "/control",
    routeGroup: "(console)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/components/control/index.tsx",
    localeBehavior: "unprefixed-and-localized",
    access: "preview-or-auth",
    minRole: "viewer",
  },
  {
    path: "/intelligence",
    routeGroup: "(console)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/app/(console)/intelligence/IntelligenceDashboard.tsx",
    localeBehavior: "unprefixed-alias",
    access: "preview-or-auth",
    minRole: "viewer",
  },
  {
    path: "/id-lab",
    routeGroup: "(console)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/components/id-lab/index.tsx",
    localeBehavior: "unprefixed-and-localized",
    access: "preview-or-auth",
    minRole: "viewer",
  },
  {
    path: "/skin-lab",
    routeGroup: "(console)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/components/skin-lab/SkinLaboratory.tsx",
    localeBehavior: "unprefixed-and-localized",
    access: "preview-or-auth",
    minRole: "viewer",
  },
  {
    path: "/models/[model]",
    routeGroup: "(console)",
    kind: "operations-alias",
    canonicalOwner: "apps/web/src/views/apps/addons/index.tsx",
    localeBehavior: "unprefixed-alias",
    access: "preview-or-auth",
    minRole: "viewer",
  },
  {
    path: "/vpn",
    routeGroup: "(console)",
    kind: "operations-alias",
    canonicalOwner: "apps/web/src/components/control/index.tsx",
    localeBehavior: "unprefixed-alias",
    access: "preview-or-auth",
    minRole: "viewer",
    notes: "Compatibility alias for /control?tab=vpn",
  },
  {
    path: "/syslog",
    routeGroup: "(console)",
    kind: "operations-alias",
    canonicalOwner: "apps/web/src/components/control/index.tsx",
    localeBehavior: "unprefixed-alias",
    access: "preview-or-auth",
    minRole: "viewer",
    notes: "Compatibility alias for /control?tab=syslog",
  },
  {
    path: "/snmp",
    routeGroup: "(console)",
    kind: "operations-alias",
    canonicalOwner: "apps/web/src/components/control/index.tsx",
    localeBehavior: "unprefixed-alias",
    access: "preview-or-auth",
    minRole: "viewer",
    notes: "Compatibility alias for /control?tab=snmp",
  },
  {
    path: "/radius",
    routeGroup: "(console)",
    kind: "operations-alias",
    canonicalOwner: "apps/web/src/components/control/index.tsx",
    localeBehavior: "unprefixed-alias",
    access: "preview-or-auth",
    minRole: "viewer",
    notes: "Compatibility alias for /control?tab=radius",
  },
  {
    path: "/storage",
    routeGroup: "(console)",
    kind: "operations-alias",
    canonicalOwner: "apps/web/src/components/control/index.tsx",
    localeBehavior: "unprefixed-alias",
    access: "preview-or-auth",
    minRole: "viewer",
    notes: "Compatibility alias for /control?tab=storage",
  },
  {
    path: "/[lang]/dashboards/analytics",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/dashboards/analytics/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/dashboards/crm",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/dashboards/crm/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/dashboards/logistics",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/dashboards/logistics/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/apps/academy",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/apps/academy/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/apps/addons",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/apps/addons/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/apps/automation",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/apps/automation/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/apps/calendar",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/app/[lang]/(dashboard)/(private)/apps/calendar/page.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/apps/chat",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/app/[lang]/(dashboard)/(private)/apps/chat/page.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/apps/control",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "locale-adapter",
    canonicalOwner: "apps/web/src/components/control/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/apps/invoice",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/apps/invoice/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/apps/kanban",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/apps/kanban/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/apps/memory",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "locale-adapter",
    canonicalOwner: "apps/web/src/features/memory/index.ts",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/apps/observatory",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/apps/observatory/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/apps/permissions",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/apps/permissions/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "admin",
  },
  {
    path: "/[lang]/apps/roles",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/apps/roles/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "admin",
  },
  {
    path: "/[lang]/apps/user/list",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "canonical",
    canonicalOwner: "apps/web/src/views/apps/user/list/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "admin",
  },
  {
    path: "/[lang]/mission-control",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "locale-adapter",
    canonicalOwner: "apps/web/src/features/command-center/index.ts",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/dock",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "locale-adapter",
    canonicalOwner: "apps/web/src/components/dock/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/id-lab",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "locale-adapter",
    canonicalOwner: "apps/web/src/components/id-lab/index.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]/skin-lab",
    routeGroup: "[lang]/(dashboard)/(private)",
    kind: "locale-adapter",
    canonicalOwner: "apps/web/src/components/skin-lab/SkinLaboratory.tsx",
    localeBehavior: "localized-primary",
    access: "protected",
    minRole: "viewer",
  },
  {
    path: "/[lang]",
    routeGroup: "[lang]/(front-pages)",
    kind: "locale-adapter",
    canonicalOwner: "apps/web/src/components/empire-of-light-experience.tsx",
    localeBehavior: "localized-primary",
    access: "public",
  },
  {
    path: "/[lang]/scriptures",
    routeGroup: "[lang]/(front-pages)",
    kind: "locale-adapter",
    canonicalOwner: "apps/web/src/components/scriptures-studio.tsx",
    localeBehavior: "localized-primary",
    access: "public",
  },
  {
    path: "/[lang]/codex",
    routeGroup: "[lang]/(front-pages)",
    kind: "locale-adapter",
    canonicalOwner: "apps/web/src/components/canon-codex-sanctum.tsx",
    localeBehavior: "localized-primary",
    access: "public",
  },
  {
    path: "/[lang]/mtime",
    routeGroup: "[lang]/(front-pages)",
    kind: "locale-adapter",
    canonicalOwner: "apps/web/src/components/mtime-observatory.tsx",
    localeBehavior: "localized-primary",
    access: "public",
  },
  {
    path: "/[lang]/moonwitness",
    routeGroup: "[lang]/(front-pages)",
    kind: "locale-adapter",
    canonicalOwner: "apps/web/src/components/landing/index.tsx",
    localeBehavior: "localized-primary",
    access: "public",
  },
];
