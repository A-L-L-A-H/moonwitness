import { z } from "zod";
import type { ActorContext } from "./actor-context.js";
import type { ModelFeatureOptions } from "./model-meta.js";
import {
  assertIdentifier,
  compileModelDdl,
  fieldSpec,
  type FieldSpec,
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
  ddl: string;
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

class OrmModelRegistry {
  private readonly bases = new Map<string, StoredModelBase>();
  private readonly extensions = new Map<string, ModelExtensionDef[]>();
  private readonly customFields = new Map<string, RuntimeCustomFieldSpec[]>();
  private readonly composed = new Map<string, RegisteredModelDescriptor>();
  private readonly listeners = new Set<{ pattern: string; handler: ModelWriteHandler }>();

  register(base: StoredModelBase): RegisteredModelDescriptor {
    assertIdentifier(base.table, "table");
    this.bases.set(base.name, base);
    return this.recompute(base.name);
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
    this.customFields.set(modelName, [...specs]);
    if (this.bases.has(modelName)) {
      this.recompute(modelName);
    }
  }

  getRuntimeCustomFields(modelName: string): RuntimeCustomFieldSpec[] {
    return [...(this.customFields.get(modelName) ?? [])];
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

    const businessSchema = z.object(mergedShape);
    const fullSchema = businessSchema.extend(FULL_METADATA_SHAPE);
    const ddl = compileModelDdl(base.table, fields, mergedIndexes, base.extensible);
    const customFields = [...(this.customFields.get(name) ?? [])];

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
      fields,
      fieldOrigins,
      indexes: mergedIndexes,
      customFields,
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
