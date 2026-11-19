import { createHash } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  BaseRepository,
  compileTupleDomainToFilter,
  extendModel,
  modelRegistry,
  syncModels,
  SYSTEM_ACTOR,
  type ActorContext,
  type DefineModelReturn,
  type ModelExtensionDef,
  type RuntimeCustomFieldSpec,
  type SyncReport,
  type ZodObjectLike,
} from "@moonwitness/orm";
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
} from "./ir-models.js";
import { opsJobModel } from "./job-queue.js";
import {
  AddonManifestSchema,
  AddonRegistry,
  AddonRegistryError,
  type AddonContext,
  type AddonManifest,
  type AddonManifestInput,
} from "./registry.js";
import { verifyAddonManifestSignature, type AddonSigningPolicy } from "./signing.js";

export type CrewRoleOrPublic = "admin" | "editor" | "viewer" | "public";

export interface IrRuleInput {
  model_name: string;
  role: CrewRoleOrPublic;
  can_read?: boolean;
  can_create?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
  domain?: Record<string, unknown> | unknown[];
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

export interface AddonDefinition {
  manifest: AddonManifestInput;
  models?: Array<DefineModelReturn<ZodObjectLike>>;
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

function parseStoredRuleDomain(
  domainJson: string,
  actor: ActorContext,
  role: CrewRoleOrPublic,
): Record<string, unknown> {
  const parsed = JSON.parse(domainJson) as unknown;
  const resolved = resolveRuleDomainPlaceholders(parsed, actor, role);
  if (Array.isArray(resolved)) {
    return compileTupleDomainToFilter(resolved);
  }
  return (resolved ?? {}) as Record<string, unknown>;
}

export class AddonRuntimeController {
  private readonly definitions = new Map<
    string,
    { manifest: AddonManifest; def: AddonDefinition; extensionDefs: ModelExtensionDef[] }
  >();
  private readonly enabled = new Map<string, boolean>();
  private readonly modelOwners = new Map<string, string>();
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

  async syncAll(
    addons: AddonDefinition[],
    fastify?: FastifyInstance,
    options: {
      runSeeds?: boolean;
      legacyBackfillTables?: Set<string>;
      signingPolicy?: AddonSigningPolicy;
    } = {},
  ): Promise<{ order: string[]; syncReport: SyncReport }> {
    this.definitions.clear();
    this.enabled.clear();
    this.modelOwners.clear();

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
        register: def.register ?? (() => {}),
      });
    }

    const order = registry.validate();
    this.order = order;

    const signingMode = options.signingPolicy?.mode ?? "permissive";
    const trustedKeys = options.signingPolicy?.trustedKeys ?? [];
    const signatureByName = new Map<
      string,
      { status: "verified" | "unsigned" | "invalid"; keyId: string | null }
    >();
    for (const name of order) {
      const entry = this.definitions.get(name)!;
      const verification = verifyAddonManifestSignature(entry.manifest, trustedKeys);
      signatureByName.set(name, {
        status: verification.status,
        keyId: verification.keyId,
      });
      if (signingMode === "strict" && verification.status !== "verified") {
        throw new AddonRegistryError(
          `Addon '${name}' rejected by strict signature policy (${verification.status}${verification.reason ? `: ${verification.reason}` : ""}).`,
        );
      }
    }

    await syncModels([...irSystemModels, opsJobModel]);
    await this.syncAddonDeclarativeData("__base", CONSTITUTIONAL_BASE_DATA);

    const existingRows = await irAddonModel.repository.find();
    const existingByName = new Map(existingRows.map((row) => [row.name, row]));

    // Load custom fields saved in ir_model_fields so ModelRegistry validates _attrs immediately.
    await this.reloadAllCustomFieldsIntoRegistry();

    const activeAddons: string[] = [];
    const activeModels: Array<{ name: string; legacyBackfill?: boolean }> = [];
    const seededAtBoot: string[] = [];

    for (const name of order) {
      const entry = this.definitions.get(name)!;
      const existing = existingByName.get(name);
      const isEnabled =
        existing !== undefined
          ? existing.state !== "disabled"
          : entry.def.shouldAutoEnable
            ? entry.def.shouldAutoEnable()
            : entry.manifest.autoInstall || entry.manifest.defaultEnabled;

      this.enabled.set(name, isEnabled);
      if (isEnabled) {
        activeAddons.push(name);
        if (entry.def.extensions) {
          for (const ext of entry.def.extensions) {
            const registeredExt = extendModel(ext.target, {
              addon: name,
              fields: ext.fields,
              indexes: ext.indexes,
            });
            entry.extensionDefs.push(registeredExt);
          }
        }
        for (const model of entry.def.models ?? []) {
          activeModels.push({
            name: model.name,
            legacyBackfill: options.legacyBackfillTables?.has(model.table),
          });
        }
      }
    }

    const standardModelNames = activeModels.filter((m) => !m.legacyBackfill).map((m) => m.name);
    const backfillModelNames = activeModels.filter((m) => m.legacyBackfill).map((m) => m.name);

    const report: SyncReport = {
      createdTables: [],
      addedColumns: [],
      deprecatedColumns: [],
      createdIndexes: [],
      schemaHashes: {},
    };

    if (standardModelNames.length > 0) {
      const stdReport = await syncModels(standardModelNames);
      report.createdTables.push(...stdReport.createdTables);
      report.addedColumns.push(...stdReport.addedColumns);
      report.deprecatedColumns.push(...stdReport.deprecatedColumns);
      report.createdIndexes.push(...stdReport.createdIndexes);
      Object.assign(report.schemaHashes, stdReport.schemaHashes);
    }

    if (backfillModelNames.length > 0) {
      const bfReport = await syncModels(backfillModelNames, { legacyBackfill: true });
      report.createdTables.push(...bfReport.createdTables);
      report.addedColumns.push(...bfReport.addedColumns);
      report.deprecatedColumns.push(...bfReport.deprecatedColumns);
      report.createdIndexes.push(...bfReport.createdIndexes);
      Object.assign(report.schemaHashes, bfReport.schemaHashes);
    }

    const deprecatedByTable = new Set(
      report.deprecatedColumns.map((d) => `${d.table}.${d.column}`),
    );

    // Run non-route register callbacks in dependency order.
    await registry.load();

    // Persist metadata, rules, views, menus, and run initial/upgrade seeds for active addons.
    for (const name of order) {
      const entry = this.definitions.get(name)!;
      const isActive = this.enabled.get(name) ?? false;
      const existing = existingByName.get(name);
      const addonSchemaHash = this.computeAddonHash(entry.manifest, entry.def, report.schemaHashes);

      const sigMeta = signatureByName.get(name) ?? { status: "unsigned" as const, keyId: null };
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
          state: isActive ? "installed" : "disabled",
          signature_status: sigMeta.status,
          signature_key_id: sigMeta.keyId,
          auto_install: entry.manifest.autoInstall,
          last_error: null,
        },
        SYSTEM_ACTOR,
      );

      if (isActive) {
        await this.syncAddonIrMetadata(name, entry.def, deprecatedByTable);
        const versionChanged = !existing || existing.addon_version !== entry.manifest.version;
        const shouldSeed =
          (options.runSeeds ?? true) && (versionChanged || existing.state === "disabled");
        if (shouldSeed && entry.def.seed) {
          await entry.def.seed();
          seededAtBoot.push(name);
        }
      }
    }

    // Pre-mount ALL workspace addon routes behind live `requireAddonEnabled()` guard so toggle needs zero restart.
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
              | "text"
              | "integer"
              | "real"
              | "boolean"
              | "date"
              | "json"
              | "selection",
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

    for (const rule of def.rules ?? []) {
      await irRuleModel.repository.upsert(
        { model_name: rule.model_name, role: rule.role },
        {
          model_name: rule.model_name,
          role: rule.role,
          addon: addonName,
          can_read: rule.can_read ?? false,
          can_create: rule.can_create ?? false,
          can_update: rule.can_update ?? false,
          can_delete: rule.can_delete ?? false,
          domain_json: rule.domain ? JSON.stringify(rule.domain) : null,
        },
        SYSTEM_ACTOR,
      );
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
    for (const dep of entry.manifest.depends) {
      if (!this.isEnabled(dep)) {
        throw new Error(`Cannot enable '${addonName}': dependency '${dep}' is disabled.`);
      }
    }

    if (entry.def.extensions && entry.extensionDefs.length === 0) {
      for (const ext of entry.def.extensions) {
        entry.extensionDefs.push(
          extendModel(ext.target, {
            addon: addonName,
            fields: ext.fields,
            indexes: ext.indexes,
          }),
        );
      }
    }

    const modelNames = (entry.def.models ?? []).map((m) => m.name);
    for (const ext of entry.def.extensions ?? []) {
      modelNames.push(ext.target);
    }
    const report = modelNames.length > 0 ? await syncModels(modelNames) : undefined;
    const deprecatedByTable = new Set(
      (report?.deprecatedColumns ?? []).map((d) => `${d.table}.${d.column}`),
    );

    await this.syncAddonIrMetadata(addonName, entry.def, deprecatedByTable);
    if (entry.def.seed) {
      await entry.def.seed();
    }

    const existing = await irAddonModel.repository.find({ name: addonName });
    if (existing[0]) {
      await irAddonModel.repository.update(
        existing[0].id,
        { state: "installed", last_error: null },
        actor,
      );
    }
    this.enabled.set(addonName, true);
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
        if (otherEntry.manifest.depends.includes(addonName)) {
          throw new Error(
            `Cannot disable '${addonName}': active addon '${otherName}' depends on it.`,
          );
        }
      }
    }

    const existing = await irAddonModel.repository.find({ name: addonName });
    if (existing[0]) {
      await irAddonModel.repository.update(existing[0].id, { state: "disabled" }, actor);
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

  async getModelPermissions(modelName: string, role: CrewRoleOrPublic): Promise<ModelAclFlags> {
    const rules = await irRuleModel.repository.find({ model_name: modelName });
    if (rules.length === 0) {
      return role === "admin"
        ? { canRead: true, canCreate: true, canUpdate: true, canDelete: true }
        : { canRead: false, canCreate: false, canUpdate: false, canDelete: false };
    }
    const exact = rules.find((r) => r.role === role);
    if (exact) {
      return {
        canRead: exact.can_read,
        canCreate: exact.can_create,
        canUpdate: exact.can_update,
        canDelete: exact.can_delete,
      };
    }
    if (role === "admin") {
      return { canRead: true, canCreate: true, canUpdate: true, canDelete: true };
    }
    // Check fallback rule for lower rank (e.g. editor reading viewer rule)
    const userRank = ROLE_RANK[role] ?? 0;
    const eligible = rules.filter((r) => (ROLE_RANK[r.role] ?? 99) <= userRank);
    return {
      canRead: eligible.some((r) => r.can_read),
      canCreate: eligible.some((r) => r.can_create),
      canUpdate: eligible.some((r) => r.can_update),
      canDelete: eligible.some((r) => r.can_delete),
    };
  }

  async getModelRuleDomain(
    modelName: string,
    role: CrewRoleOrPublic,
    actor: ActorContext,
  ): Promise<Record<string, unknown> | null> {
    const rules = await irRuleModel.repository.find({ model_name: modelName });
    if (rules.length === 0) return null;
    const exact = rules.find((r) => r.role === role);
    if (exact) {
      if (!exact.domain_json) return null;
      return parseStoredRuleDomain(exact.domain_json, actor, role);
    }
    if (role === "admin") {
      return null;
    }
    const userRank = ROLE_RANK[role] ?? 0;
    const eligible = rules
      .filter((r) => (ROLE_RANK[r.role] ?? 99) <= userRank)
      .sort((a, b) => (ROLE_RANK[b.role] ?? 0) - (ROLE_RANK[a.role] ?? 0));
    const highestWithDomain = eligible.find((r) => Boolean(r.domain_json));
    if (!highestWithDomain?.domain_json) return null;
    return parseStoredRuleDomain(highestWithDomain.domain_json, actor, role);
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
  ): Promise<RuntimeViewDescriptor | null> {
    const desc = modelRegistry.get(modelName);
    if (!desc) return null;
    if (!this.isModelEnabled(modelName)) return null;
    const modelMeta = (await irModelRecord.repository.find({ name: modelName }))[0];
    if (modelMeta && !this.isEnabled(modelMeta.addon)) {
      return null;
    }

    const acl = await this.getModelPermissions(modelName, role);
    if (!acl.canRead) return null;

    const fieldRows = await irModelFieldModel.repository.find({ model_name: modelName });
    const fields: RegisteredFieldMetadata[] = fieldRows
      .filter(
        (f) => !f.deprecated && !/password_hash|encrypted_private|_secret/i.test(f.field_name),
      )
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
        ? activeViews.map((v) => ({
            view_type: v.view_type,
            addon: v.addon,
            priority: v.priority,
            spec: JSON.parse(v.spec_json) as Record<string, unknown>,
          }))
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
                searchKeys: desc.searchFields ?? [],
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
    };
  }
}
