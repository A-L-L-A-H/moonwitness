import type { Migration } from "@moonwitness/orm";

export {
  auditLogModel,
  auditLogSchema,
  recordAuditLog,
  tryRecordAuditLog,
  auditActionFromOrm,
  listAuditLogs,
  type RecordAuditInput,
  type ListAuditLogsOptions,
  type AuditLogRecord,
} from "@moonwitness/addons/audit";

/** Retired: ops_audit_logs is auto-synced by @moonwitness/addon-audit. */
export const auditLogMigrations: Migration[] = [];
