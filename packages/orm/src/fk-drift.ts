import type { LibSqlExecutor } from "./drivers/sqlite.driver.js";
import type { RegisteredModelDescriptor } from "./registry.js";
import { modelRegistry } from "./registry.js";

export interface ForeignKeyExpectation {
  tableName: string;
  columns: string[];
  targetTable: string;
  targetColumns: string[];
  onDelete: string;
  relationName?: string;
}

export interface ForeignKeyDrift {
  kind: "missing" | "mismatch" | "extra";
  expectation: ForeignKeyExpectation;
  existing?: {
    name: string;
    columns: string[];
    targetTable: string;
    targetColumns: string[];
    onDelete: string;
  };
}

export interface IntegrityLookupContext {
  sourceModel: string;
  sourceTable: string;
  relationName: string;
  targetModel: string;
  targetTable: string;
  sourceSoftDelete: boolean;
  targetSoftDelete: boolean;
}

export interface MissingFkReport {
  kind: "missing" | "mismatch" | "extra" | "ondelete_mismatch" | "validated_mismatch";
  table: string;
  column: string;
  targetTable: string;
  targetColumn: string;
  expectedOnDelete: string;
  existingOnDelete?: string;
  relationName?: string;
  side?: "source" | "target" | "join";
}

export function findForeignKeyDrift(
  expectation: ForeignKeyExpectation,
  foreignKeys: Array<{
    name: string;
    columns: string[];
    targetTable: string;
    targetColumns: string[];
    onDelete: string;
  }>,
): ForeignKeyDrift | null {
  const existing = foreignKeys.find(
    (fk) =>
      fk.columns.join(",") === expectation.columns.join(",") &&
      fk.targetTable === expectation.targetTable &&
      fk.targetColumns.join(",") === expectation.targetColumns.join(","),
  );

  if (!existing) {
    return { kind: "missing", expectation };
  }

  if (existing.onDelete !== expectation.onDelete) {
    return {
      kind: "mismatch",
      expectation,
      existing: {
        name: existing.name,
        columns: existing.columns,
        targetTable: existing.targetTable,
        targetColumns: existing.targetColumns,
        onDelete: existing.onDelete,
      },
    };
  }

  return null;
}

export async function findInvalidReferenceRows(
  executor: LibSqlExecutor,
  expectation: ForeignKeyExpectation,
  context: IntegrityLookupContext,
): Promise<
  Array<{
    id: string;
    tenant_id: string;
    fk_val: unknown;
  }>
> {
  const sourceTable = context.sourceTable;
  const targetTable = context.targetTable;
  const sourceColumns = expectation.columns;
  const targetColumns = expectation.targetColumns;

  const sourceColumn = sourceColumns[0];
  const targetColumn = targetColumns[0];

  const srcDeletedFilter = context.sourceSoftDelete ? " AND src.status != 'deleted'" : "";
  const tgtDeletedFilter = context.targetSoftDelete ? " AND tgt.status != 'deleted'" : "";

  const badRows = await executor.all<{
    id: string;
    tenant_id: string;
    fk_val: unknown;
  }>(
    `SELECT src.id AS id, src.tenant_id AS tenant_id, src.${sourceColumn} AS fk_val
     FROM ${sourceTable} src
     WHERE src.${sourceColumn} IS NOT NULL${srcDeletedFilter}
       AND NOT EXISTS (
           SELECT 1 FROM ${targetTable} tgt
           WHERE tgt.${targetColumn} = src.${sourceColumn}
             AND tgt.tenant_id = src.tenant_id${tgtDeletedFilter}
         )`,
  );

  return badRows;
}

export function modelForeignKeyExpectations(
  descriptor: RegisteredModelDescriptor,
): ForeignKeyExpectation[] {
  const expectations: ForeignKeyExpectation[] = [];

  // Use actual FK columns from descriptor.foreignKeys to ensure consistency
  for (const fk of descriptor.foreignKeys) {
    // Find the relation name for this FK
    let relationName: string | undefined;
    if (descriptor.relations) {
      for (const [relName, rel] of Object.entries(descriptor.relations)) {
        if (rel.type === "many2one" && rel.targetField === fk.targetColumns[0]) {
          relationName = relName;
          break;
        }
      }
    }

    expectations.push({
      tableName: descriptor.table,
      columns: fk.columns,
      targetTable: fk.targetTable,
      targetColumns: fk.targetColumns,
      onDelete: fk.onDelete.toLowerCase(),
      relationName,
    });
  }

  return expectations;
}

export interface Many2ManyFkPair {
  expectation: ForeignKeyExpectation;
  context: IntegrityLookupContext;
}

export function many2ManyForeignKeyExpectations(
  descriptor: RegisteredModelDescriptor,
): Many2ManyFkPair[] {
  const pairs: Many2ManyFkPair[] = [];

  for (const m2m of descriptor.many2manyTables) {
    const target = modelRegistry.get(m2m.targetModel);
    if (!target) continue;

    const sourceTargetCols = m2m.targetUniqueness === "tenant_composite" ? ["tenant_id", "id"] : ["id"];
    const targetTargetCols = m2m.targetUniqueness === "tenant_composite" ? ["tenant_id", m2m.targetField] : [m2m.targetField];
    const onDelete = m2m.onDelete === "ignore" ? "NO ACTION" : "RESTRICT";

    const srcContext: IntegrityLookupContext = {
      sourceModel: descriptor.name,
      sourceTable: m2m.table,
      relationName: m2m.relationName,
      targetModel: descriptor.name,
      targetTable: descriptor.table,
      sourceSoftDelete: false,
      targetSoftDelete: descriptor.softDelete,
    };

    const tgtContext: IntegrityLookupContext = {
      sourceModel: descriptor.name,
      sourceTable: m2m.table,
      relationName: m2m.relationName,
      targetModel: target.name,
      targetTable: target.table,
      sourceSoftDelete: false,
      targetSoftDelete: target.softDelete,
    };

    pairs.push({
      expectation: {
        tableName: m2m.table,
        columns: [m2m.sourceColumn],
        targetTable: descriptor.table,
        targetColumns: sourceTargetCols,
        onDelete,
        relationName: m2m.relationName,
      },
      context: srcContext,
    });

    pairs.push({
      expectation: {
        tableName: m2m.table,
        columns: [m2m.targetColumn],
        targetTable: target.table,
        targetColumns: targetTargetCols,
        onDelete,
        relationName: m2m.relationName,
      },
      context: tgtContext,
    });
  }

  return pairs;
}

export async function inspectTableCatalog(
  executor: LibSqlExecutor,
  table: string,
  isPostgres: boolean,
): Promise<{
  columns: string[];
  indexes: string[];
  constraints: Array<{ name: string; type: string }>;
  foreignKeys?: Array<{
    name: string;
    constrainedColumns: string[];
    referencedTable: string;
    referencedColumns: string[];
    onDelete: string;
    validated: boolean;
  }>;
}> {
  if (isPostgres) {
    const colRows = await executor.all<{ name: string }>(
      "SELECT column_name AS name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ?",
      [table.toLowerCase()],
    );
    const idxRows = await executor.all<{ name: string }>(
      "SELECT indexname AS name FROM pg_indexes WHERE schemaname = 'public' AND tablename = ?",
      [table.toLowerCase()],
    );
    const conRows = await executor.all<{ name: string; contype: string }>(
      `SELECT con.conname AS name, con.contype AS contype
       FROM pg_constraint con
       JOIN pg_class rel ON rel.oid = con.conrelid
       JOIN pg_namespace n ON n.oid = rel.relnamespace
       WHERE n.nspname = 'public' AND rel.relname = ?`,
      [table.toLowerCase()],
    );
    // Fetch FK details for PostgreSQL
    const fkRows = await executor.all<{
      conname: string;
      conkey: number[];
      confkey: number[];
      confrelid: number;
      confdeltype: string;
      convalidated: boolean;
    }>(
      `SELECT con.conname AS conname,
              con.conkey AS conkey,
              con.confkey AS confkey,
              con.confrelid AS confrelid,
              con.confdeltype AS confdeltype,
              con.convalidated AS convalidated
       FROM pg_constraint con
       JOIN pg_class rel ON rel.oid = con.conrelid
       JOIN pg_namespace n ON n.oid = rel.relnamespace
       WHERE n.nspname = 'public' AND rel.relname = ? AND con.contype = 'f'`,
      [table.toLowerCase()],
    );

    // Get column names for the table to map conkey/confkey arrays
    const colNameRows = await executor.all<{ attname: string; attnum: number }>(
      `SELECT attname, attnum FROM pg_attribute
       WHERE attrelid = (SELECT oid FROM pg_class WHERE relname = ? AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
       AND attnum > 0 AND NOT attisdropped`,
      [table.toLowerCase()],
    );
    const colNamesByNum = new Map<number, string>();
    for (const r of colNameRows) {
      colNamesByNum.set(r.attnum, r.attname);
    }

    // Get referenced table names and column names for each FK
    const foreignKeys = [];
    for (const fk of fkRows) {
      const constrainedColumns = (fk.conkey as number[])
        .map((n) => colNamesByNum.get(n))
        .filter(Boolean) as string[];
      // Get referenced table
      const refTableRow = await executor.get<{ relname: string }>(
        `SELECT relname FROM pg_class WHERE oid = ?`,
        [fk.confrelid],
      );
      const referencedTable = refTableRow?.relname ?? "";
      // Get referenced column names
      const refColNameRows = await executor.all<{ attname: string; attnum: number }>(
        `SELECT attname, attnum FROM pg_attribute
         WHERE attrelid = ? AND attnum > 0 AND NOT attisdropped`,
        [fk.confrelid],
      );
      const refColNamesByNum = new Map<number, string>();
      for (const r of refColNameRows) {
        refColNamesByNum.set(r.attnum, r.attname);
      }
      const referencedColumns = (fk.confkey as number[])
        .map((n) => refColNamesByNum.get(n))
        .filter(Boolean) as string[];

      // Map confdeltype to ON DELETE action
      // 'a' = NO ACTION, 'r' = RESTRICT, 'c' = CASCADE, 'n' = SET NULL, 'd' = SET DEFAULT
      const onDeleteMap: Record<string, string> = {
        a: "NO ACTION",
        r: "RESTRICT",
        c: "CASCADE",
        n: "SET NULL",
        d: "SET DEFAULT",
      };
      const onDelete = onDeleteMap[fk.confdeltype] ?? "NO ACTION";

      foreignKeys.push({
        name: fk.conname,
        constrainedColumns,
        referencedTable,
        referencedColumns,
        onDelete,
        validated: fk.convalidated,
      });
    }
    return {
      columns: colRows.map((r) => String(r.name)),
      indexes: idxRows.map((r) => String(r.name)),
      constraints: conRows.map((r) => ({ name: String(r.name), type: String(r.contype) })),
      foreignKeys,
    };
  }

  const colRows = await executor.all<{ name: string }>(`PRAGMA table_info(${table})`);
  const idxRows = await executor.all<{ name: string }>(`PRAGMA index_list(${table})`);
  // Get foreign keys for SQLite using PRAGMA foreign_key_list
  const fkRows = await executor.all<{
    id: number;
    seq: number;
    table: string;
    from: string;
    to: string;
    on_update: string;
    on_delete: string;
    match: string;
  }>(`PRAGMA foreign_key_list(${table})`);

  // Group by constraint id
  const fkGroups = new Map<number, typeof fkRows[0][]>();
  for (const row of fkRows) {
    if (!fkGroups.has(row.id)) fkGroups.set(row.id, []);
    fkGroups.get(row.id)!.push(row);
  }

  const foreignKeys = [];
  for (const [, rows] of fkGroups) {
    const first = rows[0];
    if (!first) continue;
    foreignKeys.push({
      name: `fk_${first.id}`,
      constrainedColumns: rows.map((r) => r.from),
      referencedTable: first.table,
      referencedColumns: rows.map((r) => r.to),
      onDelete: first.on_delete.toUpperCase(),
      validated: true, // SQLite FKs are always validated
    });
  }

  return {
    columns: colRows.map((r) => String(r.name)),
    indexes: idxRows.map((r) => String(r.name)),
    constraints: [],
    foreignKeys,
  };
}

function _confdeltypeToAction(code: string): string {
  switch (code) {
    case "a":
      return "no action";
    case "r":
      return "restrict";
    case "c":
      return "cascade";
    case "n":
      return "set null";
    case "d":
      return "set default";
    default:
      return "restrict";
  }
}