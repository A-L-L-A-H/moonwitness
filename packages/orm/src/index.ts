export { defineModel, uuidv7, BaseRepository } from "./define-model.js";
export type {
  DefineModelOptions,
  DefineModelReturn,
  AuditAction,
  AuditEntry,
  ModelRecord,
} from "./define-model.js";
export type { BaseMetadata, RecordStatus, RecordSource } from "./base-metadata.js";
export { createActorContext, SYSTEM_ACTOR } from "./actor-context.js";
export type { ActorContext, ActorSource } from "./actor-context.js";
export { ConflictError } from "./errors.js";
export { initDb, initD1Db, closeDb, getDb } from "./driver.js";
export type { OrmDriverHandle } from "./driver.js";
export { LibSqlDriver } from "./drivers/sqlite.driver.js";
export type { LibSqlExecutor } from "./drivers/sqlite.driver.js";
export {
  PostgresDriver,
  isPostgresUrl,
  translateSqlForPostgres,
} from "./drivers/postgres.driver.js";
export type { PgClientLike, PgQueryResultLike, PoolLike } from "./drivers/postgres.driver.js";
export { D1Driver, splitSqlStatements, createD1DatabaseFromOrm } from "./drivers/d1.driver.js";
export type { D1DatabaseLike, D1PreparedStatementLike } from "./drivers/d1.driver.js";
export { applyMigrations, listAppliedMigrations } from "./migrations.js";
export type { Migration } from "./migrations.js";
export {
  backupDatabase,
  restoreDatabase,
  verifyIntegrity,
  encryptBackupFile,
  decryptBackupFile,
} from "./backup.js";
