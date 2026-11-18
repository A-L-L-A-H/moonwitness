import { createHash } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
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
  irMenuModel,
  irModelFieldModel,
  irModelRecord,
  irRuleModel,
  irSystemModels,
  irViewModel,
} from "./ir-models.js";
import { opsJobModel } from "./job-queue.js";
import {
  AddonManifestSchema,
  AddonRegistry,
  type AddonContext,
  type AddonManifest,
  type AddonManifestInput,
} from "./registry.js";

export type CrewRoleOrPublic = "admin" | "editor" | "viewer" | "public";

export interface IrRuleInput {
  model_name: string;
  role: CrewRoleOrPublic;
  can_read?: boolean;
  can_create?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
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

export class AddonRuntimeController {
  private readonly definitions = new Map<
    string,
    { manifest: AddonManifest; def: AddonDefinition; extensionDefs: ModelExtensionDef[] }
  >();
  private readonly enabled = new Map<string, boolean>();
  private order: string[] = [];

  isEnabled(addonName: string): boolean {
    return this.enabled.get(addonName) ?? false;
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
    options: { runSeeds?: boolean; legacyBackfillTables?: Set<string> } = {},
  ): Promise<{ order: string[]; syncReport: SyncReport }> {
    this.definitions.clear();
    this.enabled.clear();

    const registry = new AddonRegistry();
    for (const def of addons) {
      const manifest = AddonManifestSchema.parse(def.manifest);
      const extensionDefs: ModelExtensionDef[] = [];
      this.definitions.set(manifest.name, { manifest, def, extensionDefs });
      registry.add({
        manifest: def.manifest,
        register: def.register ?? (() => {}),
      });
    }

    const order = registry.validate();
    this.order = order;

    await syncModels([...irSystemModels, opsJobModel]);

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

      await irAddonModel.repository.upsert(
        { name },
        {
          name,
          addon_version: entry.manifest.version,
          description: entry.manifest.description ?? "",
          category: entry.manifest.category ?? "general",
          depends_json: JSON.stringify(entry.manifest.depends),
          provides_json: JSON.stringify(entry.manifest.provides),
          schema_hash: addonSchemaHash,
          state: isActive ? "installed" : "disabled",
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

  async getViewDescriptor(
    modelName: string,
    role: CrewRoleOrPublic,
  ): Promise<RuntimeViewDescriptor | null> {
    const desc = modelRegistry.get(modelName);
    if (!desc) return null;
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
    let actionBindings: ActionBindingsSpec = desc.restEnabled
      ? {
          listUrl: `/api/v1/m/${encodeURIComponent(modelName)}`,
          createUrl: `/api/v1/m/${encodeURIComponent(modelName)}`,
          updateUrl: `/api/v1/m/${encodeURIComponent(modelName)}/{id}`,
          archiveUrl: `/api/v1/m/${encodeURIComponent(modelName)}/{id}/archive`,
          restoreUrl: `/api/v1/m/${encodeURIComponent(modelName)}/{id}/restore`,
          deleteUrl: `/api/v1/m/${encodeURIComponent(modelName)}/{id}`,
          historyUrl: `/api/v1/m/${encodeURIComponent(modelName)}/{id}/history`,
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

    return {
      model: modelName,
      table: desc.table,
      extensible: desc.extensible,
      restEnabled: desc.restEnabled,
      acl,
      fields,
      views: activeViews.map((v) => ({
        view_type: v.view_type,
        addon: v.addon,
        priority: v.priority,
        spec: JSON.parse(v.spec_json) as Record<string, unknown>,
      })),
      actionBindings,
    };
  }
}
