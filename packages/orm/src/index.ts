export {
  defineModel,
  uuidv7,
  BaseRepository,
  AUDIT_DDL,
  ormAuditMigrations,
  ensureAuditTable,
} from "./define-model.js";
export type {
  DefineModelOptions,
  DefineModelReturn,
  AuditAction,
  AuditEntry,
  ModelRecord,
  QueryFilterOperators,
  FindOptions,
} from "./define-model.js";
export { modelRegistry, extendModel, onModelWrite } from "./registry.js";
export type {
  ModelExtensionDef,
  ExtendModelOptions,
  RegisteredModelDescriptor,
  ModelWriteEvent,
  ModelWriteHandler,
} from "./registry.js";
export type {
  ModelIndex,
  FieldSpec,
  RuntimeCustomFieldSpec,
  ZodObjectLike,
} from "./schema-utils.js";
export { syncModels } from "./sync.js";
export type { SyncModelsOptions, SyncReport } from "./sync.js";
export type { BaseMetadata, RecordStatus, RecordSource } from "./base-metadata.js";
export {
  createActorContext,
  DEFAULT_TENANT_ID,
  normalizeTenantId,
  SYSTEM_ACTOR,
} from "./actor-context.js";
export type { ActorContext, ActorSource } from "./actor-context.js";
export { ConflictError } from "./errors.js";
export { initDb, initD1Db, initPostgresDb, closeDb, getDb } from "./driver.js";
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
  listDatabaseTables,
  encryptBackupFile,
  decryptBackupFile,
} from "./backup.js";
export type { BackupCommandOptions, ExternalCommandRunner } from "./backup.js";

export type {
  ConstrainContext,
  ModelActionContext,
  ModelActionDef,
  ModelConstraint,
  ModelDefaults,
  ModelFeatureOptions,
  ModelRelation,
  ModelRetention,
  ModelRole,
  ModelWriteAction,
} from "./model-meta.js";
