import { createHash } from "node:crypto";
import { getDb } from "./driver.js";
import type { LibSqlExecutor } from "./drivers/sqlite.driver.js";
import { modelRegistry, type RegisteredModelDescriptor } from "./registry.js";
import { METADATA_COLUMNS, METADATA_NAMES } from "./schema-utils.js";

export const SCHEMA_DRIFT_REPORT_VERSION = 1;

export type SchemaDriftCode =
  | "TABLE_MISSING"
  | "COLUMN_MISSING"
  | "COLUMN_TYPE_MISMATCH"
  | "COLUMN_NULLABILITY_MISMATCH"
  | "COLUMN_EXTRA"
  | "INDEX_MISSING"
  | "INDEX_UNIQUENESS_MISMATCH"
  | "FOREIGN_KEY_MISSING"
  | "FOREIGN_KEY_MISMATCH";

export type SchemaDriftObjectKind = "table" | "column" | "index" | "foreign_key";

export interface SchemaDriftFinding {
  code: SchemaDriftCode;
  /** `error` findings make the report not ok; `warning` findings are informational (extra objects). */
  severity: "error" | "warning";
  model: string;
  table: string;
  objectKind: SchemaDriftObjectKind;
  objectName: string;
  expected: string | null;
  observed: string | null;
}

export interface SchemaDriftModelSummary {
  model: string;
  table: string;
  descriptorHash: string;
  catalogFingerprint: string | null;
}

export interface SchemaDriftReport {
  version: typeof SCHEMA_DRIFT_REPORT_VERSION;
  ok: boolean;
  models: SchemaDriftModelSummary[];
  findings: SchemaDriftFinding[];
}

interface ObservedColumn {
  name: string;
  type: string;
  notNull: boolean;
}

interface ObservedIndex {
  name: string;
  unique: boolean;
  columns: string[];
}

interface ObservedForeignKey {
  name: string;
  columns: string[];
  targetTable: string;
  targetColumns: string[];
  onDelete: string;
}

interface ObservedTable {
  columns: ObservedColumn[];
  indexes: ObservedIndex[];
  foreignKeys: ObservedForeignKey[];
}

interface ExpectedColumn {
  name: string;
  type: string;
  notNull: boolean;
}

interface ExpectedIndex {
  unique: boolean;
  columns: string[];
}

interface ExpectedForeignKey {
  columns: string[];
  targetTable: string;
  targetColumns: string[];
  onDelete: string;
}

interface ExpectedTable {
  model: string;
  table: string;
  columns: ExpectedColumn[];
  indexes: ExpectedIndex[];
  foreignKeys: ExpectedForeignKey[];
}

const PG_TYPE_ALIASES: Record<string, string> = {
  int4: "integer",
  int: "integer",
  int8: "bigint",
  int2: "smallint",
  float4: "real",
  float8: "double precision",
  bool: "boolean",
  varchar: "character varying",
  "timestamp without time zone": "timestamp",
};

/** Canonical lower-case PostgreSQL type name so equivalent spellings compare equal. */
export function normalizePgType(raw: string): string {
  const collapsed = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return PG_TYPE_ALIASES[collapsed] ?? collapsed;
}

const PG_DELETE_ACTIONS: Record<string, string> = {
  a: "NO ACTION",
  r: "RESTRICT",
  c: "CASCADE",
  n: "SET NULL",
  d: "SET DEFAULT",
};

export function describePgDeleteAction(code: string): string {
  return PG_DELETE_ACTIONS[code] ?? code.toUpperCase();
}

function lowerAll(values: string[]): string[] {
  return values.map((value) => value.toLowerCase());
}

function columnKey(columns: string[]): string {
  return lowerAll(columns).join(",");
}

function describeIndex(unique: boolean, columns: string[]): string {
  return `${unique ? "UNIQUE " : ""}(${lowerAll(columns).join(", ")})`;
}

function describeForeignKey(fk: {
  columns: string[];
  targetTable: string;
  targetColumns: string[];
  onDelete: string;
}): string {
  return `(${lowerAll(fk.columns).join(", ")}) -> ${fk.targetTable.toLowerCase()}(${lowerAll(fk.targetColumns).join(", ")}) ON DELETE ${fk.onDelete.toUpperCase()}`;
}

function describeColumn(type: string, notNull: boolean): string {
  return `${normalizePgType(type)} ${notNull ? "NOT NULL" : "NULL"}`;
}

function parseMetadataColumn(definition: string): ExpectedColumn {
  const [name = "", type = ""] = definition.split(/\s+/);
  return {
    name,
    type,
    notNull: /\bNOT NULL\b|\bPRIMARY KEY\b/i.test(definition),
  };
}

export function computeDescriptorHash(descriptor: RegisteredModelDescriptor): string {
  const payload = {
    name: descriptor.name,
    table: descriptor.table,
    softDelete: descriptor.softDelete,
    extensible: descriptor.extensible,
    fields: [...descriptor.fields.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([col, spec]) => ({
        col,
        type: spec.columnType,
        nullable: spec.nullable,
        optional: spec.optional,
        hasDefault: spec.hasDefault,
        defaultValue: spec.defaultValue ?? null,
      })),
    indexes: descriptor.indexes,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function buildExpectedTables(descriptors: RegisteredModelDescriptor[]): ExpectedTable[] {
  const tables: ExpectedTable[] = [];
  const seenJoinTables = new Set<string>();

  for (const descriptor of descriptors) {
    const columns: ExpectedColumn[] = METADATA_COLUMNS.map(parseMetadataColumn);
    for (const [name, spec] of descriptor.fields) {
      if (METADATA_NAMES.has(name)) continue;
      if (name === "_attrs" && descriptor.extensible) {
        columns.push({ name, type: "TEXT", notNull: true });
        continue;
      }
      columns.push({
        name,
        type: spec.columnType,
        notNull: !(spec.nullable || spec.optional),
      });
    }
    tables.push({
      model: descriptor.name,
      table: descriptor.table,
      columns,
      indexes: descriptor.indexes.map((idx) => ({
        unique: idx.unique === true,
        columns: idx.fields,
      })),
      foreignKeys: descriptor.foreignKeys.map((fk) => ({
        columns: fk.columns,
        targetTable: fk.targetTable,
        targetColumns: fk.targetColumns,
        onDelete: fk.onDelete,
      })),
    });

    for (const join of descriptor.many2manyTables) {
      if (seenJoinTables.has(join.table)) continue;
      seenJoinTables.add(join.table);
      tables.push({
        model: descriptor.name,
        table: join.table,
        columns: [
          { name: "id", type: "TEXT", notNull: true },
          { name: "tenant_id", type: "TEXT", notNull: true },
          { name: join.sourceColumn, type: "TEXT", notNull: true },
          { name: join.targetColumn, type: "TEXT", notNull: true },
        ],
        indexes: [
          { unique: true, columns: ["tenant_id", join.sourceColumn, join.targetColumn] },
          { unique: false, columns: ["tenant_id", join.targetColumn] },
        ],
        foreignKeys: [],
      });
    }
  }
  return tables;
}

const COLUMNS_SQL = `SELECT a.attname AS name,
       format_type(a.atttypid, a.atttypmod) AS type,
       a.attnotnull AS not_null
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = ? AND c.relkind IN ('r', 'p')
  AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY a.attnum`;

const INDEXES_SQL = `SELECT ic.relname AS name,
       i.indisunique AS is_unique,
       (SELECT string_agg(a.attname, ',' ORDER BY k.ord)
          FROM unnest(i.indkey::int2[]) WITH ORDINALITY AS k(attnum, ord)
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
         WHERE k.attnum > 0) AS columns
FROM pg_index i
JOIN pg_class ic ON ic.oid = i.indexrelid
JOIN pg_class c ON c.oid = i.indrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = ?
ORDER BY ic.relname`;

const FOREIGN_KEYS_SQL = `SELECT con.conname AS name,
       tc.relname AS target_table,
       con.confdeltype AS on_delete,
       (SELECT string_agg(a.attname, ',' ORDER BY k.ord)
          FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
          JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum) AS columns,
       (SELECT string_agg(a.attname, ',' ORDER BY k.ord)
          FROM unnest(con.confkey) WITH ORDINALITY AS k(attnum, ord)
          JOIN pg_attribute a ON a.attrelid = con.confrelid AND a.attnum = k.attnum) AS target_columns
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_class tc ON tc.oid = con.confrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE con.contype = 'f' AND n.nspname = 'public' AND c.relname = ?
ORDER BY con.conname`;

function splitList(value: unknown): string[] {
  return typeof value === "string" && value.length > 0 ? value.split(",") : [];
}

async function readObservedTable(
  executor: LibSqlExecutor,
  table: string,
): Promise<ObservedTable | null> {
  const lookup = [table.toLowerCase()];
  const columnRows = await executor.all<{ name: string; type: string; not_null: unknown }>(
    COLUMNS_SQL,
    lookup,
  );
  if (columnRows.length === 0) return null;
  const indexRows = await executor.all<{ name: string; is_unique: unknown; columns: unknown }>(
    INDEXES_SQL,
    lookup,
  );
  const foreignKeyRows = await executor.all<{
    name: string;
    target_table: string;
    on_delete: string;
    columns: unknown;
    target_columns: unknown;
  }>(FOREIGN_KEYS_SQL, lookup);
  return {
    columns: columnRows.map((row) => ({
      name: String(row.name),
      type: String(row.type),
      notNull: row.not_null === true || row.not_null === 1 || row.not_null === "t",
    })),
    indexes: indexRows.map((row) => ({
      name: String(row.name),
      unique: row.is_unique === true || row.is_unique === 1 || row.is_unique === "t",
      columns: splitList(row.columns),
    })),
    foreignKeys: foreignKeyRows.map((row) => ({
      name: String(row.name),
      columns: splitList(row.columns),
      targetTable: String(row.target_table),
      targetColumns: splitList(row.target_columns),
      onDelete: describePgDeleteAction(String(row.on_delete)),
    })),
  };
}

function fingerprintObserved(observed: ObservedTable): string {
  const canonical = {
    columns: [...observed.columns]
      .map((col) => ({ n: col.name, t: normalizePgType(col.type), nn: col.notNull }))
      .sort((a, b) => a.n.localeCompare(b.n)),
    indexes: observed.indexes
      .map((idx) => `${idx.unique ? "u" : "i"}:${columnKey(idx.columns)}`)
      .sort(),
    foreignKeys: observed.foreignKeys
      .map(
        (fk) =>
          `${columnKey(fk.columns)}>${fk.targetTable.toLowerCase()}(${columnKey(fk.targetColumns)}):${fk.onDelete}`,
      )
      .sort(),
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

function compareTable(expected: ExpectedTable, observed: ObservedTable): SchemaDriftFinding[] {
  const findings: SchemaDriftFinding[] = [];
  const base = { model: expected.model, table: expected.table };
  const observedByName = new Map(observed.columns.map((col) => [col.name.toLowerCase(), col]));

  for (const column of expected.columns) {
    const actual = observedByName.get(column.name.toLowerCase());
    if (!actual) {
      findings.push({
        ...base,
        code: "COLUMN_MISSING",
        severity: "error",
        objectKind: "column",
        objectName: column.name,
        expected: describeColumn(column.type, column.notNull),
        observed: null,
      });
      continue;
    }
    if (normalizePgType(actual.type) !== normalizePgType(column.type)) {
      findings.push({
        ...base,
        code: "COLUMN_TYPE_MISMATCH",
        severity: "error",
        objectKind: "column",
        objectName: column.name,
        expected: describeColumn(column.type, column.notNull),
        observed: describeColumn(actual.type, actual.notNull),
      });
      continue;
    }
    if (actual.notNull !== column.notNull) {
      findings.push({
        ...base,
        code: "COLUMN_NULLABILITY_MISMATCH",
        severity: "error",
        objectKind: "column",
        objectName: column.name,
        expected: describeColumn(column.type, column.notNull),
        observed: describeColumn(actual.type, actual.notNull),
      });
    }
  }

  const expectedNames = new Set(expected.columns.map((col) => col.name.toLowerCase()));
  for (const actual of observed.columns) {
    if (expectedNames.has(actual.name.toLowerCase())) continue;
    findings.push({
      ...base,
      code: "COLUMN_EXTRA",
      severity: "warning",
      objectKind: "column",
      objectName: actual.name,
      expected: null,
      observed: describeColumn(actual.type, actual.notNull),
    });
  }

  for (const index of expected.indexes) {
    const key = columnKey(index.columns);
    const sameColumns = observed.indexes.filter((idx) => columnKey(idx.columns) === key);
    const exact = sameColumns.some((idx) => idx.unique === index.unique);
    if (exact) continue;
    const incompatible = sameColumns.find((idx) => !idx.unique && index.unique);
    findings.push({
      ...base,
      code: incompatible ? "INDEX_UNIQUENESS_MISMATCH" : "INDEX_MISSING",
      severity: "error",
      objectKind: "index",
      objectName: lowerAll(index.columns).join(","),
      expected: describeIndex(index.unique, index.columns),
      observed: incompatible ? describeIndex(incompatible.unique, incompatible.columns) : null,
    });
  }

  for (const fk of expected.foreignKeys) {
    const key = columnKey(fk.columns);
    const sameColumns = observed.foreignKeys.filter(
      (candidate) => columnKey(candidate.columns) === key,
    );
    const exact = sameColumns.some(
      (candidate) =>
        candidate.targetTable.toLowerCase() === fk.targetTable.toLowerCase() &&
        columnKey(candidate.targetColumns) === columnKey(fk.targetColumns) &&
        candidate.onDelete === fk.onDelete.toUpperCase(),
    );
    if (exact) continue;
    const [mismatched] = sameColumns;
    findings.push({
      ...base,
      code: mismatched ? "FOREIGN_KEY_MISMATCH" : "FOREIGN_KEY_MISSING",
      severity: "error",
      objectKind: "foreign_key",
      objectName: lowerAll(fk.columns).join(","),
      expected: describeForeignKey(fk),
      observed: mismatched ? describeForeignKey(mismatched) : null,
    });
  }

  return findings;
}

function resolveDescriptors(
  models?: Array<string | { name: string }>,
): RegisteredModelDescriptor[] {
  if (!models || models.length === 0) return modelRegistry.list();
  const seen = new Set<string>();
  const resolved: RegisteredModelDescriptor[] = [];
  for (const item of models) {
    const name = typeof item === "string" ? item : item.name;
    if (seen.has(name)) continue;
    const descriptor = modelRegistry.get(name);
    if (!descriptor) {
      throw new Error(`Cannot inspect unknown model '${name}'. Call defineModel() first.`);
    }
    seen.add(name);
    resolved.push(descriptor);
  }
  return resolved;
}

/**
 * Read-only PostgreSQL schema drift inspection. Executes catalog SELECTs inside a
 * READ ONLY transaction; never issues DDL and never reads business-row contents.
 */
export async function inspectSchemaDrift(
  models?: Array<string | { name: string }>,
): Promise<SchemaDriftReport> {
  const db = getDb();
  if ((db.kind ?? db.dialect) !== "postgres") {
    throw new Error("inspectSchemaDrift requires an active PostgreSQL ORM connection.");
  }
  const descriptors = resolveDescriptors(models);
  const expectedTables = buildExpectedTables(descriptors);
  const findings: SchemaDriftFinding[] = [];
  const summaries: SchemaDriftModelSummary[] = [];
  const fingerprints = new Map<string, string | null>();

  await db.transaction(async (tx) => {
    await tx.exec("SET TRANSACTION READ ONLY");
    for (const expected of expectedTables) {
      const observed = await readObservedTable(tx, expected.table);
      if (!observed) {
        fingerprints.set(expected.table, null);
        findings.push({
          model: expected.model,
          table: expected.table,
          code: "TABLE_MISSING",
          severity: "error",
          objectKind: "table",
          objectName: expected.table,
          expected: `table with ${expected.columns.length} columns`,
          observed: null,
        });
        continue;
      }
      fingerprints.set(expected.table, fingerprintObserved(observed));
      findings.push(...compareTable(expected, observed));
    }
  });

  for (const descriptor of descriptors) {
    summaries.push({
      model: descriptor.name,
      table: descriptor.table,
      descriptorHash: computeDescriptorHash(descriptor),
      catalogFingerprint: fingerprints.get(descriptor.table) ?? null,
    });
  }

  return {
    version: SCHEMA_DRIFT_REPORT_VERSION,
    ok: findings.every((finding) => finding.severity !== "error"),
    models: summaries,
    findings,
  };
}
