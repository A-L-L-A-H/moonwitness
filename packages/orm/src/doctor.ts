import { getDb } from "./driver.js";
import type { LibSqlExecutor } from "./drivers/sqlite.driver.js";
import { modelRegistry, type RegisteredModelDescriptor } from "./registry.js";
import { assertIdentifier } from "./schema-utils.js";
import type { SyncModelsOptions, SyncReport, MissingFkReport } from "./sync.js";
import { inspectTableCatalog } from "./sync.js";

export interface DoctorOptions {
  models?: Array<string | { name: string }>;
  dialect?: "sqlite" | "postgres";
  format?: "json" | "table";
  exitOnError?: boolean;
}

export interface DoctorResult {
  ok: boolean;
  report: SyncReport;
  missingFks: MissingFkReport[];
  deprecatedColumns: Array<{ table: string; column: string }>;
  schemaDrift: Array<{ model: string; expectedHash: string; actualHash: string }>;
}

async function doctorModels(
  models: Array<string | { name: string }> | undefined,
  options: DoctorOptions = {},
): Promise<DoctorResult> {
  const db = getDb();
  const isPostgres = options.dialect === "postgres" || (db.kind ?? db.dialect) === "postgres";
  const rawDescriptors = resolveDescriptors(models);
  const descriptors = sortDescriptorsByRelationDeps(rawDescriptors);

  const missingFks: MissingFkReport[] = [];
  const deprecatedColumns: Array<{ table: string; column: string }> = [];
  const schemaDrift: Array<{ model: string; expectedHash: string; actualHash: string }> = [];

  for (const descriptor of descriptors) {
    assertIdentifier(descriptor.table, "table");
    const table = descriptor.table;

    const catalog = await inspectTableCatalog(db, table, isPostgres);
    if (catalog.columns.length === 0) {
      // Table doesn't exist - this is not an error for doctor
      continue;
    }

    const expectedHash = computeModelSchemaHash(descriptor);
    const actualHash = computeActualSchemaHash(catalog, descriptor);
    if (expectedHash !== actualHash) {
      schemaDrift.push({ model: descriptor.name, expectedHash, actualHash });
    }

    const existingCols = new Set(catalog.columns.map((col) => col.toLowerCase()));
    const expectedLower = new Set(
      [...(descriptor as any).fields.keys()].map((name) => name.toLowerCase()),
    );
    for (const colName of catalog.columns) {
      if (!expectedLower.has(colName.toLowerCase())) {
        deprecatedColumns.push({ table, column: colName });
      }
    }

    if (isPostgres && catalog.foreignKeys) {
      // Check model table FKs
      for (const fk of descriptor.foreignKeys) {
        const expectedColumns = fk.columns.sort();
        const expectedTargetTable = fk.targetTable;
        const expectedTargetColumns = fk.targetColumns.sort();
        const expectedOnDelete = fk.onDelete;

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
        let validatedMismatch = false;

        for (const existingFk of catalog.foreignKeys) {
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

          if (columnsMatch && targetTableMatch && targetColumnsMatch && !existingFk.validated) {
            validatedMismatch = true;
          }
        }

        if (!foundEquivalent) {
          if (onDeleteMismatch) {
            missingFks.push({
              table,
              column: fk.columns[0],
              targetTable: expectedTargetTable,
              targetColumn: fk.targetColumns[0],
              expectedOnDelete,
              existingOnDelete,
              kind: "ondelete_mismatch",
              relationName,
              side: "source",
            });
          } else if (validatedMismatch) {
            missingFks.push({
              table,
              column: fk.columns[0],
              targetTable: expectedTargetTable,
              targetColumn: fk.targetColumns[0],
              expectedOnDelete,
              existingOnDelete: "NOT VALIDATED",
              kind: "validated_mismatch",
              relationName,
              side: "source",
            });
          } else {
            // Check for orphan rows
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

            const badRows = await db.all<{ id: string; tenant_id: string; fk_val: unknown }>(
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
                column: fk.columns[0],
                targetTable: expectedTargetTable,
                targetColumn: fk.targetColumns[0],
                expectedOnDelete,
                kind: "missing",
                relationName,
                side: "source",
              });
            }
          }
        }
      }

      // Check join table FKs
      for (const m2m of descriptor.many2manyTables) {
        const jCat = await inspectTableCatalog(db, m2m.table, isPostgres);
        if (jCat.columns.length === 0 || !jCat.foreignKeys) continue;

        const target = modelRegistry.get(m2m.targetModel);
        if (!target) continue;

        const fkSpecs = [
          {
            columns: [m2m.sourceColumn],
            targetTable: m2m.sourceTable,
            targetColumns: ["tenant_id", "id"],
            onDelete: m2m.sourceOnDelete,
            relationName: m2m.relationName,
            side: "source" as const,
          },
          {
            columns: [m2m.targetColumn],
            targetTable: m2m.targetTable,
            targetColumns: ["tenant_id", m2m.targetField],
            onDelete: m2m.targetOnDelete,
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
          let onDeleteMismatch = false;
          let existingOnDelete: string | undefined;
          let validatedMismatch = false;

          for (const existingFk of jCat.foreignKeys) {
            const existingColumns = existingFk.constrainedColumns.sort();
            const existingTargetTable = existingFk.referencedTable;
            const existingTargetColumns = existingFk.referencedColumns.sort();
            const existingOnDeleteCandidate = existingFk.onDelete;

            const columnsMatch =
              JSON.stringify(expectedColumns) === JSON.stringify(existingColumns);
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

            if (columnsMatch && targetTableMatch && targetColumnsMatch && !existingFk.validated) {
              validatedMismatch = true;
            }
          }

          if (!foundEquivalent) {
            if (onDeleteMismatch) {
              missingFks.push({
                table: m2m.table,
                column: fkSpec.columns[0],
                targetTable: expectedTargetTable,
                targetColumn: expectedTargetColumns[0],
                expectedOnDelete,
                existingOnDelete,
                kind: "ondelete_mismatch",
                relationName: fkSpec.relationName,
                side: fkSpec.side,
              });
            } else if (validatedMismatch) {
              missingFks.push({
                table: m2m.table,
                column: fkSpec.columns[0],
                targetTable: expectedTargetTable,
                targetColumn: expectedTargetColumns[0],
                expectedOnDelete,
                existingOnDelete: "NOT VALIDATED",
                kind: "validated_mismatch",
                relationName: fkSpec.relationName,
                side: fkSpec.side,
              });
            } else {
              // Check for orphan rows
              const badJoinRows = await db.all<{
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
                missingFks.push({
                  table: m2m.table,
                  column: fkSpec.columns[0],
                  targetTable: expectedTargetTable,
                  targetColumn: expectedTargetColumns[0],
                  expectedOnDelete,
                  kind: "missing",
                  relationName: fkSpec.relationName,
                  side: fkSpec.side,
                });
              }
            }
          }
        }
      }
    }
  }

  // Build a basic sync report for compatibility
  const report: SyncReport = {
    createdTables: [],
    addedColumns: [],
    deprecatedColumns,
    createdIndexes: [],
    schemaHashes: {},
    missingFks,
  };

  const hasErrors = missingFks.some((fk) => fk.kind === "ondelete_mismatch" || fk.kind === "validated_mismatch");
  const hasWarnings = missingFks.some((fk) => fk.kind === "missing") || deprecatedColumns.length > 0 || schemaDrift.length > 0;

  return {
    ok: missingFks.length === 0 && deprecatedColumns.length === 0 && schemaDrift.length === 0,
    report,
    missingFks,
    deprecatedColumns,
    schemaDrift,
  };
}

function computeActualSchemaHash(
  catalog: { columns: string[]; indexes: string[] },
  descriptor: RegisteredModelDescriptor,
): string {
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
    existingColumns: catalog.columns.sort(),
    existingIndexes: catalog.indexes.sort(),
  };
  const crypto = require("node:crypto");
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
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
      throw new Error(`Cannot inspect unknown model '${name}'. Call defineModel() first.`);
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

function computeModelSchemaHash(descriptor: RegisteredModelDescriptor): string {
  const crypto = require("node:crypto");
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
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function formatTableOutput(result: DoctorResult): string {
  const lines: string[] = [];
  lines.push("╔══════════════════════════════════════════════════════════════╗");
  lines.push("║                    ORM Doctor Report                          ║");
  lines.push("╠══════════════════════════════════════════════════════════════╣");
  lines.push(`║ Status: ${result.ok ? "✓ CLEAN" : "✗ ISSUES FOUND".padEnd(44)} ║`);
  lines.push("╠══════════════════════════════════════════════════════════════╣");

  if (result.missingFks.length > 0) {
    lines.push("║ MISSING / DRIFTING FOREIGN KEYS                               ║");
    lines.push("╠══════════════════════════════════════════════════════════════╣");
    for (const fk of result.missingFks) {
      const kindIcon = fk.kind === "missing" ? "⚠" : fk.kind === "ondelete_mismatch" ? "✗" : "!";
      lines.push(`║ ${kindIcon} [${fk.kind.toUpperCase()}] ${fk.table}.${fk.column} -> ${fk.targetTable}.${fk.targetColumn}`);
      lines.push(`║    Expected ON DELETE: ${fk.expectedOnDelete}`);
      if (fk.existingOnDelete) lines.push(`║    Existing ON DELETE: ${fk.existingOnDelete}`);
      if (fk.relationName) lines.push(`║    Relation: ${fk.relationName} (${fk.side})`);
      lines.push("║──────────────────────────────────────────────────────────────║");
    }
  }

  if (result.deprecatedColumns.length > 0) {
    lines.push("║ DEPRECATED COLUMNS (not in model schema)                      ║");
    lines.push("╠══════════════════════════════════════════════════════════════╣");
    for (const col of result.deprecatedColumns) {
      lines.push(`║ ⚠ ${col.table}.${col.column}`);
    }
    lines.push("║──────────────────────────────────────────────────────────────║");
  }

  if (result.schemaDrift.length > 0) {
    lines.push("║ SCHEMA DRIFT (hash mismatch)                                  ║");
    lines.push("╠══════════════════════════════════════════════════════════════╣");
    for (const drift of result.schemaDrift) {
      lines.push(`║ ! ${drift.model}: expected ${drift.expectedHash.slice(0, 16)}... != actual ${drift.actualHash.slice(0, 16)}...`);
    }
    lines.push("║──────────────────────────────────────────────────────────────║");
  }

  if (result.ok) {
    lines.push("║ No issues detected. Schema is in sync with models.            ║");
  }

  lines.push("╚══════════════════════════════════════════════════════════════╝");
  return lines.join("\n");
}

export async function doctorCli(args: string[] = process.argv.slice(2)): Promise<void> {
  const format = args.includes("--json") ? "json" : "table";
  const modelsArg = args.find((a) => a.startsWith("--model="));
  const models = modelsArg ? modelsArg.split("=")[1].split(",") : undefined;
  const dialectArg = args.find((a) => a.startsWith("--dialect="));
  const dialect = dialectArg ? (dialectArg.split("=")[1] as "sqlite" | "postgres") : undefined;
  const exitOnError = args.includes("--exit-on-error");

  try {
    const result = await doctorModels(models, { format, dialect, exitOnError });

    if (format === "json") {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatTableOutput(result));
    }

    if (exitOnError && !result.ok) {
      const hasErrors = result.missingFks.some((fk) => fk.kind === "ondelete_mismatch" || fk.kind === "validated_mismatch");
      process.exit(hasErrors ? 2 : 1);
    }

    process.exit(result.ok ? 0 : (result.missingFks.some((fk) => fk.kind === "ondelete_mismatch" || fk.kind === "validated_mismatch") ? 2 : 1));
  } catch (err) {
    console.error("Doctor failed:", err);
    process.exit(1);
  }
}

export { doctorModels };
export type { DoctorOptions, DoctorResult };