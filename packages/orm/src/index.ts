export {
  defineModel,
  uuidv7,
  BaseRepository,
  ScopedRepository,
  matchesFilter,
  AUDIT_DDL,
  OUTBOX_DDL,
  ormAuditMigrations,
  ensureAuditTable,
  ensureOutboxTable,
} from "./define-model.js";
export type {
  DefineModelOptions,
  DefineModelReturn,
  AuditAction,
  AuditEntry,
  ModelRecord,
  QueryFilterOperators,
  FindOptions,
  FindPageOptions,
  PageResult,
  SortSpec,
  PageCursor,
  WriteGuardOptions,
} from "./define-model.js";
export { modelRegistry, extendModel, onModelWrite } from "./registry.js";
export type {
  ModelExtensionDef,
  ExtendModelOptions,
  RegisteredModelDescriptor,
  ModelWriteEvent,
  ModelWriteHandler,
  ModelHookError,
} from "./registry.js";
export type {
  ModelIndex,
  FieldSpec,
  ForeignKeySpec,
  Many2ManyJoinTableSpec,
  RuntimeCustomFieldSpec,
  ValidateAttrsOptions,
  ZodObjectLike,
} from "./schema-utils.js";
export { validateAttrsPayload } from "./schema-utils.js";
export { syncModels, preflightRelationIntegrity } from "./sync.js";
export type { SyncModelsOptions, SyncReport, RelationIntegrityViolation } from "./sync.js";
export type { BaseMetadata, RecordStatus, RecordSource } from "./base-metadata.js";
export {
  createActorContext,
  DEFAULT_TENANT_ID,
  isSystemActor,
  normalizeTenantId,
  requireActorTenantId,
  SYSTEM_ACTOR,
} from "./actor-context.js";
export type { ActorContext, ActorSource } from "./actor-context.js";
export { ConflictError, PolicyError, type PolicyErrorCode } from "./errors.js";
export {
  initDb,
  initD1Db,
  initPostgresDb,
  closeDb,
  getDb,
  withQueryBudget,
  runWithTransactionExecutor,
  getTransactionExecutor,
  isInTransaction,
} from "./driver.js";
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
  verifyBackupIntegrity,
  listDatabaseTables,
  encryptBackupFile,
  decryptBackupFile,
} from "./backup.js";
export type { BackupCommandOptions, ExternalCommandRunner } from "./backup.js";

export {
  compileTupleDomainToFilter,
  normalizeComputedFieldDef,
  MAX_DOMAIN_CLAUSES,
  MAX_DOMAIN_DEPTH,
  MAX_IN_LIST_SIZE,
  MAX_STRING_VALUE_LEN,
} from "./model-meta.js";
export type {
  ConstrainContext,
  FieldPolicySpec,
  ModelActionContext,
  ModelActionDef,
  ModelComputedFieldDef,
  ModelComputedFieldFn,
  ModelComputedFieldSpec,
  ModelComputedFields,
  ModelConstraint,
  ModelDefaults,
  ModelFeatureOptions,
  ModelHookContext,
  ModelLifecycleHooks,
  ModelRelation,
  ModelRetention,
  ModelRole,
  ModelWriteAction,
  StoredComputedFieldType,
} from "./model-meta.js";
