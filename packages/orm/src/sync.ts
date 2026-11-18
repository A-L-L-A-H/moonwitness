import { createHash } from "node:crypto";
import { getDb } from "./driver.js";
import { ensureAuditTable, uuidv7 } from "./define-model.js";
import { modelRegistry, type RegisteredModelDescriptor } from "./registry.js";
import { assertIdentifier, formatSqlDefaultLiteral, METADATA_NAMES } from "./schema-utils.js";

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
}

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

async function backfillLegacyMetadata(
  table: string,
  existingCols: Set<string>,
): Promise<Array<{ table: string; column: string }>> {
  const db = getDb();
  const added: Array<{ table: string; column: string }> = [];
  for (const meta of LEGACY_METADATA_COLUMN_DEFS) {
    if (!existingCols.has(meta.name)) {
      await db.exec(`ALTER TABLE "${table}" ADD COLUMN ${meta.ddl}`);
      existingCols.add(meta.name);
      added.push({ table, column: meta.name });
    }
  }

  const nowIso = new Date().toISOString();
  const rowsNeedingId = await db.all<{ rid: string | number }>(
    `SELECT rowid AS rid FROM "${table}" WHERE id IS NULL OR id = ''`,
  );
  for (const row of rowsNeedingId) {
    await db.run(
      `UPDATE "${table}" SET id = ?, create_date = ?, write_date = ?, status = COALESCE(NULLIF(status, ''), 'active'), version = COALESCE(version, 1), source = COALESCE(NULLIF(source, ''), 'migration') WHERE rowid = ?`,
      [uuidv7(), nowIso, nowIso, row.rid],
    );
  }
  await db.run(
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
  await ensureAuditTable();
  const db = getDb();
  const descriptors = resolveDescriptors(models);

  const report: SyncReport = {
    createdTables: [],
    addedColumns: [],
    deprecatedColumns: [],
    createdIndexes: [],
    schemaHashes: {},
  };

  for (const descriptor of descriptors) {
    assertIdentifier(descriptor.table, "table");
    const table = descriptor.table;
    report.schemaHashes[descriptor.name] = computeModelSchemaHash(descriptor);

    const existingColRows = await db.all<{ name: string }>(`PRAGMA table_info(${table})`);
    if (existingColRows.length === 0) {
      await db.exec(descriptor.ddl);
      report.createdTables.push(table);
      for (const idx of descriptor.indexes) {
        report.createdIndexes.push(`idx_${table}_${idx.fields.join("_")}`);
      }
      continue;
    }

    const existingCols = new Set(existingColRows.map((row) => String(row.name).toLowerCase()));

    if (options.legacyBackfill) {
      const metaAdded = await backfillLegacyMetadata(table, existingCols);
      report.addedColumns.push(...metaAdded);
    }

    for (const [col, spec] of descriptor.fields) {
      assertIdentifier(col, "column");
      if (METADATA_NAMES.has(col)) continue;
      if (existingCols.has(col.toLowerCase())) continue;

      if (col === "_attrs" && descriptor.extensible) {
        await db.exec(`ALTER TABLE "${table}" ADD COLUMN "_attrs" TEXT NOT NULL DEFAULT '{}'`);
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
      await db.exec(
        `ALTER TABLE "${table}" ADD COLUMN "${col}" ${spec.columnType}${notNullClause}${defaultClause}`,
      );
      existingCols.add(col.toLowerCase());
      report.addedColumns.push({ table, column: col });
    }

    const expectedLower = new Set(
      [...METADATA_NAMES, ...descriptor.fields.keys()].map((name) => name.toLowerCase()),
    );
    for (const existingRow of existingColRows) {
      const colName = String(existingRow.name);
      if (!expectedLower.has(colName.toLowerCase())) {
        report.deprecatedColumns.push({ table, column: colName });
      }
    }

    const existingIndexRows = await db.all<{ name: string }>(`PRAGMA index_list(${table})`);
    const existingIndexes = new Set(existingIndexRows.map((row) => String(row.name).toLowerCase()));
    for (const idx of descriptor.indexes) {
      const columns = idx.fields.map((f) => {
        assertIdentifier(f, "index column");
        return f;
      });
      const idxName = `idx_${table}_${columns.join("_")}`;
      assertIdentifier(idxName, "index name");
      if (!existingIndexes.has(idxName.toLowerCase())) {
        const kind = idx.unique ? "CREATE UNIQUE INDEX" : "CREATE INDEX";
        await db.exec(`${kind} IF NOT EXISTS ${idxName} ON ${table} (${columns.join(", ")})`);
        existingIndexes.add(idxName.toLowerCase());
        report.createdIndexes.push(idxName);
      }
    }
  }

  return report;
}
