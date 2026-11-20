import { z } from "zod";

export type ZodObjectLike = z.ZodObject;
export type Codec = "text" | "integer" | "real" | "boolean" | "date" | "json";

export interface ModelIndex {
  fields: string[];
  unique?: boolean;
}

export interface ForeignKeySpec {
  columns: string[];
  targetTable: string;
  targetColumns: string[];
  onDelete: "RESTRICT" | "SET NULL";
}

export type TargetUniqueness = "single" | "tenant_composite";

export interface Many2ManyJoinTableSpec {
  relationName: string;
  table: string;
  sourceModel: string;
  sourceTable: string;
  sourceColumn: string;
  targetModel: string;
  targetTable: string;
  targetField: string;
  targetColumn: string;
  onDelete: "restrict" | "ignore";
  sourceOnDelete: "restrict" | "ignore";
  targetOnDelete: "restrict" | "ignore";
  sourceUniqueness: TargetUniqueness;
  targetUniqueness: TargetUniqueness;
}

export interface ValidateAttrsOptions {
  allowFreeformExtra?: boolean;
}

export interface FieldSpec {
  codec: Codec;
  nullable: boolean;
  optional: boolean;
  hasDefault: boolean;
  defaultValue?: unknown;
  columnType: string;
  enumValues?: readonly string[];
  zodTypeLabel: string;
}

export interface RuntimeCustomFieldSpec {
  field_name: string;
  field_type: "text" | "integer" | "real" | "boolean" | "date" | "json" | "selection";
  required?: boolean;
  nullable?: boolean;
  selection?: string[];
  default_value?: unknown;
  ui_widget?: string;
  label?: string;
}

export const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function assertIdentifier(value: string, label: string): void {
  if (!IDENTIFIER.test(value)) {
    throw new Error(
      `Invalid ${label} '${value}'. Only letters, digits and underscores are allowed.`,
    );
  }
}

export const METADATA_COLUMNS = [
  "id TEXT PRIMARY KEY",
  "create_uid TEXT",
  "create_date TEXT NOT NULL",
  "write_uid TEXT",
  "write_date TEXT NOT NULL",
  "status TEXT NOT NULL DEFAULT 'active'",
  "deleted_uid TEXT",
  "deleted_date TEXT",
  "version INTEGER NOT NULL DEFAULT 1",
  "source TEXT NOT NULL DEFAULT 'api'",
  "source_ref TEXT",
  "tenant_id TEXT NOT NULL DEFAULT 'default'",
] as const;

export const METADATA_NAMES = new Set([
  "id",
  "create_uid",
  "create_date",
  "write_uid",
  "write_date",
  "status",
  "deleted_uid",
  "deleted_date",
  "version",
  "source",
  "source_ref",
  "tenant_id",
]);

function isZodType(value: z.ZodTypeAny, name: string): boolean {
  return value.constructor.name === name;
}

function unwrap(schema: z.ZodTypeAny): {
  inner: z.ZodTypeAny;
  nullable: boolean;
  optional: boolean;
  hasDefault: boolean;
  defaultValue?: unknown;
} {
  let current = schema;
  let nullable = false;
  let optional = false;
  let hasDefault = false;
  let defaultValue: unknown;

  for (;;) {
    if (current instanceof z.ZodOptional || isZodType(current, "ZodOptional")) {
      optional = true;
      current = (current as z.ZodOptional<z.ZodTypeAny>).unwrap();
    } else if (current instanceof z.ZodNullable || isZodType(current, "ZodNullable")) {
      nullable = true;
      current = (current as z.ZodNullable<z.ZodTypeAny>).unwrap();
    } else if (
      current instanceof z.ZodDefault ||
      isZodType(current, "ZodDefault") ||
      isZodType(current, "ZodPrefault")
    ) {
      optional = true;
      if (!hasDefault) {
        const probe = current.safeParse(undefined);
        if (probe.success) {
          hasDefault = true;
          defaultValue = probe.data;
        }
      }
      current = (current as z.ZodDefault<z.ZodTypeAny>).removeDefault();
    } else if (isZodType(current, "ZodPipe")) {
      current = (current as z.ZodPipe<z.ZodTypeAny, z.ZodTypeAny>).in;
    } else {
      return { inner: current, nullable, optional, hasDefault, defaultValue };
    }
  }
}

export function fieldSpec(schema: z.ZodTypeAny, field: string): FieldSpec {
  const { inner, nullable, optional, hasDefault, defaultValue } = unwrap(schema);
  const both = { nullable, optional, hasDefault, defaultValue };

  if (inner instanceof z.ZodEnum) {
    const options = Array.isArray((inner as { options?: unknown }).options)
      ? ((inner as { options: unknown[] }).options.map(String) as string[])
      : undefined;
    return {
      ...both,
      codec: "text",
      columnType: "TEXT",
      enumValues: options,
      zodTypeLabel: "selection",
    };
  }
  if (inner instanceof z.ZodString || inner instanceof z.ZodLiteral) {
    return { ...both, codec: "text", columnType: "TEXT", zodTypeLabel: "text" };
  }
  if (inner instanceof z.ZodNumber) {
    const integer = (inner as z.ZodNumber).isInt;
    return {
      ...both,
      codec: integer ? "integer" : "real",
      columnType: integer ? "INTEGER" : "REAL",
      zodTypeLabel: integer ? "integer" : "real",
    };
  }
  if (inner instanceof z.ZodBoolean) {
    return { ...both, codec: "boolean", columnType: "INTEGER", zodTypeLabel: "boolean" };
  }
  if (inner instanceof z.ZodDate) {
    return { ...both, codec: "date", columnType: "TEXT", zodTypeLabel: "date" };
  }
  if (inner instanceof z.ZodArray || inner instanceof z.ZodObject || inner instanceof z.ZodRecord) {
    return { ...both, codec: "json", columnType: "TEXT", zodTypeLabel: "json" };
  }

  throw new Error(
    `Unsupported schema type for field '${field}'. Supported: string, enum, literal, number, boolean, date, array, object, record (plus optional/nullable/default wrappers).`,
  );
}

export function formatSqlDefaultLiteral(spec: FieldSpec): string | null {
  if (!spec.hasDefault) return null;
  const val = spec.defaultValue;
  if (val === null || val === undefined) {
    return spec.nullable ? "NULL" : null;
  }
  switch (spec.codec) {
    case "boolean":
      return val ? "1" : "0";
    case "integer":
    case "real": {
      const n = Number(val);
      return Number.isFinite(n) ? String(n) : null;
    }
    case "date": {
      const iso = val instanceof Date ? val.toISOString() : new Date(String(val)).toISOString();
      return `'${iso.replace(/'/g, "''")}'`;
    }
    case "json":
      return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    case "text":
    default:
      return `'${String(val).replace(/'/g, "''")}'`;
  }
}

export function storedComputedFieldSpec(
  type: "text" | "integer" | "real" | "boolean" | "json",
): FieldSpec {
  switch (type) {
    case "integer":
      return {
        codec: "integer",
        nullable: true,
        optional: true,
        hasDefault: false,
        columnType: "INTEGER",
        zodTypeLabel: "integer",
      };
    case "real":
      return {
        codec: "real",
        nullable: true,
        optional: true,
        hasDefault: false,
        columnType: "REAL",
        zodTypeLabel: "real",
      };
    case "boolean":
      return {
        codec: "boolean",
        nullable: true,
        optional: true,
        hasDefault: false,
        columnType: "INTEGER",
        zodTypeLabel: "boolean",
      };
    case "json":
      return {
        codec: "json",
        nullable: true,
        optional: true,
        hasDefault: false,
        columnType: "TEXT",
        zodTypeLabel: "json",
      };
    case "text":
    default:
      return {
        codec: "text",
        nullable: true,
        optional: true,
        hasDefault: false,
        columnType: "TEXT",
        zodTypeLabel: "text",
      };
  }
}

export function storedComputedZodSchema(
  type: "text" | "integer" | "real" | "boolean" | "json",
): z.ZodTypeAny {
  switch (type) {
    case "integer":
      return z.number().int().nullable().optional();
    case "real":
      return z.number().nullable().optional();
    case "boolean":
      return z.boolean().nullable().optional();
    case "json":
      return z.unknown().nullable().optional();
    case "text":
    default:
      return z.string().nullable().optional();
  }
}

export function compileMany2ManyJoinTableDdl(spec: Many2ManyJoinTableSpec): string {
  assertIdentifier(spec.table, "join table");
  assertIdentifier(spec.sourceColumn, "join source column");
  assertIdentifier(spec.targetColumn, "join target column");
  const sourceOnDelete = spec.sourceOnDelete === "ignore" ? "NO ACTION" : "RESTRICT";
  const targetOnDelete = spec.targetOnDelete === "ignore" ? "NO ACTION" : "RESTRICT";
  const sourceFkRef = `FOREIGN KEY ("${spec.sourceColumn}") REFERENCES "${spec.sourceTable}"(id) ON DELETE ${sourceOnDelete}`;
  let targetFkRef: string;
  if (spec.targetUniqueness === "single") {
    targetFkRef = `FOREIGN KEY ("${spec.targetColumn}") REFERENCES "${spec.targetTable}"("${spec.targetField}") ON DELETE ${targetOnDelete}`;
  } else {
    targetFkRef = `FOREIGN KEY (tenant_id, "${spec.targetColumn}") REFERENCES "${spec.targetTable}"(tenant_id, "${spec.targetField}") ON DELETE ${targetOnDelete}`;
  }
  return [
    `CREATE TABLE IF NOT EXISTS ${spec.table} (\n  id TEXT PRIMARY KEY,\n  tenant_id TEXT NOT NULL DEFAULT 'default',\n  "${spec.sourceColumn}" TEXT NOT NULL,\n  "${spec.targetColumn}" TEXT NOT NULL,\n  ${sourceFkRef},\n  ${targetFkRef}\n)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_${spec.table}_unique ON ${spec.table} (tenant_id, ${spec.sourceColumn}, ${spec.targetColumn})`,
    `CREATE INDEX IF NOT EXISTS idx_${spec.table}_target ON ${spec.table} (tenant_id, ${spec.targetColumn})`,
  ].join(";\n");
}

export function compileModelDdl(
  table: string,
  fields: Map<string, FieldSpec>,
  indexes: ModelIndex[],
  extensible: boolean,
  foreignKeys: ForeignKeySpec[] = [],
  many2manyTables: Many2ManyJoinTableSpec[] = [],
): string {
  assertIdentifier(table, "table");
  const businessColumns: string[] = [];
  for (const [field, spec] of fields) {
    assertIdentifier(field, "column");
    if (METADATA_NAMES.has(field)) continue;
    if (field === "_attrs" && extensible) {
      businessColumns.push(`"_attrs" TEXT NOT NULL DEFAULT '{}'`);
      continue;
    }
    businessColumns.push(
      `"${field}" ${spec.columnType}${spec.nullable || spec.optional ? "" : " NOT NULL"}`,
    );
  }

  const fkConstraints = foreignKeys.map((fk) => {
    fk.columns.forEach((col) => assertIdentifier(col, "foreign key column"));
    assertIdentifier(fk.targetTable, "foreign key target table");
    fk.targetColumns.forEach((col) => assertIdentifier(col, "foreign key target column"));
    return `FOREIGN KEY (${fk.columns.map((c) => `"${c}"`).join(", ")}) REFERENCES "${fk.targetTable}"(${fk.targetColumns.map((c) => `"${c}"`).join(", ")}) ON DELETE ${fk.onDelete}`;
  });

  const indexDefinitions = indexes.map((idx) => {
    const columns = idx.fields.map((field) => {
      assertIdentifier(field, "index column");
      if (!fields.has(field) && !METADATA_NAMES.has(field)) {
        throw new Error(`Index on '${table}' references unknown column '${field}'.`);
      }
      return field;
    });
    const idxName = `idx_${table}_${columns.join("_")}`;
    assertIdentifier(idxName, "index name");
    const kind = idx.unique ? "CREATE UNIQUE INDEX" : "CREATE INDEX";
    return `${kind} IF NOT EXISTS ${idxName} ON ${table} (${idx.fields.join(", ")})`;
  });

  const allColumns = [...METADATA_COLUMNS, ...businessColumns, ...fkConstraints];
  const joinStatements = many2manyTables.map((spec) => compileMany2ManyJoinTableDdl(spec));
  return [
    `CREATE TABLE IF NOT EXISTS ${table} (\n  ${allColumns.join(",\n  ")}\n)`,
    ...indexDefinitions,
    ...joinStatements,
  ].join(";\n");
}

function buildCustomFieldValidator(spec: RuntimeCustomFieldSpec): z.ZodTypeAny {
  let base: z.ZodTypeAny;
  switch (spec.field_type) {
    case "integer":
      base = z.number().int();
      break;
    case "real":
      base = z.number();
      break;
    case "boolean":
      base = z.boolean();
      break;
    case "date":
      base = z.union([z.string(), z.date()]);
      break;
    case "json":
      base = z.unknown();
      break;
    case "selection": {
      const options = spec.selection ?? [];
      if (options.length === 0) {
        base = z.string();
      } else {
        base = z.enum(options as [string, ...string[]]);
      }
      break;
    }
    case "text":
    default:
      base = z.string();
      break;
  }

  if (spec.nullable) {
    base = base.nullable();
  }
  if (!spec.required) {
    base = base.optional();
  }
  return base;
}

export function validateAttrsPayload(
  rawAttrs: unknown,
  customFields: RuntimeCustomFieldSpec[],
  opts: ValidateAttrsOptions = {},
): Record<string, unknown> {
  if (
    rawAttrs !== undefined &&
    rawAttrs !== null &&
    (typeof rawAttrs !== "object" || Array.isArray(rawAttrs))
  ) {
    throw new Error("_attrs payload must be a plain object.");
  }

  const attrsObj =
    rawAttrs && typeof rawAttrs === "object"
      ? ({ ...(rawAttrs as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of customFields) {
    assertIdentifier(field.field_name, "custom field");
    if (attrsObj[field.field_name] === undefined && field.default_value !== undefined) {
      attrsObj[field.field_name] = field.default_value;
    }
    shape[field.field_name] = buildCustomFieldValidator(field);
  }

  if (opts.allowFreeformExtra) {
    shape._extra = z.record(z.string(), z.unknown()).optional();
  }

  const schema = z.object(shape).strict();
  return schema.parse(attrsObj);
}
