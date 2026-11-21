import { createHash } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  BaseRepository,
  compileTupleDomainToFilter,
  extendModel,
  getDb,
  modelRegistry,
  PolicyError,
  syncModels,
  SYSTEM_ACTOR,
  type ActorContext,
  type DefineModelReturn,
  type FieldPolicySpec,
  type Migration,
  type ModelExtensionDef,
  type RuntimeCustomFieldSpec,
  type SyncReport,
  type ZodObjectLike,
} from "@moonwitness/orm";
import { applyAddonOwnedMigrations } from "./addon.js";
import {
  irAddonModel,
  irCronModel,
  irMenuModel,
  irModelDataModel,
  irModelFieldModel,
  irModelRecord,
  irRuleModel,
  irSequenceModel,
  irSystemModels,
  irViewModel,
  resGroupsModel,
} from "./ir-models.js";
import {
  canReadField,
  getEffectiveFieldPolicies,
  resolveEffectiveGroups,
  type CrewRoleOrPublic,
} from "./field-policy.js";
export { resolveEffectiveGroups, type CrewRoleOrPublic };
import { opsJobModel } from "./job-queue.js";
import {
  AddonManifestSchema,
  AddonRegistry,
  AddonRegistryError,
  parseDependencySpec,
  planUpgrade,
  satisfiesSemVer,
  type AddonContext,
  type AddonManifest,
  type AddonManifestInput,
  type InstalledAddonSnapshot,
  type RegistryState,
  type UpgradePlan,
} from "./registry.js";
import { verifyAddonManifestSignature, type AddonSigningPolicy } from "./signing.js";

export type RecordRuleOperation = "read" | "create" | "update" | "delete";

export interface IrRuleInput {
  rule_key?: string;
  model_name: string;
  role?: CrewRoleOrPublic;
  scope?: "global" | "group";
  groups?: string[];
  can_read?: boolean;
  can_create?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
  domain?: Record<string, unknown> | unknown[];
}

export interface IrRuleRecordLike {
  rule_key?: string | null;
  model_name: string;
  role: CrewRoleOrPublic;
  scope?: "global" | "group" | null;
  groups_json?: string | null;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  domain_json?: string | null;
}

export interface RecordRuleEvaluationResult {
  allowed: boolean;
  domain: Record<string, unknown> | null;
}

export interface AddonDataRecord {
  id: string;
  model: string;
  key?: Record<string, unknown>;
  noupdate?: boolean;
  values: Record<string, unknown>;
}

export interface IrCronInput {
  cron_key: string;
  name: string;
  model_name: string;
  action_name: string;
  interval_sec?: number;
  active?: boolean;
  payload?: Record<string, unknown>;
}

export interface IrSequenceInput {
  code: string;
  name: string;
  prefix?: string;
  suffix?: string;
  padding?: number;
  number_next?: number;
  number_increment?: number;
}

export interface CustomActionSpec {
  id: string;
  label: string;
  method: "POST" | "PATCH" | "DELETE";
  urlTemplate: string;
  roles: Array<"admin" | "editor" | "viewer">;
}

export interface ActionBindingsSpec {
  listUrl?: string;
  createUrl?: string;
  updateUrl?: string;
  archiveUrl?: string;
  restoreUrl?: string;
  deleteUrl?: string;
  historyUrl?: string;
  customActions?: CustomActionSpec[];
}

export interface IrViewInput {
  model_name: string;
  view_type: "list" | "form" | "detail" | "kanban";
  priority?: number;
  actionBindings?: ActionBindingsSpec;
  spec: Record<string, unknown>;
}

export interface IrMenuInput {
  menu_key: string;
  parent_key?: string | null;
  label: string;
  href: string;
  icon?: string;
  plane?: "creator" | "operations" | "public";
  sort_order?: number;
  min_role?: CrewRoleOrPublic;
}

export type AddonInstallPhase = "schema_sync" | "migrations" | "metadata_sync" | "seed";

export interface AddonReconcileResult {
  addon: string;
  state: "installed" | "disabled" | "error";
  appliedMigrations: string[];
  skippedMigrations: string[];
  seeded: boolean;
}

export interface AddonDefinition {
  manifest: AddonManifestInput;
  models?: Array<DefineModelReturn<ZodObjectLike>>;
  migrations?: Migration[];
  extensions?: Array<{
    target: string;
    fields: ZodObjectLike;
    indexes?: Array<{ fields: string[]; unique?: boolean }>;
  }>;
  rules?: IrRuleInput[];
  views?: IrViewInput[];
  menus?: IrMenuInput[];
  data?: AddonDataRecord[];
  crons?: IrCronInput[];
  sequences?: IrSequenceInput[];
  shouldAutoEnable?: () => boolean;
  register?: (ctx: AddonContext) => Promise<void> | void;
  registerRoutes?: (scope: FastifyInstance) => Promise<void> | void;
  seed?: () => Promise<void> | void;
}

export interface RegisteredFieldMetadata {
  id: string;
  model_name: string;
  field_name: string;
  field_type: "text" | "integer" | "real" | "boolean" | "date" | "json" | "selection";
  nullable: boolean;
  required: boolean;
  deprecated: boolean;
  is_custom: boolean;
  origin_addon: string;
  ui_widget: string;
  label: string;
  selection: string[] | null;
  default_value: unknown;
}

export interface ModelAclFlags {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface RuntimeViewDescriptor {
  model: string;
  table: string;
  extensible: boolean;
  restEnabled: boolean;
  acl: ModelAclFlags;
  fields: RegisteredFieldMetadata[];
  views: Array<{
    view_type: "list" | "form" | "detail" | "kanban";
    addon: string;
    priority: number;
    spec: Record<string, unknown>;
  }>;
  actionBindings: ActionBindingsSpec;
  fieldPolicies?: Record<string, FieldPolicySpec>;
}

const ROLE_RANK: Record<CrewRoleOrPublic, number> = {
  public: 0,
  viewer: 1,
  editor: 2,
  admin: 3,
};

const CONSTITUTIONAL_BASE_DATA: AddonDataRecord[] = [
  {
    id: "company_default",
    model: "res.company",
    key: { slug: "default" },
    noupdate: true,
    values: {
      slug: "default",
      name: "Default Tenant",
      default_locale: "en",
      timezone: "UTC",
      currency: "USD",
      is_active: true,
    },
  },
  {
    id: "group_public",
    model: "res.groups",
    key: { group_key: "base.group_public" },
    noupdate: true,
    values: {
      group_key: "base.group_public",
      name: "Public Reader",
      category: "base",
      implied_ids_json: "[]",
      comment: "Anonymous or unauthenticated public visitors",
    },
  },
  {
    id: "group_viewer",
    model: "res.groups",
    key: { group_key: "base.group_viewer" },
    noupdate: true,
    values: {
      group_key: "base.group_viewer",
      name: "Crew Viewer",
      category: "base",
      implied_ids_json: '["base.group_public"]',
      comment: "Authenticated read-only operator",
    },
  },
  {
    id: "group_editor",
    model: "res.groups",
    key: { group_key: "base.group_editor" },
    noupdate: true,
    values: {
      group_key: "base.group_editor",
      name: "Crew Editor",
      category: "base",
      implied_ids_json: '["base.group_viewer"]',
      comment: "Editorial and operational contributor",
    },
  },
  {
    id: "group_system",
    model: "res.groups",
    key: { group_key: "base.group_system" },
    noupdate: true,
    values: {
      group_key: "base.group_system",
      name: "System Administrator",
      category: "base",
      implied_ids_json: '["base.group_editor"]',
      comment: "Full administrative access",
    },
  },
  {
    id: "lang_en",
    model: "res.lang",
    key: { code: "en" },
    noupdate: true,
    values: {
      code: "en",
      iso_code: "en-US",
      name: "English",
      direction: "ltr",
      date_format: "YYYY-MM-DD",
      active: true,
      is_default: true,
    },
  },
  {
    id: "lang_id",
    model: "res.lang",
    key: { code: "id" },
    noupdate: true,
    values: {
      code: "id",
      iso_code: "id-ID",
      name: "Bahasa Indonesia",
      direction: "ltr",
      date_format: "YYYY-MM-DD",
      active: true,
      is_default: false,
    },
  },
  {
    id: "country_id",
    model: "res.country",
    key: { code: "ID" },
    noupdate: true,
    values: {
      code: "ID",
      code3: "IDN",
      name: "Indonesia",
      native_name: "Indonesia",
      dial_code: "+62",
      currency_code: "IDR",
      flag_emoji: "🇮🇩",
      active: true,
    },
  },
  {
    id: "country_my",
    model: "res.country",
    key: { code: "MY" },
    noupdate: true,
    values: {
      code: "MY",
      code3: "MYS",
      name: "Malaysia",
      native_name: "Malaysia",
      dial_code: "+60",
      currency_code: "MYR",
      flag_emoji: "🇲🇾",
      active: true,
    },
  },
  {
    id: "country_sg",
    model: "res.country",
    key: { code: "SG" },
    noupdate: true,
    values: {
      code: "SG",
      code3: "SGP",
      name: "Singapore",
      native_name: "Singapore",
      dial_code: "+65",
      currency_code: "SGD",
      flag_emoji: "🇸🇬",
      active: true,
    },
  },
  {
    id: "country_us",
    model: "res.country",
    key: { code: "US" },
    noupdate: true,
    values: {
      code: "US",
      code3: "USA",
      name: "United States",
      native_name: "United States",
      dial_code: "+1",
      currency_code: "USD",
      flag_emoji: "🇺🇸",
      active: true,
    },
  },
  {
    id: "currency_idr",
    model: "res.currency",
    key: { code: "IDR" },
    noupdate: true,
    values: {
      code: "IDR",
      name: "Indonesian Rupiah",
      symbol: "Rp",
      decimals: 0,
      rounding: 1,
      active: true,
    },
  },
  {
    id: "currency_usd",
    model: "res.currency",
    key: { code: "USD" },
    noupdate: true,
    values: {
      code: "USD",
      name: "US Dollar",
      symbol: "$",
      decimals: 2,
      rounding: 0.01,
      active: true,
    },
  },
  {
    id: "currency_myr",
    model: "res.currency",
    key: { code: "MYR" },
    noupdate: true,
    values: {
      code: "MYR",
      name: "Malaysian Ringgit",
      symbol: "RM",
      decimals: 2,
      rounding: 0.01,
      active: true,
    },
  },
];

function defaultWidgetForField(type: string, selection: string[] | null): string {
  if (selection && selection.length > 0) return "select";
  switch (type) {
    case "boolean":
      return "checkbox";
    case "integer":
    case "real":
      return "number";
    case "date":
      return "date";
    case "json":
      return "json";
    default:
      return "text";
  }
}

function humanizeLabel(fieldName: string): string {
  return fieldName.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function resolveRuleDomainPlaceholders(
  value: unknown,
  actor: ActorContext,
  role: CrewRoleOrPublic,
): unknown {
  if (value === "$actor.id" || value === "$user.id" || value === "user.id") {
    return actor.actorId ?? "";
  }
  if (
    value === "$actor.tenantId" ||
    value === "$user.company_id" ||
    value === "$user.companyId" ||
    value === "user.company_id" ||
    value === "user.companyId"
  ) {
    return actor.tenantId ?? "default";
  }
  if (
    value === "$user.company_ids" ||
    value === "$user.companyIds" ||
    value === "user.company_ids" ||
    value === "user.companyIds"
  ) {
    return [actor.tenantId ?? "default"];
  }
  if (value === "$actor.role") return role;
  if (Array.isArray(value)) {
    return value.map((item) => resolveRuleDomainPlaceholders(item, actor, role));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = resolveRuleDomainPlaceholders(v, actor, role);
    }
    return out;
  }
  return value;
}

const SUPPORTED_DOMAIN_FIELD_OPS = new Set([
  "$ne",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$in",
  "$like",
  "$ilike",
  "$not",
]);

function isPlainDomainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)
  );
}

function validateFieldOperatorObject(field: string, value: Record<string, unknown>): void {
  const keys = Object.keys(value);
  if (keys.length === 0) {
    throw new PolicyError(
      `Rule domain operator object for '${field}' cannot be empty`,
      "INVALID_RULE_DOMAIN",
      400,
    );
  }
  for (const [op, opVal] of Object.entries(value)) {
    if (!SUPPORTED_DOMAIN_FIELD_OPS.has(op)) {
      throw new PolicyError(
        `Unsupported rule domain operator '${op}' on field '${field}'`,
        "INVALID_RULE_DOMAIN",
        400,
      );
    }
    if (op === "$in" && !Array.isArray(opVal)) {
      throw new PolicyError(
        `Rule domain operator '$in' on field '${field}' requires an array`,
        "INVALID_RULE_DOMAIN",
        400,
      );
    }
    if ((op === "$like" || op === "$ilike") && typeof opVal !== "string") {
      throw new PolicyError(
        `Rule domain operator '${op}' on field '${field}' requires a string`,
        "INVALID_RULE_DOMAIN",
        400,
      );
    }
    if (op === "$not" && isPlainDomainObject(opVal)) {
      validateFieldOperatorObject(field, opVal);
    }
  }
}

function validateRuleDomainAst(filter: unknown): Record<string, unknown> {
  if (!isPlainDomainObject(filter)) {
    throw new PolicyError(
      "Rule domain must resolve to a filter object or tuple array",
      "INVALID_RULE_DOMAIN",
      400,
    );
  }
  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined) continue;
    if (key === "$and" || key === "$or") {
      if (!Array.isArray(value)) {
        throw new PolicyError(
          `Rule domain operator '${key}' requires an array`,
          "INVALID_RULE_DOMAIN",
          400,
        );
      }
      for (const sub of value) {
        validateRuleDomainAst(sub);
      }
      continue;
    }
    if (key === "$not") {
      validateRuleDomainAst(value);
      continue;
    }
    if (key.startsWith("$")) {
      throw new PolicyError(
        `Unsupported rule domain operator '${key}'`,
        "INVALID_RULE_DOMAIN",
        400,
      );
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new PolicyError(`Invalid rule domain field '${key}'.`, "INVALID_RULE_DOMAIN", 400);
    }
    if (Array.isArray(value)) {
      throw new PolicyError(
        `Rule domain array value on '${key}' requires '$in' operator`,
        "INVALID_RULE_DOMAIN",
        400,
      );
    }
    if (isPlainDomainObject(value)) {
      validateFieldOperatorObject(key, value);
    }
  }
  return filter;
}

function parseStoredRuleDomain(
  domainJson: string,
  actor: ActorContext,
  role: CrewRoleOrPublic,
): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(domainJson) as unknown;
  } catch (err) {
    throw new PolicyError(
      `Malformed rule domain JSON: ${err instanceof Error ? err.message : String(err)}`,
      "INVALID_RULE_DOMAIN",
      400,
    );
  }
  const resolved = resolveRuleDomainPlaceholders(parsed, actor, role);
  if (Array.isArray(resolved)) {
    try {
      const compiled = compileTupleDomainToFilter(resolved);
      return validateRuleDomainAst(compiled);
    } catch (err) {
      if (err instanceof PolicyError) throw err;
      throw new PolicyError(
        err instanceof Error ? err.message : "Invalid tuple domain",
        "INVALID_RULE_DOMAIN",
        400,
      );
    }
  }
  return validateRuleDomainAst(resolved);
}

function parseRuleGroups(groupsJson?: string | null): string[] {
  if (!groupsJson || !groupsJson.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(groupsJson);
  } catch {
    throw new PolicyError("Malformed rule groups JSON", "INVALID_RULE_DOMAIN", 400);
  }
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw new PolicyError(
      "Rule groups_json must be a JSON string array",
      "INVALID_RULE_DOMAIN",
      400,
    );
  }
  return parsed.map((g) => g.trim()).filter(Boolean);
}

const OP_FLAG_MAP: Record<
  RecordRuleOperation,
  "can_read" | "can_create" | "can_update" | "can_delete"
> = {
  read: "can_read",
  create: "can_create",
  update: "can_update",
  delete: "can_delete",
};

function selectMatchingGroupRules(
  groupRules: IrRuleRecordLike[],
  role: CrewRoleOrPublic,
  effectiveGroups: Set<string>,
  actorGroups?: string[],
): { hasImplicitAdminBypass: boolean; matching: IrRuleRecordLike[] } {
  if (role === "admin") {
    const explicitAdminOrGroup = groupRules.filter((r) => {
      const ruleGroups = parseRuleGroups(r.groups_json);
      if (ruleGroups.length > 0) {
        return (
          ruleGroups.includes("base.group_system") ||
          Boolean(actorGroups?.some((ag) => ruleGroups.includes(ag)))
        );
      }
      return r.role === "admin";
    });
    if (explicitAdminOrGroup.length === 0) {
      return { hasImplicitAdminBypass: true, matching: [] };
    }
  }

  const userRank = ROLE_RANK[role] ?? 0;
  const matching = groupRules.filter((r) => {
    const ruleGroups = parseRuleGroups(r.groups_json);
    if (ruleGroups.length > 0) {
      return ruleGroups.some((g) => effectiveGroups.has(g));
    }
    return (ROLE_RANK[r.role] ?? 99) <= userRank;
  });
  return { hasImplicitAdminBypass: false, matching };
}

/**
 * Pure evaluator for operation-aware `ir_rules` supporting global (AND) and group (OR) rules.
 */
export function evaluateModelRecordRules(params: {
  rules: IrRuleRecordLike[];
  role: CrewRoleOrPublic;
  actor: ActorContext;
  operation: RecordRuleOperation;
  actorGroups?: string[];
  impliedGroups?: Map<string, string[]>;
}): RecordRuleEvaluationResult {
  const { rules, role, actor, operation, actorGroups, impliedGroups } = params;
  if (rules.length === 0) {
    return { allowed: role === "admin", domain: null };
  }

  const opFlag = OP_FLAG_MAP[operation];
  const effectiveGroups = resolveEffectiveGroups(role, actorGroups, impliedGroups);

  const globalRules = rules.filter((r) => r.scope === "global");
  const groupRules = rules.filter((r) => (r.scope ?? "group") !== "global");

  const applicableGlobal = globalRules.filter((r) => Boolean(r[opFlag]));
  const globalDomains: Array<Record<string, unknown>> = [];
  for (const rule of applicableGlobal) {
    if (!rule.domain_json || !rule.domain_json.trim()) continue;
    const parsed = parseStoredRuleDomain(rule.domain_json, actor, role);
    if (Object.keys(parsed).length > 0) {
      globalDomains.push(parsed);
    }
  }
  const globalDomain: Record<string, unknown> | null =
    globalDomains.length === 0
      ? null
      : globalDomains.length === 1
        ? globalDomains[0]!
        : { $and: globalDomains };

  if (groupRules.length === 0) {
    const allowed = role === "admin" ? true : applicableGlobal.length > 0;
    return { allowed, domain: allowed ? globalDomain : null };
  }

  const { hasImplicitAdminBypass, matching } = selectMatchingGroupRules(
    groupRules,
    role,
    effectiveGroups,
    actorGroups,
  );
  if (hasImplicitAdminBypass) {
    return { allowed: true, domain: globalDomain };
  }

  const allowedGroupRules = matching.filter((r) => Boolean(r[opFlag]));
  if (allowedGroupRules.length === 0) {
    return { allowed: false, domain: null };
  }

  let hasUnrestrictedGroupRule = false;
  const groupDomains: Array<Record<string, unknown>> = [];
  for (const rule of allowedGroupRules) {
    if (!rule.domain_json || !rule.domain_json.trim()) {
      hasUnrestrictedGroupRule = true;
      continue;
    }
    const parsed = parseStoredRuleDomain(rule.domain_json, actor, role);
    if (Object.keys(parsed).length === 0) {
      hasUnrestrictedGroupRule = true;
    } else {
      groupDomains.push(parsed);
    }
  }

  const groupDomain: Record<string, unknown> | null =
    hasUnrestrictedGroupRule || groupDomains.length === 0
      ? null
      : groupDomains.length === 1
        ? groupDomains[0]!
        : { $or: groupDomains };

  if (!globalDomain && !groupDomain) {
    return { allowed: true, domain: null };
  }
  if (globalDomain && !groupDomain) {
    return { allowed: true, domain: globalDomain };
  }
  if (!globalDomain && groupDomain) {
    return { allowed: true, domain: groupDomain };
  }
  return { allowed: true, domain: { $and: [globalDomain!, groupDomain!] } };
}

const ANSI_ESCAPE_REGEX = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

function sanitizeAddonError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const withoutAnsi = raw.replace(ANSI_ESCAPE_REGEX, "");
  const singleLine = withoutAnsi.replace(/[\r\n\t]+/g, " ").trim();
  const redacted = singleLine
    .replace(/:\/\/[^:\s/]+:[^@\s]+@/g, "://***:***@")
    .replace(/\b(password|secret|token|api[_-]?key)\s*[:=]\s*\S+/gi, "$1=[REDACTED]");
  return redacted.slice(0, 1000) || "Unknown addon lifecycle error";
}

function emptyRegistryState(): RegistryState {
  return {
    routes: new Set(),
    models: new Set(),
    migrations: new Set(),
    seeds: new Set(),
    permissions: new Set(),
    capabilities: new Set(),
  };
}

function claimIntoRegistryState(
  state: RegistryState,
  manifest: AddonManifest,
  def: AddonDefinition,
): void {
  for (const r of manifest.provides.routes) state.routes.add(r);
  for (const m of manifest.provides.models) state.models.add(m);
  for (const mig of def.migrations ?? []) state.migrations.add(mig.id);
  for (const mig of manifest.provides.migrations) state.migrations.add(mig);
  for (const s of manifest.provides.seeds) state.seeds.add(s);
  for (const p of manifest.provides.permissions) state.permissions.add(p);
  for (const c of manifest.capabilities) state.capabilities.add(c);
}

function mergeSyncReport(target: SyncReport, part: SyncReport): void {
  target.createdTables.push(...part.createdTables);
  target.addedColumns.push(...part.addedColumns);
  target.deprecatedColumns.push(...part.deprecatedColumns);
  target.createdIndexes.push(...part.createdIndexes);
  Object.assign(target.schemaHashes, part.schemaHashes);
}

export class AddonRuntimeController {
  private readonly definitions = new Map<
    string,
    { manifest: AddonManifest; def: AddonDefinition; extensionDefs: ModelExtensionDef[] }
  >();
  private readonly enabled = new Map<string, boolean>();
  private readonly modelOwners = new Map<string, string>();
  private readonly signingMetadata = new Map<
    string,
    { status: "verified" | "unsigned" | "invalid"; keyId: string | null }
  >();
  private lastLegacyBackfillTables: Set<string> | undefined;
  private order: string[] = [];

  isEnabled(addonName: string): boolean {
    return this.enabled.get(addonName) ?? false;
  }

  isModelEnabled(modelName: string): boolean {
    const owner = this.modelOwners.get(modelName);
    return owner ? this.isEnabled(owner) : true;
  }

  getOrder(): string[] {
    return [...this.order];
  }

  requireAddonEnabled(addonName: string) {
    return async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      if (!this.isEnabled(addonName)) {
        await reply.code(503).send({
          error: `Addon '${addonName}' is disabled`,
          code: "ADDON_DISABLED",
        });
      }
    };
  }

  async planUpgrade(
    addons: AddonDefinition[],
    options: { installedVersions?: Record<string, InstalledAddonSnapshot> } = {},
  ): Promise<UpgradePlan> {
    const dbSnapshots: Record<string, InstalledAddonSnapshot> = {};
    try {
      const db = getDb();
      const rows = await db.all<{ name: string; addon_version: string; state: string }>(
        "SELECT name, addon_version, state FROM ir_addons",
      );
      for (const row of rows) {
        dbSnapshots[row.name] = { version: row.addon_version, state: row.state };
      }
    } catch {
      // Database or ir_addons may not exist yet during dry-run planning.
    }
    return planUpgrade(addons, { ...dbSnapshots, ...options.installedVersions });
  }

  private assertDependenciesReady(addonName: string, manifest: AddonManifest, verb: string): void {
    for (const depRaw of manifest.depends) {
      const dep = parseDependencySpec(depRaw);
      if (!this.isEnabled(dep.name)) {
        throw new Error(`Cannot ${verb} '${addonName}': dependency '${dep.name}' is disabled.`);
      }
      if (dep.range !== null) {
        const depVersion = this.definitions.get(dep.name)?.manifest.version;
        if (!depVersion || !satisfiesSemVer(depVersion, dep.range)) {
          throw new Error(
            `Cannot ${verb} '${addonName}': dependency '${dep.name}' (${depVersion ?? "unknown"}) does not satisfy '${dep.range}'.`,
          );
        }
      }
    }
  }

  private async runAddonLifecycleTransaction(
    addonName: string,
    options: {
      runSeed: boolean;
      legacyBackfillTables?: Set<string>;
      loadedSoFar: string[];
      registryState: RegistryState;
      actor?: ActorContext;
      existingRow?: Awaited<ReturnType<typeof irAddonModel.repository.find>>[number];
    },
  ): Promise<{
    syncReport: SyncReport;
    appliedMigrations: string[];
    skippedMigrations: string[];
    seeded: boolean;
  }> {
    const entry = this.definitions.get(addonName)!;
    const actor = options.actor ?? SYSTEM_ACTOR;
    const existing =
      options.existingRow ?? (await irAddonModel.repository.find({ name: addonName }))[0];
    const sigMeta = this.signingMetadata.get(addonName) ?? {
      status: existing?.signature_status ?? ("unsigned" as const),
      keyId: existing?.signature_key_id ?? null,
    };

    const preState: "installing" | "upgrade_pending" =
      !existing || existing.state === "discovered" || existing.state === "installing"
        ? "installing"
        : existing.state === "error" &&
            existing.addon_version === entry.manifest.version &&
            existing.failed_phase !== null
          ? "installing"
          : "upgrade_pending";

    const persistedVersionBeforeCommit =
      existing &&
      existing.state === "installed" &&
      existing.addon_version !== entry.manifest.version
        ? existing.addon_version
        : entry.manifest.version;

    // Fail closed while transitioning through install/upgrade phases.
    this.enabled.set(addonName, false);
    await irAddonModel.repository.upsert(
      { name: addonName },
      {
        name: addonName,
        addon_version: persistedVersionBeforeCommit,
        description: entry.manifest.description ?? "",
        category: entry.manifest.category ?? "general",
        depends_json: JSON.stringify(entry.manifest.depends),
        provides_json: JSON.stringify(entry.manifest.provides),
        capabilities_json: JSON.stringify(entry.manifest.capabilities),
        schema_hash: existing?.schema_hash ?? "",
        state: preState,
        signature_status: sigMeta.status,
        signature_key_id: sigMeta.keyId,
        auto_install: entry.manifest.autoInstall,
        failed_phase: null,
        last_error: null,
      },
      actor,
    );

    const report: SyncReport = {
      createdTables: [],
      addedColumns: [],
      deprecatedColumns: [],
      createdIndexes: [],
      schemaHashes: {},
      missingFks: [],
      addedFks: [],
    };
    let appliedMigrations: string[] = [];
    let skippedMigrations: string[] = [];
    let seeded = false;
    let currentPhase: AddonInstallPhase = "schema_sync";

    try {
      // Phase 1: schema_sync
      currentPhase = "schema_sync";
      if (entry.def.extensions) {
        entry.extensionDefs.length = 0;
        for (const ext of entry.def.extensions) {
          const registeredExt = extendModel(ext.target, {
            addon: addonName,
            fields: ext.fields,
            indexes: ext.indexes,
          });
          entry.extensionDefs.push(registeredExt);
        }
      }

      const standardModelNames: string[] = [];
      const backfillModelNames: string[] = [];
      for (const model of entry.def.models ?? []) {
        if (options.legacyBackfillTables?.has(model.table)) {
          backfillModelNames.push(model.name);
        } else {
          standardModelNames.push(model.name);
        }
      }
      for (const ext of entry.def.extensions ?? []) {
        const targetDesc = modelRegistry.get(ext.target);
        if (targetDesc && options.legacyBackfillTables?.has(targetDesc.table)) {
          backfillModelNames.push(ext.target);
        } else {
          standardModelNames.push(ext.target);
        }
      }

      if (standardModelNames.length > 0) {
        mergeSyncReport(report, await syncModels(standardModelNames));
      }
      if (backfillModelNames.length > 0) {
        mergeSyncReport(report, await syncModels(backfillModelNames, { legacyBackfill: true }));
      }

      claimIntoRegistryState(options.registryState, entry.manifest, entry.def);
      if (entry.def.register) {
        await entry.def.register({
          loaded: [...options.loadedSoFar],
          state: options.registryState,
        });
      }

      // Phase 2: migrations
      currentPhase = "migrations";
      if (entry.def.migrations && entry.def.migrations.length > 0) {
        const migResult = await applyAddonOwnedMigrations(addonName, entry.def.migrations);
        appliedMigrations = migResult.applied;
        skippedMigrations = migResult.skipped;
      }

      // Phase 3: metadata_sync (IR models/fields/rules/views/menus/crons/sequences/declarative data)
      currentPhase = "metadata_sync";
      const deprecatedByTable = new Set(
        report.deprecatedColumns.map((d) => `${d.table}.${d.column}`),
      );
      await this.syncAddonIrMetadata(addonName, entry.def, deprecatedByTable);

      // Phase 4: seed
      currentPhase = "seed";
      if (options.runSeed && entry.def.seed) {
        await entry.def.seed();
        seeded = true;
      }

      // Commit installed state only after all phases succeed.
      const addonSchemaHash = this.computeAddonHash(entry.manifest, entry.def, report.schemaHashes);
      await irAddonModel.repository.upsert(
        { name: addonName },
        {
          name: addonName,
          addon_version: entry.manifest.version,
          description: entry.manifest.description ?? "",
          category: entry.manifest.category ?? "general",
          depends_json: JSON.stringify(entry.manifest.depends),
          provides_json: JSON.stringify(entry.manifest.provides),
          capabilities_json: JSON.stringify(entry.manifest.capabilities),
          schema_hash: addonSchemaHash,
          state: "installed",
          signature_status: sigMeta.status,
          signature_key_id: sigMeta.keyId,
          auto_install: entry.manifest.autoInstall,
          failed_phase: null,
          last_error: null,
        },
        actor,
      );

      this.enabled.set(addonName, true);
      options.loadedSoFar.push(addonName);

      return { syncReport: report, appliedMigrations, skippedMigrations, seeded };
    } catch (error) {
      this.enabled.set(addonName, false);
      await irAddonModel.repository.upsert(
        { name: addonName },
        {
          name: addonName,
          addon_version: persistedVersionBeforeCommit,
          description: entry.manifest.description ?? "",
          category: entry.manifest.category ?? "general",
          depends_json: JSON.stringify(entry.manifest.depends),
          provides_json: JSON.stringify(entry.manifest.provides),
          capabilities_json: JSON.stringify(entry.manifest.capabilities),
          schema_hash: existing?.schema_hash ?? "",
          state: "error",
          signature_status: sigMeta.status,
          signature_key_id: sigMeta.keyId,
          auto_install: entry.manifest.autoInstall,
          failed_phase: currentPhase,
          last_error: sanitizeAddonError(error),
        },
        actor,
      );
      throw error;
    }
  }

  async syncAll(
    addons: AddonDefinition[],
    fastify?: FastifyInstance,
    options: {
      runSeeds?: boolean;
      legacyBackfillTables?: Set<string>;
      signingPolicy?: AddonSigningPolicy;
      mode?: "full" | "edge";
    } = {},
  ): Promise<{ order: string[]; syncReport: SyncReport }> {
    const mode = options.mode ?? "full";
    this.definitions.clear();
    this.enabled.clear();
    this.modelOwners.clear();
    this.signingMetadata.clear();
    this.lastLegacyBackfillTables = options.legacyBackfillTables;

    const registry = new AddonRegistry();
    for (const def of addons) {
      const manifest = AddonManifestSchema.parse(def.manifest);
      const extensionDefs: ModelExtensionDef[] = [];
      this.definitions.set(manifest.name, { manifest, def, extensionDefs });
      for (const model of def.models ?? []) {
        this.modelOwners.set(model.name, manifest.name);
      }
      registry.add({
        manifest: def.manifest,
        migrations: def.migrations,
        register: def.register ?? (() => {}),
      });
    }

    const order = registry.validate();
    this.order = order;

    const signingMode = options.signingPolicy?.mode ?? "permissive";
    const trustedKeys = options.signingPolicy?.trustedKeys ?? [];
    for (const name of order) {
      const entry = this.definitions.get(name)!;
      const verification = verifyAddonManifestSignature(entry.manifest, trustedKeys);
      this.signingMetadata.set(name, {
        status: verification.status,
        keyId: verification.keyId,
      });
      if (signingMode === "strict" && verification.status !== "verified") {
        throw new AddonRegistryError(
          `Addon '${name}' rejected by strict signature policy (${verification.status}${verification.reason ? `: ${verification.reason}` : ""}).`,
        );
      }
    }

    if (mode === "edge") {
      const edgeModelNames = new Set<string>([irAddonModel.name]);
      for (const name of order) {
        const entry = this.definitions.get(name)!;
        for (const model of entry.def.models ?? []) {
          edgeModelNames.add(model.name);
        }
      }
      const report = await syncModels([...edgeModelNames]);
      const existingRows = await irAddonModel.repository.find();
      const existingByName = new Map(existingRows.map((row) => [row.name, row]));
      const loadedSoFar: string[] = [];
      const registryState = emptyRegistryState();

      for (const name of order) {
        const entry = this.definitions.get(name)!;
        const existing = existingByName.get(name);
        const sigMeta = this.signingMetadata.get(name) ?? {
          status: "unsigned" as const,
          keyId: null,
        };
        const wantsActive =
          existing !== undefined
            ? existing.state !== "disabled"
            : entry.def.shouldAutoEnable
              ? entry.def.shouldAutoEnable()
              : entry.manifest.autoInstall || entry.manifest.defaultEnabled;

        if (!wantsActive) {
          this.enabled.set(name, false);
          continue;
        }

        if (entry.def.migrations && entry.def.migrations.length > 0) {
          await applyAddonOwnedMigrations(name, entry.def.migrations);
        }
        claimIntoRegistryState(registryState, entry.manifest, entry.def);
        if (entry.def.register) {
          await entry.def.register({ loaded: [...loadedSoFar], state: registryState });
        }
        const addonSchemaHash = this.computeAddonHash(
          entry.manifest,
          entry.def,
          report.schemaHashes,
        );
        if (
          !existing ||
          existing.addon_version !== entry.manifest.version ||
          existing.schema_hash !== addonSchemaHash ||
          existing.state !== "installed"
        ) {
          await irAddonModel.repository.upsert(
            { name },
            {
              name,
              addon_version: entry.manifest.version,
              description: entry.manifest.description ?? "",
              category: entry.manifest.category ?? "general",
              depends_json: JSON.stringify(entry.manifest.depends),
              provides_json: JSON.stringify(entry.manifest.provides),
              capabilities_json: JSON.stringify(entry.manifest.capabilities),
              schema_hash: addonSchemaHash,
              state: "installed",
              signature_status: sigMeta.status,
              signature_key_id: sigMeta.keyId,
              auto_install: entry.manifest.autoInstall,
              failed_phase: null,
              last_error: null,
            },
            SYSTEM_ACTOR,
          );
        }
        this.enabled.set(name, true);
        loadedSoFar.push(name);
      }

      if (fastify) {
        for (const name of order) {
          const entry = this.definitions.get(name)!;
          if (!entry.def.registerRoutes) continue;
          await fastify.register(async (scope) => {
            scope.addHook("preHandler", this.requireAddonEnabled(name));
            await entry.def.registerRoutes!(scope);
          });
        }
      }

      return { order, syncReport: report };
    }

    await syncModels([...irSystemModels, opsJobModel]);
    await this.syncAddonDeclarativeData("__base", CONSTITUTIONAL_BASE_DATA);

    const existingRows = await irAddonModel.repository.find();
    const existingByName = new Map(existingRows.map((row) => [row.name, row]));

    // Load custom fields saved in ir_model_fields so ModelRegistry validates _attrs immediately.
    await this.reloadAllCustomFieldsIntoRegistry();

    const report: SyncReport = {
      createdTables: [],
      addedColumns: [],
      deprecatedColumns: [],
      createdIndexes: [],
      schemaHashes: {},
      missingFks: [],
      addedFks: [],
    };
    const loadedSoFar: string[] = [];
    const registryState = emptyRegistryState();
    let firstError: unknown = null;

    for (const name of order) {
      const entry = this.definitions.get(name)!;
      const existing = existingByName.get(name);
      const sigMeta = this.signingMetadata.get(name) ?? {
        status: "unsigned" as const,
        keyId: null,
      };
      const wantsActive =
        existing !== undefined
          ? existing.state !== "disabled"
          : entry.def.shouldAutoEnable
            ? entry.def.shouldAutoEnable()
            : entry.manifest.autoInstall || entry.manifest.defaultEnabled;

      if (!wantsActive) {
        this.enabled.set(name, false);
        const addonSchemaHash = this.computeAddonHash(
          entry.manifest,
          entry.def,
          report.schemaHashes,
        );
        await irAddonModel.repository.upsert(
          { name },
          {
            name,
            addon_version: entry.manifest.version,
            description: entry.manifest.description ?? "",
            category: entry.manifest.category ?? "general",
            depends_json: JSON.stringify(entry.manifest.depends),
            provides_json: JSON.stringify(entry.manifest.provides),
            capabilities_json: JSON.stringify(entry.manifest.capabilities),
            schema_hash: addonSchemaHash,
            state: "disabled",
            signature_status: sigMeta.status,
            signature_key_id: sigMeta.keyId,
            auto_install: entry.manifest.autoInstall,
            failed_phase: null,
            last_error: null,
          },
          SYSTEM_ACTOR,
        );
        continue;
      }

      const failedDep = entry.manifest.depends
        .map((depRaw) => parseDependencySpec(depRaw).name)
        .find((depName) => !this.isEnabled(depName));

      if (failedDep) {
        this.enabled.set(name, false);
        const blockedReason = `Blocked by inactive or failed dependency '${failedDep}'.`;
        await irAddonModel.repository.upsert(
          { name },
          {
            name,
            addon_version:
              existing && existing.state === "installed"
                ? existing.addon_version
                : entry.manifest.version,
            description: entry.manifest.description ?? "",
            category: entry.manifest.category ?? "general",
            depends_json: JSON.stringify(entry.manifest.depends),
            provides_json: JSON.stringify(entry.manifest.provides),
            capabilities_json: JSON.stringify(entry.manifest.capabilities),
            schema_hash: existing?.schema_hash ?? "",
            state: "error",
            signature_status: sigMeta.status,
            signature_key_id: sigMeta.keyId,
            auto_install: entry.manifest.autoInstall,
            failed_phase: null,
            last_error: blockedReason,
          },
          SYSTEM_ACTOR,
        );
        if (!firstError) {
          firstError = new Error(`Addon '${name}' cannot start: ${blockedReason}`);
        }
        continue;
      }

      const versionChanged = !existing || existing.addon_version !== entry.manifest.version;
      const incompleteOrFailed =
        !existing || existing.state !== "installed" || existing.failed_phase !== null;
      const shouldSeed = (options.runSeeds ?? true) && (versionChanged || incompleteOrFailed);

      try {
        const result = await this.runAddonLifecycleTransaction(name, {
          runSeed: shouldSeed,
          legacyBackfillTables: options.legacyBackfillTables,
          loadedSoFar,
          registryState,
          existingRow: existing,
        });
        mergeSyncReport(report, result.syncReport);
      } catch (error) {
        if (!firstError) firstError = error;
      }
    }

    // Pre-mount ALL workspace addon routes behind live `requireAddonEnabled()` guard so toggle and fail-closed 503 need zero restart.
    if (fastify) {
      for (const name of order) {
        const entry = this.definitions.get(name)!;
        if (!entry.def.registerRoutes) continue;
        await fastify.register(async (scope) => {
          scope.addHook("preHandler", this.requireAddonEnabled(name));
          await entry.def.registerRoutes!(scope);
        });
      }
    }

    if (firstError) {
      throw firstError;
    }

    return { order, syncReport: report };
  }

  private computeAddonHash(
    manifest: AddonManifest,
    def: AddonDefinition,
    modelHashes: Record<string, string>,
  ): string {
    const payload = {
      name: manifest.name,
      version: manifest.version,
      models: (def.models ?? []).map((m) => modelHashes[m.name] ?? m.name),
    };
    return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  }

  private async syncAddonDeclarativeData(
    addonName: string,
    records: AddonDataRecord[],
  ): Promise<void> {
    for (const record of records) {
      const desc = modelRegistry.get(record.model);
      if (!desc) continue;
      const repo = new BaseRepository(
        desc.name,
        desc.table,
        desc.fullSchema,
        desc.softDelete,
        desc.fields,
      );
      const noupdate = record.noupdate ?? true;
      const existingData = (
        await irModelDataModel.repository.find({
          module: addonName,
          name: record.id,
        })
      )[0];

      if (existingData) {
        const currentTarget = await repo.findOne(existingData.res_id, {
          includeDeleted: true,
        });
        if (currentTarget && existingData.noupdate) {
          continue;
        }
        if (currentTarget && !existingData.noupdate) {
          await repo.update(existingData.res_id, record.values, SYSTEM_ACTOR);
          continue;
        }
      }

      let savedId: string;
      if (record.key && Object.keys(record.key).length > 0) {
        const saved = await repo.upsert(record.key, record.values, SYSTEM_ACTOR);
        savedId = String((saved as { id: unknown }).id);
      } else {
        const created = await repo.create(record.values, SYSTEM_ACTOR);
        savedId = String((created as { id: unknown }).id);
      }

      await irModelDataModel.repository.upsert(
        { module: addonName, name: record.id },
        {
          module: addonName,
          name: record.id,
          model: record.model,
          res_id: savedId,
          noupdate,
        },
        SYSTEM_ACTOR,
      );
    }
  }

  private async syncAddonIrMetadata(
    addonName: string,
    def: AddonDefinition,
    deprecatedByTable: Set<string>,
  ): Promise<void> {
    const targets = new Map<string, string>();
    for (const model of def.models ?? []) {
      targets.set(model.name, addonName);
    }
    for (const ext of def.extensions ?? []) {
      if (!targets.has(ext.target)) targets.set(ext.target, addonName);
    }

    for (const model of def.models ?? []) {
      const desc = modelRegistry.get(model.name);
      if (!desc) continue;
      await irModelRecord.repository.upsert(
        { name: desc.name },
        {
          name: desc.name,
          addon: addonName,
          table_name: desc.table,
          extensible: desc.extensible,
          soft_delete: desc.softDelete,
          rest_enabled: desc.restEnabled,
          schema_json: JSON.stringify({
            publicFields: desc.publicFields ?? [],
            indexes: desc.indexes,
            searchFields: desc.searchFields ?? [],
            actions: Object.keys(desc.actions ?? {}),
          }),
        },
        SYSTEM_ACTOR,
      );
    }

    for (const [modelName] of targets) {
      const desc = modelRegistry.get(modelName);
      if (!desc) continue;
      for (const [fieldName, spec] of desc.fields) {
        if (fieldName === "_attrs") continue;
        const originAddon = desc.fieldOrigins.get(fieldName) ?? addonName;
        if (originAddon !== addonName && originAddon !== desc.name) continue;
        const selection = spec.enumValues ? [...spec.enumValues] : null;
        await irModelFieldModel.repository.upsert(
          { model_name: desc.name, field_name: fieldName },
          {
            model_name: desc.name,
            field_name: fieldName,
            field_type: spec.zodTypeLabel as
              "text" | "integer" | "real" | "boolean" | "date" | "json" | "selection",
            nullable: spec.nullable,
            required: !spec.nullable && !spec.optional,
            deprecated: deprecatedByTable.has(`${desc.table}.${fieldName}`),
            is_custom: false,
            origin_addon: originAddon === desc.name ? addonName : originAddon,
            ui_widget: defaultWidgetForField(spec.zodTypeLabel, selection),
            label: humanizeLabel(fieldName),
            selection_json: selection ? JSON.stringify(selection) : null,
            default_json: spec.hasDefault ? JSON.stringify(spec.defaultValue ?? null) : null,
          },
          SYSTEM_ACTOR,
        );
      }
    }

    const declaredGroupKeys = new Set<string>();
    for (const item of def.data ?? []) {
      if (item.model === "res.groups" && typeof item.values.group_key === "string") {
        declaredGroupKeys.add(item.values.group_key);
      }
    }
    const hasFieldPolicyGroups = (def.models ?? []).some((m) =>
      Object.values(modelRegistry.get(m.name)?.fieldPolicies ?? {}).some(
        (p) => (p.readGroups?.length ?? 0) > 0 || (p.writeGroups?.length ?? 0) > 0,
      ),
    );
    const existingGroupRows =
      (def.rules ?? []).some((r) => (r.groups?.length ?? 0) > 0) || hasFieldPolicyGroups
        ? await resGroupsModel.repository.find({})
        : [];
    const registeredGroupKeys = new Set<string>([
      ...existingGroupRows.map((g) => g.group_key),
      ...declaredGroupKeys,
    ]);

    for (const m of def.models ?? []) {
      const desc = modelRegistry.get(m.name);
      for (const [fieldName, policy] of Object.entries(desc?.fieldPolicies ?? {})) {
        for (const [policyKey, groupList] of [
          ["readGroups", policy.readGroups],
          ["writeGroups", policy.writeGroups],
        ] as const) {
          if (!groupList) continue;
          const cleaned = groupList.map((g) => g.trim()).filter(Boolean);
          if (cleaned.length !== groupList.length) {
            throw new Error(
              `Field policy '${policyKey}' on '${m.name}.${fieldName}' contains an empty group reference.`,
            );
          }
          if (cleaned.length > 0 && registeredGroupKeys.size > 0) {
            for (const groupKey of cleaned) {
              if (!registeredGroupKeys.has(groupKey)) {
                throw new Error(
                  `Field policy '${policyKey}' on '${m.name}.${fieldName}' references unknown group '${groupKey}'.`,
                );
              }
            }
          }
        }
      }
    }

    for (const rule of def.rules ?? []) {
      const role: CrewRoleOrPublic = rule.role ?? "public";
      const scope = rule.scope ?? "group";
      const groups = (rule.groups ?? []).map((g) => g.trim()).filter(Boolean);
      if (rule.groups && groups.length !== rule.groups.length) {
        throw new Error(`Rule for '${rule.model_name}' contains an empty group reference.`);
      }
      if (groups.length > 0 && registeredGroupKeys.size > 0) {
        for (const groupKey of groups) {
          if (!registeredGroupKeys.has(groupKey)) {
            throw new Error(
              `Rule '${rule.rule_key ?? `${rule.model_name}::${role}`}' references unknown group '${groupKey}'.`,
            );
          }
        }
      }
      const ruleKey = rule.rule_key ?? `${rule.model_name}::${role}`;
      const payload = {
        rule_key: ruleKey,
        model_name: rule.model_name,
        role,
        addon: addonName,
        scope,
        groups_json: JSON.stringify(groups),
        can_read: rule.can_read ?? false,
        can_create: rule.can_create ?? false,
        can_update: rule.can_update ?? false,
        can_delete: rule.can_delete ?? false,
        domain_json: rule.domain ? JSON.stringify(rule.domain) : null,
      };
      if (rule.rule_key) {
        await irRuleModel.repository.upsert({ rule_key: rule.rule_key }, payload, SYSTEM_ACTOR);
      } else {
        const candidates = await irRuleModel.repository.find({
          model_name: rule.model_name,
          role,
        });
        const legacyMatch = candidates.find(
          (row) => row.rule_key === null || row.rule_key === ruleKey,
        );
        if (legacyMatch) {
          await irRuleModel.repository.update(legacyMatch.id, payload, SYSTEM_ACTOR);
        } else {
          await irRuleModel.repository.create(payload, SYSTEM_ACTOR);
        }
      }
    }

    for (const view of def.views ?? []) {
      await irViewModel.repository.upsert(
        { model_name: view.model_name, view_type: view.view_type, addon: addonName },
        {
          model_name: view.model_name,
          view_type: view.view_type,
          addon: addonName,
          priority: view.priority ?? 10,
          action_bindings_json: view.actionBindings ? JSON.stringify(view.actionBindings) : null,
          spec_json: JSON.stringify(view.spec),
        },
        SYSTEM_ACTOR,
      );
    }

    for (const menu of def.menus ?? []) {
      await irMenuModel.repository.upsert(
        { menu_key: menu.menu_key },
        {
          menu_key: menu.menu_key,
          addon: addonName,
          parent_key: menu.parent_key ?? null,
          label: menu.label,
          href: menu.href,
          icon: menu.icon ?? "dot",
          plane: menu.plane ?? "creator",
          sort_order: menu.sort_order ?? 50,
          min_role: menu.min_role ?? "viewer",
        },
        SYSTEM_ACTOR,
      );
    }

    for (const seq of def.sequences ?? []) {
      const existingSeq = (await irSequenceModel.repository.find({ code: seq.code }))[0];
      if (!existingSeq) {
        await irSequenceModel.repository.create(
          {
            code: seq.code,
            name: seq.name,
            prefix: seq.prefix ?? "",
            suffix: seq.suffix ?? "",
            padding: seq.padding ?? 4,
            number_next: seq.number_next ?? 1,
            number_increment: seq.number_increment ?? 1,
            active: true,
          },
          SYSTEM_ACTOR,
        );
      }
    }

    for (const cron of def.crons ?? []) {
      await irCronModel.repository.upsert(
        { cron_key: cron.cron_key },
        {
          cron_key: cron.cron_key,
          name: cron.name,
          addon: addonName,
          model_name: cron.model_name,
          action_name: cron.action_name,
          interval_sec: cron.interval_sec ?? 300,
          active: cron.active ?? true,
          payload_json: JSON.stringify(cron.payload ?? {}),
        },
        SYSTEM_ACTOR,
      );
    }

    if (def.data && def.data.length > 0) {
      await this.syncAddonDeclarativeData(addonName, def.data);
    }
  }

  private async reloadAllCustomFieldsIntoRegistry(): Promise<void> {
    const rows = await irModelFieldModel.repository.find({ is_custom: true });
    const byModel = new Map<string, RuntimeCustomFieldSpec[]>();
    for (const row of rows) {
      if (row.deprecated) continue;
      const list = byModel.get(row.model_name) ?? [];
      list.push({
        field_name: row.field_name,
        field_type: row.field_type,
        required: row.required,
        nullable: row.nullable,
        selection: row.selection_json ? (JSON.parse(row.selection_json) as string[]) : undefined,
        default_value: row.default_json ? JSON.parse(row.default_json) : undefined,
        ui_widget: row.ui_widget,
        label: row.label,
      });
      byModel.set(row.model_name, list);
    }
    for (const [modelName, fields] of byModel) {
      modelRegistry.setRuntimeCustomFields(modelName, fields);
    }
  }

  async enable(addonName: string, actor: ActorContext = SYSTEM_ACTOR): Promise<void> {
    const entry = this.definitions.get(addonName);
    if (!entry) {
      throw new Error(`Unknown addon '${addonName}'.`);
    }
    this.assertDependenciesReady(addonName, entry.manifest, "enable");

    const loadedSoFar = [...this.enabled.entries()]
      .filter(([, active]) => active)
      .map(([name]) => name);
    await this.runAddonLifecycleTransaction(addonName, {
      runSeed: true,
      legacyBackfillTables: this.lastLegacyBackfillTables,
      loadedSoFar,
      registryState: emptyRegistryState(),
      actor,
    });
  }

  async reconcileAddon(
    addonName: string,
    options: { runSeeds?: boolean; forceSeed?: boolean; enableIfDisabled?: boolean } = {},
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<AddonReconcileResult> {
    const entry = this.definitions.get(addonName);
    if (!entry) {
      throw new Error(`Unknown addon '${addonName}'.`);
    }

    const existing = (await irAddonModel.repository.find({ name: addonName }))[0];
    if (existing?.state === "disabled" && !options.enableIfDisabled) {
      this.enabled.set(addonName, false);
      return {
        addon: addonName,
        state: "disabled",
        appliedMigrations: [],
        skippedMigrations: [],
        seeded: false,
      };
    }

    this.assertDependenciesReady(addonName, entry.manifest, "reconcile");

    const versionChanged = !existing || existing.addon_version !== entry.manifest.version;
    const incompleteOrFailed =
      !existing || existing.state !== "installed" || existing.failed_phase !== null;
    const shouldSeed =
      (options.runSeeds ?? true) &&
      (Boolean(options.forceSeed) || versionChanged || incompleteOrFailed);

    const loadedSoFar = [...this.enabled.entries()]
      .filter(([, active]) => active)
      .map(([name]) => name);
    const result = await this.runAddonLifecycleTransaction(addonName, {
      runSeed: shouldSeed,
      legacyBackfillTables: this.lastLegacyBackfillTables,
      loadedSoFar,
      registryState: emptyRegistryState(),
      actor,
      existingRow: existing,
    });

    return {
      addon: addonName,
      state: "installed",
      appliedMigrations: result.appliedMigrations,
      skippedMigrations: result.skippedMigrations,
      seeded: result.seeded,
    };
  }

  async disable(addonName: string, actor: ActorContext = SYSTEM_ACTOR): Promise<void> {
    if (addonName === "__base") {
      throw new Error("Cannot disable foundation addon '__base'.");
    }
    const entry = this.definitions.get(addonName);
    if (!entry) {
      throw new Error(`Unknown addon '${addonName}'.`);
    }
    for (const [otherName, otherEntry] of this.definitions) {
      if (otherName !== addonName && this.isEnabled(otherName)) {
        if (
          otherEntry.manifest.depends.some((dep) => parseDependencySpec(dep).name === addonName)
        ) {
          throw new Error(
            `Cannot disable '${addonName}': active addon '${otherName}' depends on it.`,
          );
        }
      }
    }

    const existing = await irAddonModel.repository.find({ name: addonName });
    if (existing[0]) {
      await irAddonModel.repository.update(
        existing[0].id,
        { state: "disabled", failed_phase: null, last_error: null },
        actor,
      );
    }
    this.enabled.set(addonName, false);
  }

  async listAddons() {
    return irAddonModel.repository.find({}, { orderBy: "name ASC" });
  }

  async registerCustomField(
    modelName: string,
    input: {
      field_name: string;
      field_type: "text" | "integer" | "real" | "boolean" | "date" | "json" | "selection";
      nullable?: boolean;
      required?: boolean;
      ui_widget?: string;
      label?: string;
      selection?: string[];
      default_value?: unknown;
    },
    actor: ActorContext = SYSTEM_ACTOR,
  ) {
    const desc = modelRegistry.get(modelName);
    if (!desc) {
      throw new Error(`Unknown model '${modelName}'.`);
    }
    if (!desc.extensible) {
      throw new Error(`Model '${modelName}' is not extensible.`);
    }

    const saved = await irModelFieldModel.repository.upsert(
      { model_name: modelName, field_name: input.field_name },
      {
        model_name: modelName,
        field_name: input.field_name,
        field_type: input.field_type,
        nullable: input.nullable ?? !input.required,
        required: input.required ?? false,
        deprecated: false,
        is_custom: true,
        origin_addon: "__runtime",
        ui_widget:
          input.ui_widget ?? defaultWidgetForField(input.field_type, input.selection ?? null),
        label: input.label ?? humanizeLabel(input.field_name),
        selection_json: input.selection ? JSON.stringify(input.selection) : null,
        default_json:
          input.default_value !== undefined ? JSON.stringify(input.default_value) : null,
      },
      actor,
    );

    await this.reloadAllCustomFieldsIntoRegistry();
    return saved;
  }

  async updateCustomField(
    fieldId: string,
    patch: {
      label?: string;
      required?: boolean;
      nullable?: boolean;
      deprecated?: boolean;
      ui_widget?: string;
      selection?: string[];
      default_value?: unknown;
    },
    actor: ActorContext = SYSTEM_ACTOR,
  ) {
    const current = await irModelFieldModel.repository.findOne(fieldId);
    if (!current) return null;
    const payload: Record<string, unknown> = {};
    if (patch.label !== undefined) payload.label = patch.label;
    if (patch.required !== undefined) payload.required = patch.required;
    if (patch.nullable !== undefined) payload.nullable = patch.nullable;
    if (patch.deprecated !== undefined) payload.deprecated = patch.deprecated;
    if (patch.ui_widget !== undefined) payload.ui_widget = patch.ui_widget;
    if (patch.selection !== undefined) payload.selection_json = JSON.stringify(patch.selection);
    if (patch.default_value !== undefined)
      payload.default_json = JSON.stringify(patch.default_value);

    const updated = await irModelFieldModel.repository.update(fieldId, payload, actor);
    await this.reloadAllCustomFieldsIntoRegistry();
    return updated;
  }

  async getNavigationForRole(role: CrewRoleOrPublic) {
    const rank = ROLE_RANK[role] ?? 0;
    const rows = await irMenuModel.repository.find({}, { orderBy: "sort_order ASC" });
    return rows.filter(
      (menu) => this.isEnabled(menu.addon) && (ROLE_RANK[menu.min_role] ?? 99) <= rank,
    );
  }

  private async loadImpliedGroupsMap(): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    const rows = await resGroupsModel.repository.find({});
    for (const row of rows) {
      try {
        const parsed = JSON.parse(row.implied_ids_json) as unknown;
        if (Array.isArray(parsed)) {
          map.set(
            row.group_key,
            parsed.filter((item): item is string => typeof item === "string"),
          );
        }
      } catch {
        // Keep empty implications for malformed group rows.
      }
    }
    return map;
  }

  async resolveEffectiveActorGroups(
    role: CrewRoleOrPublic,
    actorGroups?: Iterable<string>,
  ): Promise<Set<string>> {
    const impliedGroups = await this.loadImpliedGroupsMap();
    return resolveEffectiveGroups(role, actorGroups, impliedGroups);
  }

  async getImpliedGroupsMap(): Promise<Map<string, string[]>> {
    return this.loadImpliedGroupsMap();
  }

  private evaluateOperationFlag(params: {
    rules: IrRuleRecordLike[];
    role: CrewRoleOrPublic;
    operation: RecordRuleOperation;
    actorGroups?: string[];
    impliedGroups?: Map<string, string[]>;
  }): boolean {
    const { rules, role, operation, actorGroups, impliedGroups } = params;
    if (rules.length === 0) return role === "admin";
    const opFlag = OP_FLAG_MAP[operation];
    const effectiveGroups = resolveEffectiveGroups(role, actorGroups, impliedGroups);
    const globalRules = rules.filter((r) => r.scope === "global");
    const groupRules = rules.filter((r) => (r.scope ?? "group") !== "global");
    if (groupRules.length === 0) {
      return role === "admin" ? true : globalRules.some((r) => Boolean(r[opFlag]));
    }
    const { hasImplicitAdminBypass, matching } = selectMatchingGroupRules(
      groupRules,
      role,
      effectiveGroups,
      actorGroups,
    );
    if (hasImplicitAdminBypass) return true;
    return matching.some((r) => Boolean(r[opFlag]));
  }

  async getModelPermissions(
    modelName: string,
    role: CrewRoleOrPublic,
    actorGroups?: string[],
  ): Promise<ModelAclFlags> {
    const [rules, impliedGroups] = await Promise.all([
      irRuleModel.repository.find({ model_name: modelName }),
      this.loadImpliedGroupsMap(),
    ]);
    return {
      canRead: this.evaluateOperationFlag({
        rules,
        role,
        operation: "read",
        actorGroups,
        impliedGroups,
      }),
      canCreate: this.evaluateOperationFlag({
        rules,
        role,
        operation: "create",
        actorGroups,
        impliedGroups,
      }),
      canUpdate: this.evaluateOperationFlag({
        rules,
        role,
        operation: "update",
        actorGroups,
        impliedGroups,
      }),
      canDelete: this.evaluateOperationFlag({
        rules,
        role,
        operation: "delete",
        actorGroups,
        impliedGroups,
      }),
    };
  }

  async evaluateRuleForOperation(
    modelName: string,
    role: CrewRoleOrPublic,
    actor: ActorContext,
    operation: RecordRuleOperation,
    actorGroups?: string[],
  ): Promise<RecordRuleEvaluationResult> {
    const [rules, impliedGroups] = await Promise.all([
      irRuleModel.repository.find({ model_name: modelName }),
      this.loadImpliedGroupsMap(),
    ]);
    return evaluateModelRecordRules({
      rules,
      role,
      actor,
      operation,
      actorGroups,
      impliedGroups,
    });
  }

  async getModelRuleDomain(
    modelName: string,
    role: CrewRoleOrPublic,
    actor: ActorContext,
    operation: RecordRuleOperation = "read",
    actorGroups?: string[],
  ): Promise<Record<string, unknown> | null> {
    const result = await this.evaluateRuleForOperation(
      modelName,
      role,
      actor,
      operation,
      actorGroups,
    );
    return result.domain;
  }

  /**
   * Harvested from `moon-orm/src/view-contract.ts`: verifies that every column
   * referenced in registered `ir_views` exists on its target model.
   */
  async validateViewContracts(): Promise<
    Array<{ model: string; viewType: string; field: string; reason: string }>
  > {
    const issues: Array<{ model: string; viewType: string; field: string; reason: string }> = [];
    const viewRows = await irViewModel.repository.find({});
    for (const v of viewRows) {
      if (!this.isEnabled(v.addon)) continue;
      const desc = modelRegistry.get(v.model_name);
      if (!desc) {
        issues.push({
          model: v.model_name,
          viewType: v.view_type,
          field: "",
          reason: "unknown-model",
        });
        continue;
      }
      const spec = JSON.parse(v.spec_json) as { columns?: string[]; groupBy?: string };
      for (const col of spec.columns ?? []) {
        if (!desc.fields.has(col) && col !== "id" && col !== "status") {
          issues.push({
            model: v.model_name,
            viewType: v.view_type,
            field: col,
            reason: "unknown-field",
          });
        }
      }
      if (spec.groupBy && !desc.fields.has(spec.groupBy) && spec.groupBy !== "status") {
        issues.push({
          model: v.model_name,
          viewType: v.view_type,
          field: spec.groupBy,
          reason: "unknown-field",
        });
      }
    }
    return issues;
  }

  async getViewDescriptor(
    modelName: string,
    role: CrewRoleOrPublic,
    actorGroups?: Iterable<string>,
  ): Promise<RuntimeViewDescriptor | null> {
    const desc = modelRegistry.get(modelName);
    if (!desc) return null;
    if (!this.isModelEnabled(modelName)) return null;
    const modelMeta = (await irModelRecord.repository.find({ name: modelName }))[0];
    if (modelMeta && !this.isEnabled(modelMeta.addon)) {
      return null;
    }

    const actorGroupList = actorGroups ? [...actorGroups] : undefined;
    const [acl, effectiveGroups] = await Promise.all([
      this.getModelPermissions(modelName, role, actorGroupList),
      this.resolveEffectiveActorGroups(role, actorGroupList),
    ]);
    if (!acl.canRead) return null;

    const fieldRows = await irModelFieldModel.repository.find({ model_name: modelName });
    let fields: RegisteredFieldMetadata[] = fieldRows
      .filter((f) => !f.deprecated && canReadField(desc, f.field_name, role, effectiveGroups))
      .map((f) => ({
        id: f.id,
        model_name: f.model_name,
        field_name: f.field_name,
        field_type: f.field_type,
        nullable: f.nullable,
        required: f.required,
        deprecated: f.deprecated,
        is_custom: f.is_custom,
        origin_addon: f.origin_addon,
        ui_widget: f.ui_widget,
        label: f.label,
        selection: f.selection_json ? (JSON.parse(f.selection_json) as string[]) : null,
        default_value: f.default_json ? JSON.parse(f.default_json) : undefined,
      }));

    if (fields.length === 0) {
      fields = [...desc.fields.entries()]
        .filter(
          ([fieldName]) =>
            fieldName !== "_attrs" && canReadField(desc, fieldName, role, effectiveGroups),
        )
        .map(([fieldName, spec]) => {
          const selection = spec.enumValues ? [...spec.enumValues] : null;
          return {
            id: `${modelName}:${fieldName}`,
            model_name: modelName,
            field_name: fieldName,
            field_type: spec.zodTypeLabel as
              "text" | "integer" | "real" | "boolean" | "date" | "json" | "selection",
            nullable: spec.nullable,
            required: !spec.nullable && !spec.optional,
            deprecated: false,
            is_custom: false,
            origin_addon: desc.fieldOrigins.get(fieldName) ?? modelMeta?.addon ?? "__base",
            ui_widget: defaultWidgetForField(spec.zodTypeLabel, selection),
            label: humanizeLabel(fieldName),
            selection,
            default_value: spec.hasDefault ? (spec.defaultValue ?? null) : undefined,
          };
        });
    }

    const viewRows = await irViewModel.repository.find(
      { model_name: modelName },
      { orderBy: "priority ASC" },
    );
    const activeViews = viewRows.filter((v) => this.isEnabled(v.addon));
    const modelCustomActions: CustomActionSpec[] = Object.entries(desc.actions ?? {}).map(
      ([actionId, actionDef]) => ({
        id: actionId,
        label: actionDef.label ?? humanizeLabel(actionId),
        method: "POST",
        urlTemplate:
          (actionDef.scope ?? "record") === "model"
            ? `/api/v1/m/${encodeURIComponent(modelName)}/call/${encodeURIComponent(actionId)}`
            : `/api/v1/m/${encodeURIComponent(modelName)}/{id}/call/${encodeURIComponent(actionId)}`,
        roles: (actionDef.roles ?? ["editor", "admin"]).filter(
          (r): r is "admin" | "editor" | "viewer" => r !== "public",
        ),
      }),
    );

    let actionBindings: ActionBindingsSpec = desc.restEnabled
      ? {
          listUrl: `/api/v1/m/${encodeURIComponent(modelName)}`,
          createUrl: `/api/v1/m/${encodeURIComponent(modelName)}`,
          updateUrl: `/api/v1/m/${encodeURIComponent(modelName)}/{id}`,
          archiveUrl: `/api/v1/m/${encodeURIComponent(modelName)}/{id}/archive`,
          restoreUrl: `/api/v1/m/${encodeURIComponent(modelName)}/{id}/restore`,
          deleteUrl: `/api/v1/m/${encodeURIComponent(modelName)}/{id}`,
          historyUrl: `/api/v1/m/${encodeURIComponent(modelName)}/{id}/history`,
          ...(modelCustomActions.length > 0 ? { customActions: modelCustomActions } : {}),
        }
      : {};

    for (const v of activeViews) {
      if (v.action_bindings_json) {
        actionBindings = {
          ...actionBindings,
          ...(JSON.parse(v.action_bindings_json) as ActionBindingsSpec),
        };
      }
    }

    const mappedViews: RuntimeViewDescriptor["views"] =
      activeViews.length > 0
        ? activeViews.map((v) => {
            const spec = JSON.parse(v.spec_json) as Record<string, unknown>;
            if (Array.isArray(spec.columns)) {
              spec.columns = spec.columns.filter(
                (col): col is string =>
                  typeof col === "string" && canReadField(desc, col, role, effectiveGroups),
              );
            }
            return {
              view_type: v.view_type,
              addon: v.addon,
              priority: v.priority,
              spec,
            };
          })
        : [
            {
              view_type: "list",
              addon: "__auto",
              priority: 99,
              spec: {
                title: humanizeLabel(modelName.replace(/\./g, "_")),
                columns: fields
                  .filter((f) => f.field_type !== "json")
                  .slice(0, 8)
                  .map((f) => f.field_name),
                searchKeys: (desc.searchFields ?? []).filter((f) =>
                  canReadField(desc, f, role, effectiveGroups),
                ),
              },
            },
          ];

    return {
      model: modelName,
      table: desc.table,
      extensible: desc.extensible,
      restEnabled: desc.restEnabled,
      acl,
      fields,
      views: mappedViews,
      actionBindings,
      ...(role === "admin" ? { fieldPolicies: getEffectiveFieldPolicies(desc) } : {}),
    };
  }
}
