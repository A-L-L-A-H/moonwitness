import { z } from "zod";
import type { ActorContext } from "./actor-context.js";
import {
  normalizeComputedFieldDef,
  type FieldPolicySpec,
  type ModelComputedFields,
  type ModelFeatureOptions,
  type ModelRelation,
  type ModelWriteAction,
} from "./model-meta.js";
import {
  assertIdentifier,
  compileModelDdl,
  fieldSpec,
  METADATA_NAMES,
  storedComputedFieldSpec,
  storedComputedZodSchema,
  type FieldSpec,
  type ForeignKeySpec,
  type Many2ManyJoinTableSpec,
  type ModelIndex,
  type RuntimeCustomFieldSpec,
  type ZodObjectLike,
} from "./schema-utils.js";

export interface ModelExtensionDef {
  target: string;
  addon: string;
  fields: ZodObjectLike;
  indexes?: ModelIndex[];
}

export interface ExtendModelOptions {
  addon: string;
  fields: ZodObjectLike;
  indexes?: ModelIndex[];
}

export interface RegisteredModelDescriptor extends ModelFeatureOptions {
  name: string;
  table: string;
  baseSchema: ZodObjectLike;
  fullSchema: ZodObjectLike;
  softDelete: boolean;
  extensible: boolean;
  restEnabled: boolean;
  publicFields?: string[];
  fields: Map<string, FieldSpec>;
  fieldOrigins: Map<string, string>;
  indexes: ModelIndex[];
  customFields: RuntimeCustomFieldSpec[];
  computedOrder: string[];
  storedComputedFields: Set<string>;
  foreignKeys: ForeignKeySpec[];
  many2manyTables: Many2ManyJoinTableSpec[];
  ddl: string;
}

export interface ModelHookError {
  model: string;
  action: ModelWriteAction;
  hook: "afterSave" | "afterDelete" | "afterArchive" | "afterRestore";
  entityId?: string;
  error: string;
  cause?: unknown;
  timestamp: string;
}

export interface ModelWriteEvent {
  model: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "ARCHIVE" | "RESTORE" | "DELETE";
  record: Record<string, unknown>;
  before: Record<string, unknown> | null;
  actor: ActorContext;
  timestamp: string;
}

export type ModelWriteHandler = (event: ModelWriteEvent) => Promise<void> | void;

const FULL_METADATA_SHAPE = {
  id: z.string(),
  create_uid: z.string().nullish(),
  create_date: z.date(),
  write_uid: z.string().nullish(),
  write_date: z.date(),
  status: z.enum(["active", "archived", "deleted"]),
  deleted_uid: z.string().nullish(),
  deleted_date: z.date().nullish(),
  version: z.number().int().min(0),
  source: z.enum(["seed", "api", "import", "migration"]),
  source_ref: z.string().nullish(),
  tenant_id: z.string().min(1).default("default"),
};

interface StoredModelBase extends ModelFeatureOptions {
  name: string;
  table: string;
  baseSchema: ZodObjectLike;
  softDelete: boolean;
  extensible: boolean;
  restEnabled: boolean;
  publicFields?: string[];
  indexes: ModelIndex[];
}

function resolveComputedFieldOrder(
  modelName: string,
  computed: ModelComputedFields | undefined,
  existingFields: Map<string, FieldSpec>,
  relations: Record<string, ModelRelation> | undefined,
): string[] {
  if (!computed) return [];
  const entries = Object.entries(computed);
  if (entries.length === 0) return [];

  const computedNames = new Set(entries.map(([k]) => k));
  for (const [fieldName] of entries) {
    assertIdentifier(fieldName, "computed field");
    if (METADATA_NAMES.has(fieldName) || existingFields.has(fieldName)) {
      throw new Error(
        `Computed field '${fieldName}' on model '${modelName}' collides with a declared field or metadata column.`,
      );
    }
    if (relations && fieldName in relations) {
      throw new Error(
        `Computed field '${fieldName}' on model '${modelName}' collides with a relation.`,
      );
    }
  }

  const state = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const order: string[] = [];

  const visit = (fieldName: string): void => {
    const current = state.get(fieldName) ?? 0;
    if (current === 2) return;
    if (current === 1) {
      const idx = stack.indexOf(fieldName);
      const cycle = [...stack.slice(idx), fieldName].join(" -> ");
      throw new Error(`Cyclic computed field dependency on model '${modelName}': ${cycle}`);
    }
    state.set(fieldName, 1);
    stack.push(fieldName);

    const norm = normalizeComputedFieldDef(computed[fieldName]!);
    for (const dep of norm.depends) {
      if (!existingFields.has(dep) && !METADATA_NAMES.has(dep) && !computedNames.has(dep)) {
        throw new Error(
          `Unknown dependency '${dep}' in computed field '${fieldName}' on model '${modelName}'.`,
        );
      }
      if (computedNames.has(dep)) {
        visit(dep);
      }
    }

    stack.pop();
    state.set(fieldName, 2);
    order.push(fieldName);
  };

  for (const [fieldName] of entries) {
    visit(fieldName);
  }
  return order;
}

function assertNoCustomFieldCollisions(
  modelName: string,
  specs: RuntimeCustomFieldSpec[],
  fields: Map<string, FieldSpec>,
  relations?: Record<string, ModelRelation>,
  computed?: ModelComputedFields,
): void {
  const seen = new Set<string>();
  for (const spec of specs) {
    assertIdentifier(spec.field_name, "custom field");
    if (seen.has(spec.field_name)) {
      throw new Error(`Duplicate custom field '${spec.field_name}' on model '${modelName}'.`);
    }
    seen.add(spec.field_name);
    if (spec.field_name === "_attrs" || spec.field_name === "_extra") {
      throw new Error(
        `Custom field '${spec.field_name}' on model '${modelName}' uses a reserved _attrs namespace key.`,
      );
    }
    if (METADATA_NAMES.has(spec.field_name)) {
      throw new Error(
        `Custom field '${spec.field_name}' on model '${modelName}' collides with metadata column.`,
      );
    }
    if (fields.has(spec.field_name)) {
      throw new Error(
        `Custom field '${spec.field_name}' on model '${modelName}' collides with a declared model field.`,
      );
    }
    if (relations && spec.field_name in relations) {
      throw new Error(
        `Custom field '${spec.field_name}' on model '${modelName}' collides with a declared relation.`,
      );
    }
    if (computed && spec.field_name in computed) {
      throw new Error(
        `Custom field '${spec.field_name}' on model '${modelName}' collides with a computed field.`,
      );
    }
  }
}

function resolveTargetUniqueness(
  sourceModel: string,
  relName: string,
  targetModel: string,
  targetField: string,
  targetFields: Map<string, FieldSpec>,
  targetIndexes: ModelIndex[],
): "single" | "tenant_composite" {
  assertIdentifier(targetField, "relation target column");
  if (!METADATA_NAMES.has(targetField) && !targetFields.has(targetField)) {
    throw new Error(
      `Relation '${relName}' on '${sourceModel}' targets unknown column '${targetModel}.${targetField}'.`,
    );
  }
  if (targetField === "id") {
    return "single";
  }
  const hasSingleUnique = targetIndexes.some(
    (idx) => idx.unique && idx.fields.length === 1 && idx.fields[0] === targetField,
  );
  if (hasSingleUnique) {
    return "single";
  }
  const hasTenantCompositeUnique = targetIndexes.some(
    (idx) =>
      idx.unique &&
      idx.fields.length === 2 &&
      idx.fields.includes("tenant_id") &&
      idx.fields.includes(targetField),
  );
  if (hasTenantCompositeUnique) {
    return "tenant_composite";
  }
  throw new Error(
    `Relation '${relName}' on '${sourceModel}' targets non-unique column '${targetModel}.${targetField}'. Target field must be 'id' or covered by a unique index.`,
  );
}

class OrmModelRegistry {
  private readonly bases = new Map<string, StoredModelBase>();
  private readonly extensions = new Map<string, ModelExtensionDef[]>();
  private readonly customFields = new Map<string, RuntimeCustomFieldSpec[]>();
  private readonly composed = new Map<string, RegisteredModelDescriptor>();
  private readonly listeners = new Set<{ pattern: string; handler: ModelWriteHandler }>();
  private readonly hookErrors: ModelHookError[] = [];

  register(base: StoredModelBase): RegisteredModelDescriptor {
    assertIdentifier(base.table, "table");
    const previous = this.bases.get(base.name);
    this.bases.set(base.name, base);
    let desc: RegisteredModelDescriptor;
    try {
      desc = this.recompute(base.name);
    } catch (err) {
      if (previous) {
        this.bases.set(base.name, previous);
      } else {
        this.bases.delete(base.name);
      }
      throw err;
    }
    for (const [otherName, otherBase] of this.bases) {
      if (otherName === base.name || !otherBase.relations) continue;
      const referencesNewModel = Object.values(otherBase.relations).some(
        (rel) => rel.model === base.name,
      );
      if (referencesNewModel) {
        this.recompute(otherName);
      }
    }
    return desc;
  }

  extend(targetModelName: string, options: ExtendModelOptions): ModelExtensionDef {
    const ext: ModelExtensionDef = {
      target: targetModelName,
      addon: options.addon,
      fields: options.fields,
      indexes: options.indexes,
    };
    const existing = this.extensions.get(targetModelName) ?? [];
    const filtered = existing.filter((entry) => entry.addon !== options.addon);
    filtered.push(ext);
    this.extensions.set(targetModelName, filtered);
    if (this.bases.has(targetModelName)) {
      this.recompute(targetModelName);
    }
    return ext;
  }

  setRuntimeCustomFields(modelName: string, specs: RuntimeCustomFieldSpec[]): void {
    const copy = [...specs];
    const current = this.composed.get(modelName);
    if (current) {
      assertNoCustomFieldCollisions(
        modelName,
        copy,
        current.fields,
        current.relations,
        current.computed,
      );
    } else {
      assertNoCustomFieldCollisions(modelName, copy, new Map());
    }
    this.customFields.set(modelName, copy);
    if (this.bases.has(modelName)) {
      this.recompute(modelName);
    }
  }

  getRuntimeCustomFields(modelName: string): RuntimeCustomFieldSpec[] {
    return [...(this.customFields.get(modelName) ?? [])];
  }

  recordHookError(
    entry: Omit<ModelHookError, "timestamp"> & { timestamp?: string },
  ): ModelHookError {
    const recorded: ModelHookError = {
      ...entry,
      timestamp: entry.timestamp ?? new Date().toISOString(),
    };
    this.hookErrors.push(recorded);
    if (this.hookErrors.length > 500) {
      this.hookErrors.splice(0, this.hookErrors.length - 500);
    }
    return recorded;
  }

  getHookErrors(): ModelHookError[] {
    return [...this.hookErrors];
  }

  clearHookErrors(): void {
    this.hookErrors.length = 0;
  }

  validateRelations(modelNames?: string[]): void {
    const targets = modelNames ?? [...this.composed.keys()];
    for (const modelName of targets) {
      const desc = this.composed.get(modelName);
      if (!desc?.relations) continue;
      for (const [relName, rel] of Object.entries(desc.relations)) {
        if (rel.type === "one2many") continue;
        const target = this.composed.get(rel.model);
        if (!target) {
          throw new Error(
            `Relation '${relName}' on '${modelName}' targets unknown model '${rel.model}'.`,
          );
        }
        const targetField = rel.targetField ?? "id";
        resolveTargetUniqueness(
          modelName,
          relName,
          rel.model,
          targetField,
          target.fields,
          target.indexes,
        );
      }
    }
  }

  get(name: string): RegisteredModelDescriptor | undefined {
    return this.composed.get(name);
  }

  list(): RegisteredModelDescriptor[] {
    return [...this.composed.values()];
  }

  onWrite(pattern: string, handler: ModelWriteHandler): () => void {
    const entry = { pattern, handler };
    this.listeners.add(entry);
    return () => {
      this.listeners.delete(entry);
    };
  }

  async emitWrite(event: ModelWriteEvent): Promise<void> {
    const matched = [...this.listeners].filter((entry) =>
      matchModelPattern(entry.pattern, event.model),
    );
    for (const entry of matched) {
      try {
        await entry.handler(event);
      } catch {
        // Outbox handlers are best-effort so they never break committed repository writes.
      }
    }
  }

  clearCustomFieldsForTests(): void {
    this.customFields.clear();
    this.extensions.clear();
    this.listeners.clear();
    this.hookErrors.length = 0;
    for (const name of this.bases.keys()) {
      this.recompute(name);
    }
  }

  clearForTests(): void {
    this.bases.clear();
    this.extensions.clear();
    this.customFields.clear();
    this.composed.clear();
    this.listeners.clear();
    this.hookErrors.length = 0;
  }

  private recompute(name: string): RegisteredModelDescriptor {
    const base = this.bases.get(name);
    if (!base) {
      throw new Error(`Model '${name}' is not registered.`);
    }

    const mergedShape: Record<string, z.ZodTypeAny> = { ...base.baseSchema.shape };
    const fieldOrigins = new Map<string, string>();
    for (const fieldName of Object.keys(base.baseSchema.shape)) {
      fieldOrigins.set(fieldName, base.name);
    }

    const mergedIndexes: ModelIndex[] = [...base.indexes];
    for (const ext of this.extensions.get(name) ?? []) {
      for (const [fieldName, fieldSchema] of Object.entries(ext.fields.shape)) {
        mergedShape[fieldName] = fieldSchema as z.ZodTypeAny;
        fieldOrigins.set(fieldName, ext.addon);
      }
      if (ext.indexes) {
        mergedIndexes.push(...ext.indexes);
      }
    }

    if (base.extensible && !("_attrs" in mergedShape)) {
      mergedShape._attrs = z.record(z.string(), z.unknown()).default({});
      fieldOrigins.set("_attrs", "__base");
    }

    const fields = new Map<string, FieldSpec>();
    for (const [fieldName, zodSchema] of Object.entries(mergedShape)) {
      assertIdentifier(fieldName, "column");
      fields.set(fieldName, fieldSpec(zodSchema, fieldName));
    }

    const computedOrder = resolveComputedFieldOrder(name, base.computed, fields, base.relations);
    const storedComputedFields = new Set<string>();
    if (base.computed) {
      for (const fieldName of computedOrder) {
        const norm = normalizeComputedFieldDef(base.computed[fieldName]!);
        if (norm.stored) {
          storedComputedFields.add(fieldName);
          fields.set(fieldName, storedComputedFieldSpec(norm.type));
          mergedShape[fieldName] = storedComputedZodSchema(norm.type);
          fieldOrigins.set(fieldName, "__computed");
        }
      }
    }

    const customFields = [...(this.customFields.get(name) ?? [])];
    assertNoCustomFieldCollisions(name, customFields, fields, base.relations, base.computed);

    const foreignKeys: ForeignKeySpec[] = [];
    const many2manyTables: Many2ManyJoinTableSpec[] = [];
    if (base.relations) {
      for (const [relName, rel] of Object.entries(base.relations)) {
        if (rel.type === "one2many") continue;

        const onDeleteRaw = rel.onDelete as string | undefined;
        if (rel.type === "many2many") {
          if (onDeleteRaw !== undefined && onDeleteRaw !== "restrict" && onDeleteRaw !== "ignore") {
            throw new Error(
              `Unsupported onDelete policy '${onDeleteRaw}' on many2many relation '${base.name}.${relName}': use 'restrict' or 'ignore'.`,
            );
          }
          const joinTable = rel.through ?? `${base.table}_${relName}_rel`;
          const sourceColumn = rel.sourceKey ?? "source_id";
          const targetColumn = rel.targetKey ?? "target_id";
          const targetField = rel.targetField ?? "id";
          assertIdentifier(joinTable, "join table");
          assertIdentifier(sourceColumn, "join source column");
          assertIdentifier(targetColumn, "join target column");
          assertIdentifier(targetField, "relation target column");

          const target = this.composed.get(rel.model);
          let targetUniqueness: "single" | "tenant_composite" = "single";
          if (target) {
            targetUniqueness = resolveTargetUniqueness(
              base.name,
              relName,
              rel.model,
              targetField,
              target.fields,
              target.indexes,
            );
          }
          many2manyTables.push({
            relationName: relName,
            table: joinTable,
            sourceModel: base.name,
            sourceTable: base.table,
            sourceColumn,
            targetModel: rel.model,
            targetTable: target?.table ?? "",
            targetField,
            targetColumn,
            onDelete: onDeleteRaw === "ignore" ? "ignore" : "restrict",
            targetUniqueness,
          });
          continue;
        }

        // many2one
        if (
          onDeleteRaw !== undefined &&
          onDeleteRaw !== "restrict" &&
          onDeleteRaw !== "set null" &&
          onDeleteRaw !== "ignore"
        ) {
          throw new Error(
            `Unsupported onDelete policy '${onDeleteRaw}' on relation '${base.name}.${relName}': destructive cascades are not allowed; use 'restrict', 'set null', or 'ignore'.`,
          );
        }
        const colSpec = fields.get(relName);
        if (!colSpec && !METADATA_NAMES.has(relName)) {
          throw new Error(
            `Relation '${base.name}.${relName}' requires a matching field '${relName}' in the model schema.`,
          );
        }
        if (onDeleteRaw === "set null" && (!colSpec || (!colSpec.nullable && !colSpec.optional))) {
          throw new Error(
            `Relation '${base.name}.${relName}' with onDelete 'set null' requires a nullable or optional column.`,
          );
        }

        const target = this.composed.get(rel.model);
        if (target && onDeleteRaw !== "ignore") {
          const targetField = rel.targetField ?? "id";
          const uniqueKind = resolveTargetUniqueness(
            base.name,
            relName,
            rel.model,
            targetField,
            target.fields,
            target.indexes,
          );
          if (uniqueKind === "single") {
            foreignKeys.push({
              columns: [relName],
              targetTable: target.table,
              targetColumns: [targetField],
              onDelete: onDeleteRaw === "set null" ? "SET NULL" : "RESTRICT",
            });
          } else if (onDeleteRaw !== "set null") {
            foreignKeys.push({
              columns: ["tenant_id", relName],
              targetTable: target.table,
              targetColumns: ["tenant_id", targetField],
              onDelete: "RESTRICT",
            });
          }
        } else if (target && onDeleteRaw === "ignore") {
          const targetField = rel.targetField ?? "id";
          resolveTargetUniqueness(
            base.name,
            relName,
            rel.model,
            targetField,
            target.fields,
            target.indexes,
          );
        }
      }
    }

    const businessSchema = z.object(mergedShape);
    const fullSchema = businessSchema.extend(FULL_METADATA_SHAPE);
    const ddl = compileModelDdl(
      base.table,
      fields,
      mergedIndexes,
      base.extensible,
      foreignKeys,
      many2manyTables,
    );

    let clonedFieldPolicies: Record<string, FieldPolicySpec> | undefined;
    if (base.fieldPolicies) {
      clonedFieldPolicies = {};
      for (const [fieldName, policy] of Object.entries(base.fieldPolicies)) {
        if (
          !fields.has(fieldName) &&
          !METADATA_NAMES.has(fieldName) &&
          !(base.computed && fieldName in base.computed) &&
          !(base.relations && fieldName in base.relations)
        ) {
          throw new Error(
            `Unknown field '${fieldName}' in fieldPolicies for model '${base.name}'.`,
          );
        }
        const normalizeGroupList = (
          groups: string[] | undefined,
          key: "readGroups" | "writeGroups",
        ): string[] | undefined => {
          if (groups === undefined) return undefined;
          const cleaned = groups.map((g) => g.trim()).filter(Boolean);
          if (cleaned.length !== groups.length) {
            throw new Error(
              `Field policy '${key}' on '${base.name}.${fieldName}' contains an empty group reference.`,
            );
          }
          return cleaned;
        };
        const readGroups = normalizeGroupList(policy.readGroups, "readGroups");
        const writeGroups = normalizeGroupList(policy.writeGroups, "writeGroups");
        clonedFieldPolicies[fieldName] = {
          ...(policy.readRoles ? { readRoles: [...policy.readRoles] } : {}),
          ...(policy.writeRoles ? { writeRoles: [...policy.writeRoles] } : {}),
          ...(readGroups !== undefined ? { readGroups } : {}),
          ...(writeGroups !== undefined ? { writeGroups } : {}),
          ...(policy.sensitive !== undefined ? { sensitive: policy.sensitive } : {}),
        };
      }
    }

    const descriptor: RegisteredModelDescriptor = {
      name: base.name,
      table: base.table,
      baseSchema: businessSchema,
      fullSchema,
      softDelete: base.softDelete,
      extensible: base.extensible,
      restEnabled: base.restEnabled,
      publicFields: base.publicFields ? [...base.publicFields] : undefined,
      searchFields: base.searchFields,
      defaults: base.defaults,
      constrains: base.constrains,
      relations: base.relations,
      retention: base.retention,
      actions: base.actions,
      computed: base.computed,
      hooks: base.hooks,
      fieldPolicies: clonedFieldPolicies,
      allowFreeformExtra: base.allowFreeformExtra,
      fields,
      fieldOrigins,
      indexes: mergedIndexes,
      customFields,
      computedOrder,
      storedComputedFields,
      foreignKeys,
      many2manyTables,
      ddl,
    };

    this.composed.set(name, descriptor);
    return descriptor;
  }
}

function matchModelPattern(pattern: string, modelName: string): boolean {
  if (pattern === "*" || pattern === modelName) return true;
  if (pattern.endsWith(".*")) {
    const prefix = pattern.slice(0, -1);
    return modelName.startsWith(prefix);
  }
  return false;
}

export const modelRegistry = new OrmModelRegistry();

export function extendModel(
  targetModelName: string,
  options: ExtendModelOptions,
): ModelExtensionDef {
  return modelRegistry.extend(targetModelName, options);
}

export function onModelWrite(pattern: string, handler: ModelWriteHandler): () => void {
  return modelRegistry.onWrite(pattern, handler);
}
