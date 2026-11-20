import { createHash } from "node:crypto";
import { getDb } from "./driver.js";
import type { LibSqlExecutor } from "./drivers/sqlite.driver.js";
import { ensureAuditTable, uuidv7 } from "./define-model.js";
import { modelRegistry, type RegisteredModelDescriptor } from "./registry.js";
import {
  assertIdentifier,
  compileMany2ManyJoinTableDdl,
  formatSqlDefaultLiteral,
  METADATA_NAMES,
} from "./schema-utils.js";
import { inspectTableCatalog, type MissingFkReport } from "./fk-drift.js";

export { type MissingFkReport, inspectTableCatalog } from "./fk-drift.js";

export interface SyncModelsOptions {
  legacyBackfill?: boolean;
  dialect?: "sqlite" | "postgres";
}

export interface SyncReport {
  createdTables: string[];
  addedColumns: Array<{ table: string; column: string }>;
  deprecatedColumns: Array<{ table: string; column: string }>;
  createdIndexes: string[];
  schemaHashes: Record<string, string>;
  missingFks: MissingFkReport[];
  addedFks: string[];
}

export interface RelationIntegrityViolation {
  kind: "orphan" | "cross_tenant";
  model: string;
  table: string;
  relation: string;
  targetModel: string;
  targetTable: string;
  recordId: string;
  tenantId: string;
  targetTenantId?: string;
  value: unknown;
}

const PG_SYNC_ADVISORY_LOCK_KEY = 72491081;

const LEGACY_METADATA_COLUMN_DEFS: ReadonlyArray<{
  name: string;
  ddl: string;
}> = [
  { name: "id", ddl: "id TEXT DEFAULT ''" },
  { name: "create_uid", ddl: "create_uid TEXT" },
  { name: "create_date", ddl: "create_date TEXT DEFAULT ''" },
  { name: "write_uid", ddl: "write_uid TEXT" },
  { name: "write_date", ddl: "write_date TEXT DEFAULT ''" },
  { name: "status", ddl: "status TEXT NOT NULL DEFAULT 'active'" },
  { name: "deleted_uid", ddl: "deleted_uid TEXT" },
  { name: "deleted_date", ddl: "deleted_date TEXT" },
  { name: "version", ddl: "version INTEGER NOT NULL DEFAULT 1" },
  { name: "source", ddl: "source TEXT NOT NULL DEFAULT 'migration'" },
  { name: "source_ref", ddl: "source_ref TEXT" },
  { name: "tenant_id", ddl: "tenant_id TEXT NOT NULL DEFAULT 'default'" },
];

function computeModelSchemaHash(descriptor: RegisteredModelDescriptor): string {
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

function resolveDescriptors(
  models?: Array<string | { name: string }>,
): RegisteredModelDescriptor[] {
  if (!models || models.length === 0) {
    return modelRegistry.list();
  }
  const seen = new Set<string>();
  const resolved: RegisteredModelDescriptor[] = [];
  for (const item of models) {
    const name = typeof item === "string" ? item : item.name;
    if (seen.has(name)) continue;
    const desc = modelRegistry.get(name);
    if (!desc) {
      throw new Error(`Cannot sync unknown model '${name}'. Call defineModel() first.`);
    }
    seen.add(name);
    resolved.push(desc);
  }
  return resolved;
}

function sortDescriptorsByRelationDeps(
  descriptors: RegisteredModelDescriptor[],
): RegisteredModelDescriptor[] {
  const byName = new Map(descriptors.map((d) => [d.name, d]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const sorted: RegisteredModelDescriptor[] = [];

  const visit = (desc: RegisteredModelDescriptor): void => {
    if (visited.has(desc.name) || visiting.has(desc.name)) return;
    visiting.add(desc.name);
    for (const rel of Object.values(desc.relations ?? {})) {
      if (rel.type === "one2many" || rel.type === "many2many") continue;
      const target = byName.get(rel.model);
      if (target) visit(target);
    }
    visiting.delete(desc.name);
    visited.add(desc.name);
    sorted.push(desc);
  };

  for (const desc of descriptors) {
    visit(desc);
  }
  return sorted;
}

/**
 * Inspect existing tables for orphan or cross-tenant foreign-key / many2many references
 * prior to applying or enforcing relational constraints.
 */
export async function preflightRelationIntegrity(
  models?: Array<string | { name: string }>,
): Promise<{ ok: boolean; violations: RelationIntegrityViolation[] }> {
  const db = getDb();
  const isPostgres = (db.kind ?? db.dialect) === "postgres";
  const descriptors = resolveDescriptors(models);
  const violations: RelationIntegrityViolation[] = [];
  const tableExistsCache = new Map<string, boolean>();

  const tableExists = async (table: string): Promise<boolean> => {
    const cached = tableExistsCache.get(table);
    if (cached !== undefined) return cached;
    const cat = await inspectTableCatalog(db, table, isPostgres);
    const exists = cat.columns.length > 0;
    tableExistsCache.set(table, exists);
    return exists;
  };

  for (const desc of descriptors) {
    if (!(await tableExists(desc.table))) continue;
    const srcDeletedFilter = desc.softDelete ? " AND src.status != 'deleted'" : "";

    for (const [relName, rel] of Object.entries(desc.relations ?? {})) {
      if (rel.type === "one2many") continue;
      const target = modelRegistry.get(rel.model);
      if (!target || !(await tableExists(target.table))) continue;

      if (rel.type === "many2many") {
        const joinSpec = desc.many2manyTables.find((s) => s.relationName === relName);
        if (!joinSpec || !(await tableExists(joinSpec.table))) continue;
        const tgtDeletedFilter = target.softDelete ? " AND tgt.status != 'deleted'" : "";
        const badJoinRows = await db.all<{
          id: string;
          tenant_id: string;
          source_val: unknown;
          target_val: unknown;
        }>(
          `SELECT j.id AS id, j.tenant_id AS tenant_id, j.${joinSpec.sourceColumn} AS source_val, j.${joinSpec.targetColumn} AS target_val
           FROM ${joinSpec.table} j
           WHERE NOT EXISTS (
             SELECT 1 FROM ${desc.table} src
             WHERE src.id = j.${joinSpec.sourceColumn} AND src.tenant_id = j.tenant_id${srcDeletedFilter}
           ) OR NOT EXISTS (
             SELECT 1 FROM ${target.table} tgt
             WHERE tgt.${joinSpec.targetField} = j.${joinSpec.targetColumn} AND tgt.tenant_id = j.tenant_id${tgtDeletedFilter}
           )`,
        );
        for (const row of badJoinRows) {
          const crossTenant = await db.get<{ tenant_id: string }>(
            `SELECT tgt.tenant_id AS tenant_id FROM ${target.table} tgt WHERE tgt.${joinSpec.targetField} = ?${tgtDeletedFilter} LIMIT 1`,
            [row.target_val],
          );
          violations.push({
            kind:
              crossTenant && crossTenant.tenant_id !== row.tenant_id ? "cross_tenant" : "orphan",
            model: desc.name,
            table: joinSpec.table,
            relation: relName,
            targetModel: target.name,
            targetTable: target.table,
            recordId: String(row.id),
            tenantId: String(row.tenant_id),
            ...(crossTenant && crossTenant.tenant_id !== row.tenant_id
              ? { targetTenantId: String(crossTenant.tenant_id) }
              : {}),
            value: row.target_val,
          });
        }
        continue;
      }

      const targetField = rel.targetField ?? "id";
      const tgtDeletedFilter = target.softDelete ? " AND tgt.status != 'deleted'" : "";
      const orphanRows = await db.all<{ id: string; tenant_id: string; fk_val: unknown }>(
        `SELECT src.id AS id, src.tenant_id AS tenant_id, src.${relName} AS fk_val
         FROM ${desc.table} src
         WHERE src.${relName} IS NOT NULL${srcDeletedFilter}
           AND NOT EXISTS (
             SELECT 1 FROM ${target.table} tgt
             WHERE tgt.${targetField} = src.${relName} AND tgt.tenant_id = src.tenant_id${tgtDeletedFilter}
           )`,
      );

      for (const row of orphanRows) {
        const crossTenant = await db.get<{ tenant_id: string }>(
          `SELECT tgt.tenant_id AS tenant_id FROM ${target.table} tgt WHERE tgt.${targetField} = ?${tgtDeletedFilter} LIMIT 1`,
          [row.fk_val],
        );
        violations.push({
          kind: crossTenant && crossTenant.tenant_id !== row.tenant_id ? "cross_tenant" : "orphan",
          model: desc.name,
          table: desc.table,
          relation: relName,
          targetModel: target.name,
          targetTable: target.table,
          recordId: String(row.id),
          tenantId: String(row.tenant_id),
          ...(crossTenant && crossTenant.tenant_id !== row.tenant_id
            ? { targetTenantId: String(crossTenant.tenant_id) }
            : {}),
          value: row.fk_val,
        });
      }
    }
  }

  return { ok: violations.length === 0, violations };
}

async function reconcileMissingForeignKeys(
  executor: LibSqlExecutor,
  descriptor: RegisteredModelDescriptor,
  catalog: {
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
  },
  isPostgres: boolean,
  missingFks: MissingFkReport[],
): Promise<Array<{ table: string; column: string }>> {
  const added: Array<{ table: string; column: string }> = [];
  // SQLite doesn't support ALTER TABLE ADD CONSTRAINT for FKs
  const existingFks = catalog.foreignKeys ?? [];
  const table = descriptor.table;

  for (const fk of descriptor.foreignKeys) {
    const expectedColumns = fk.columns.sort();
    const expectedTargetTable = fk.targetTable;
    const expectedTargetColumns = fk.targetColumns.sort();
    const expectedOnDelete = fk.onDelete;

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

    let foundEquivalent = false;
    let onDeleteMismatch = false;
    let existingOnDelete: string | undefined;

    for (const existingFk of existingFks) {
      const existingColumns = existingFk.constrainedColumns.sort();
      const existingTargetTable = existingFk.referencedTable;
      const existingTargetColumns = existingFk.referencedColumns.sort();
      const existingOnDeleteCandidate = existingFk.onDelete;

      const columnsMatch = JSON.stringify(expectedColumns) === JSON.stringify(existingColumns);
      const targetTableMatch =
        expectedTargetTable.toLowerCase() === existingTargetTable.toLowerCase();
      const targetColumnsMatch =
        JSON.stringify(expectedTargetColumns) === JSON.stringify(existingTargetColumns);
      const onDeleteMatch = expectedOnDelete === existingOnDeleteCandidate;

      if (columnsMatch && targetTableMatch && targetColumnsMatch && onDeleteMatch) {
        foundEquivalent = true;
        break;
      }

      if (columnsMatch && targetTableMatch && targetColumnsMatch && !onDeleteMatch) {
        onDeleteMismatch = true;
        existingOnDelete = existingOnDeleteCandidate;
        break;
      }
    }

    if (foundEquivalent) continue;

    if (onDeleteMismatch) {
      missingFks.push({
        table,
        column: fk.columns[0]!,
        targetTable: expectedTargetTable,
        targetColumn: fk.targetColumns[0]!,
        expectedOnDelete,
        existingOnDelete: existingOnDelete ?? "RESTRICT",
        kind: "ondelete_mismatch",
        relationName,
        side: "source",
      });
      continue;
    }

    // Check for validated FK mismatch (FK exists but is not validated)
    let validatedMismatch = false;
    for (const existingFk of existingFks) {
      const existingColumns = existingFk.constrainedColumns.sort();
      const existingTargetTable = existingFk.referencedTable;
      const existingTargetColumns = existingFk.referencedColumns.sort();

      const columnsMatch = JSON.stringify(expectedColumns) === JSON.stringify(existingColumns);
      const targetTableMatch =
        expectedTargetTable.toLowerCase() === existingTargetTable.toLowerCase();
      const targetColumnsMatch =
        JSON.stringify(expectedTargetColumns) === JSON.stringify(existingTargetColumns);

      if (columnsMatch && targetTableMatch && targetColumnsMatch && !existingFk.validated) {
        validatedMismatch = true;
        break;
      }
    }

    if (validatedMismatch) {
      missingFks.push({
        table,
        column: fk.columns[0]!,
        targetTable: expectedTargetTable,
        targetColumn: fk.targetColumns[0]!,
        expectedOnDelete,
        existingOnDelete: "NOT VALIDATED",
        kind: "validated_mismatch",
        relationName,
        side: "source",
      });
      continue;
    }

    // Preflight: check for orphan/cross-tenant rows before adding constraint
    const target = modelRegistry.get(
      descriptor.relations
        ? (Object.entries(descriptor.relations).find(
            ([, v]) => v.targetField === fk.targetColumns[0],
          )?.[1]?.model ?? "")
        : "",
    );
    const targetField = fk.targetColumns[0];
    const targetTable = fk.targetTable;
    const srcDeletedFilter = descriptor.softDelete ? " AND src.status != 'deleted'" : "";
    const tgtDeletedFilter = target?.softDelete ? " AND tgt.status != 'deleted'" : "";

    const badRows = await executor.all<{ id: string; tenant_id: string; fk_val: unknown }>(
      `SELECT src.id AS id, src.tenant_id AS tenant_id, src.${fk.columns[0]} AS fk_val
       FROM ${table} src
       WHERE src.${fk.columns[0]} IS NOT NULL${srcDeletedFilter}
         AND NOT EXISTS (
           SELECT 1 FROM ${targetTable} tgt
           WHERE tgt.${targetField} = src.${fk.columns[0]} AND tgt.tenant_id = src.tenant_id${tgtDeletedFilter}
         )`,
    );

    if (badRows.length > 0) {
      missingFks.push({
        table,
        column: fk.columns[0]!,
        targetTable: expectedTargetTable,
        targetColumn: fk.targetColumns[0]!,
        expectedOnDelete,
        kind: "missing",
        relationName,
        side: "source",
      });
      continue;
    }

    if (isPostgres) {
      const constraintName = `fk_${table}_${fk.columns.join("_")}`.substring(0, 63);
      await executor.exec(
        `ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}" ` +
          `FOREIGN KEY (${fk.columns.map((c) => `"${c}"`).join(", ")}) ` +
          `REFERENCES "${expectedTargetTable}"(${expectedTargetColumns.map((c) => `"${c}"`).join(", ")}) ` +
          `ON DELETE ${expectedOnDelete}`,
      );
      added.push({ table, column: `constraint:${constraintName}` });
    } else {
      missingFks.push({
        table,
        column: fk.columns[0]!,
        targetTable: expectedTargetTable,
        targetColumn: fk.targetColumns[0]!,
        expectedOnDelete,
        kind: "missing",
        relationName,
        side: "source",
      });
    }
  }

  return added;
}

async function backfillLegacyMetadata(
  executor: LibSqlExecutor,
  table: string,
  existingCols: Set<string>,
): Promise<Array<{ table: string; column: string }>> {
  const added: Array<{ table: string; column: string }> = [];
  for (const meta of LEGACY_METADATA_COLUMN_DEFS) {
    if (!existingCols.has(meta.name)) {
      await executor.exec(`ALTER TABLE "${table}" ADD COLUMN ${meta.ddl}`);
      existingCols.add(meta.name);
      added.push({ table, column: meta.name });
    }
  }

  const nowIso = new Date().toISOString();
  const rowsNeedingId = await executor.all<{ rid: string | number }>(
    `SELECT rowid AS rid FROM "${table}" WHERE id IS NULL OR id = ''`,
  );
  for (const row of rowsNeedingId) {
    await executor.run(
      `UPDATE "${table}" SET id = ?, create_date = ?, write_date = ?, status = COALESCE(NULLIF(status, ''), 'active'), version = COALESCE(version, 1), source = COALESCE(NULLIF(source, ''), 'migration') WHERE rowid = ?`,
      [uuidv7(), nowIso, nowIso, row.rid],
    );
  }
  await executor.run(
    `UPDATE "${table}" SET create_date = ?, write_date = ? WHERE create_date IS NULL OR create_date = '' OR write_date IS NULL OR write_date = ''`,
    [nowIso, nowIso],
  );
  return added;
}

/**
 * Odoo-style zero-migration schema synchronizer (`_auto_init`):
 * creates missing tables/indexes and performs safe non-destructive `ALTER TABLE ADD COLUMN`.
 */
export async function syncModels(
  models?: Array<string | { name: string }>,
  options: SyncModelsOptions = {},
): Promise<SyncReport> {
  const db = getDb();
  const isPostgres = options.dialect === "postgres" || (db.kind ?? db.dialect) === "postgres";
  const rawDescriptors = resolveDescriptors(models);
  modelRegistry.validateRelations(rawDescriptors.map((d) => d.name));
  const descriptors = sortDescriptorsByRelationDeps(rawDescriptors);

  const report: SyncReport = {
    createdTables: [],
    addedColumns: [],
    deprecatedColumns: [],
    createdIndexes: [],
    schemaHashes: {},
    missingFks: [],
    addedFks: [],
  };

  const runSync = async (executor: LibSqlExecutor): Promise<void> => {
    await ensureAuditTable(executor);
    const seenJoinTables = new Set<string>();

    for (const descriptor of descriptors) {
      assertIdentifier(descriptor.table, "table");
      const table = descriptor.table;
      report.schemaHashes[descriptor.name] = computeModelSchemaHash(descriptor);

      const joinTablesBefore = new Set<string>();
      for (const m2m of descriptor.many2manyTables) {
        if (seenJoinTables.has(m2m.table)) continue;
        const jCat = await inspectTableCatalog(executor, m2m.table, isPostgres);
        if (jCat.columns.length === 0) {
          joinTablesBefore.add(m2m.table);
        }
      }

      const catalog = await inspectTableCatalog(executor, table, isPostgres);
      if (catalog.columns.length === 0) {
        await executor.exec(descriptor.ddl);
        report.createdTables.push(table);
        for (const idx of descriptor.indexes) {
          report.createdIndexes.push(`idx_${table}_${idx.fields.join("_")}`);
        }
        for (const m2m of descriptor.many2manyTables) {
          if (seenJoinTables.has(m2m.table)) continue;
          seenJoinTables.add(m2m.table);
          if (joinTablesBefore.has(m2m.table)) {
            report.createdTables.push(m2m.table);
            report.createdIndexes.push(`idx_${m2m.table}_unique`, `idx_${m2m.table}_target`);
          }
        }
        continue;
      }

      const existingCols = new Set<string>(catalog.columns.map((col: string) => col.toLowerCase()));

      if (options.legacyBackfill) {
        const metaAdded = await backfillLegacyMetadata(executor, table, existingCols);
        report.addedColumns.push(...metaAdded);
      } else if (!existingCols.has("tenant_id")) {
        await executor.exec(
          `ALTER TABLE "${table}" ADD COLUMN "tenant_id" TEXT NOT NULL DEFAULT 'default'`,
        );
        existingCols.add("tenant_id");
        report.addedColumns.push({ table, column: "tenant_id" });
      }

      for (const [col, spec] of descriptor.fields) {
        assertIdentifier(col, "column");
        if (METADATA_NAMES.has(col)) continue;
        if (existingCols.has(col.toLowerCase())) continue;

        if (col === "_attrs" && descriptor.extensible) {
          await executor.exec(
            `ALTER TABLE "${table}" ADD COLUMN "_attrs" TEXT NOT NULL DEFAULT '{}'`,
          );
          existingCols.add("_attrs");
          report.addedColumns.push({ table, column: "_attrs" });
          continue;
        }

        if (!spec.nullable && !spec.hasDefault) {
          throw new Error(
            `Cannot auto-sync non-nullable column '${col}' without default onto existing table '${table}' for model '${descriptor.name}'. Add .nullable() or .default(...).`,
          );
        }

        const defaultLiteral = formatSqlDefaultLiteral(spec);
        const defaultClause = defaultLiteral !== null ? ` DEFAULT ${defaultLiteral}` : "";
        const notNullClause = !spec.nullable && defaultLiteral !== null ? " NOT NULL" : "";
        await executor.exec(
          `ALTER TABLE "${table}" ADD COLUMN "${col}" ${spec.columnType}${notNullClause}${defaultClause}`,
        );
        existingCols.add(col.toLowerCase());
        report.addedColumns.push({ table, column: col });
      }

      const expectedLower = new Set(
        [...METADATA_NAMES, ...descriptor.fields.keys()].map((name) => name.toLowerCase()),
      );
      for (const colName of catalog.columns) {
        if (!expectedLower.has(colName.toLowerCase())) {
          report.deprecatedColumns.push({ table, column: colName });
        }
      }

      const existingIndexes = new Set<string>(
        catalog.indexes.map((name: string) => name.toLowerCase()),
      );
      for (const idx of descriptor.indexes) {
        const columns = idx.fields.map((f) => {
          assertIdentifier(f, "index column");
          return f;
        });
        const idxName = `idx_${table}_${columns.join("_")}`;
        assertIdentifier(idxName, "index name");
        if (!existingIndexes.has(idxName.toLowerCase())) {
          const kind = idx.unique ? "CREATE UNIQUE INDEX" : "CREATE INDEX";
          await executor.exec(
            `${kind} IF NOT EXISTS ${idxName} ON ${table} (${columns.join(", ")})`,
          );
          existingIndexes.add(idxName.toLowerCase());
          report.createdIndexes.push(idxName);
        }
      }

      // Issue #546: reconcile missing FKs on existing model tables
      const fkAdded = await reconcileMissingForeignKeys(
        executor,
        descriptor,
        catalog,
        isPostgres,
        report.missingFks,
      );
      report.addedColumns.push(...fkAdded);

      for (const m2m of descriptor.many2manyTables) {
        if (seenJoinTables.has(m2m.table)) continue;
        seenJoinTables.add(m2m.table);
        const jCat = await inspectTableCatalog(executor, m2m.table, isPostgres);
        if (jCat.columns.length === 0) {
          await executor.exec(compileMany2ManyJoinTableDdl(m2m));
          report.createdTables.push(m2m.table);
          report.createdIndexes.push(`idx_${m2m.table}_unique`, `idx_${m2m.table}_target`);
        } else {
          // Issue #547: reconcile missing FKs on existing join tables
          if (isPostgres && jCat.foreignKeys) {
            const target = modelRegistry.get(m2m.targetModel);
            if (target) {
              const sourceTargetCols =
                m2m.sourceUniqueness === "tenant_composite" ? ["tenant_id", "id"] : ["id"];
              const targetTargetCols =
                m2m.targetUniqueness === "tenant_composite"
                  ? ["tenant_id", m2m.targetField]
                  : [m2m.targetField];
              const sourceOnDelete = m2m.sourceOnDelete === "ignore" ? "NO ACTION" : "RESTRICT";
              const targetOnDelete = m2m.targetOnDelete === "ignore" ? "NO ACTION" : "RESTRICT";

              const fkSpecs = [
                {
                  columns: [m2m.sourceColumn],
                  targetTable: m2m.sourceTable,
                  targetColumns: sourceTargetCols,
                  onDelete: sourceOnDelete,
                  relationName: m2m.relationName,
                  side: "source" as const,
                },
                {
                  columns: [m2m.targetColumn],
                  targetTable: m2m.targetTable,
                  targetColumns: targetTargetCols,
                  onDelete: targetOnDelete,
                  relationName: m2m.relationName,
                  side: "target" as const,
                },
              ];

              for (const fkSpec of fkSpecs) {
                const expectedColumns = fkSpec.columns.sort();
                const expectedTargetTable = fkSpec.targetTable;
                const expectedTargetColumns = fkSpec.targetColumns.sort();
                const expectedOnDelete = fkSpec.onDelete;

                let foundEquivalent = false;
                for (const existingFk of jCat.foreignKeys) {
                  const existingColumns = existingFk.constrainedColumns.sort();
                  const existingTargetTable = existingFk.referencedTable;
                  const existingTargetColumns = existingFk.referencedColumns.sort();
                  const existingOnDelete = existingFk.onDelete;

                  const columnsMatch =
                    JSON.stringify(expectedColumns) === JSON.stringify(existingColumns);
                  const targetTableMatch =
                    expectedTargetTable.toLowerCase() === existingTargetTable.toLowerCase();
                  const targetColumnsMatch =
                    JSON.stringify(expectedTargetColumns) === JSON.stringify(existingTargetColumns);
                  const onDeleteMatch = expectedOnDelete === existingOnDelete;

                  if (columnsMatch && targetTableMatch && targetColumnsMatch && onDeleteMatch) {
                    foundEquivalent = true;
                    break;
                  }
                }

                if (foundEquivalent) continue;

                // Preflight: check for orphan/cross-tenant rows before adding constraint
                const badJoinRows = await executor.all<{
                  id: string;
                  tenant_id: string;
                  source_val: unknown;
                  target_val: unknown;
                }>(
                  `SELECT j.id AS id, j.tenant_id AS tenant_id, j."${m2m.sourceColumn}" AS source_val, j."${m2m.targetColumn}" AS target_val
                   FROM ${m2m.table} j
                   WHERE ${fkSpec.side === "source" ? `NOT EXISTS (SELECT 1 FROM ${m2m.sourceTable} src WHERE src.id = j."${m2m.sourceColumn}" AND src.tenant_id = j.tenant_id)` : `NOT EXISTS (SELECT 1 FROM ${m2m.targetTable} tgt WHERE tgt.${m2m.targetField} = j."${m2m.targetColumn}" AND tgt.tenant_id = j.tenant_id)`}`,
                );

                if (badJoinRows.length > 0) {
                  report.missingFks.push({
                    table: m2m.table,
                    column: fkSpec.columns[0]!,
                    targetTable: expectedTargetTable,
                    targetColumn: expectedTargetColumns[0]!,
                    expectedOnDelete,
                    kind: "missing",
                    relationName: m2m.relationName,
                    side: fkSpec.side,
                  });
                  continue;
                }

                const constraintName = `fk_${m2m.table}_${fkSpec.side}`.substring(0, 63);
                await executor.exec(
                  `ALTER TABLE "${m2m.table}" ADD CONSTRAINT "${constraintName}" ` +
                    `FOREIGN KEY ("${fkSpec.columns.join('", "')}") ` +
                    `REFERENCES "${expectedTargetTable}"(${expectedTargetColumns.map((c) => `"${c}"`).join(", ")}) ` +
                    `ON DELETE ${expectedOnDelete}`,
                );
                report.createdIndexes.push(`constraint:${constraintName}`);
                report.addedFks.push(constraintName);
              }
            }
          }

          const jIndexes = new Set<string>(jCat.indexes.map((n: string) => n.toLowerCase()));
          const uIdx = `idx_${m2m.table}_unique`;
          const tIdx = `idx_${m2m.table}_target`;
          if (!jIndexes.has(uIdx.toLowerCase())) {
            await executor.exec(
              `CREATE UNIQUE INDEX IF NOT EXISTS ${uIdx} ON ${m2m.table} (tenant_id, ${m2m.sourceColumn}, ${m2m.targetColumn})`,
            );
            report.createdIndexes.push(uIdx);
          }
          if (!jIndexes.has(tIdx.toLowerCase())) {
            await executor.exec(
              `CREATE INDEX IF NOT EXISTS ${tIdx} ON ${m2m.table} (tenant_id, ${m2m.targetColumn})`,
            );
            report.createdIndexes.push(tIdx);
          }
        }
      }
    }
  };

  if (isPostgres) {
    await db.transaction(async (tx) => {
      await tx.all(`SELECT pg_advisory_xact_lock(${PG_SYNC_ADVISORY_LOCK_KEY})`);
      await runSync(tx);
    });
  } else {
    await runSync(db);
  }

  return report;
}
