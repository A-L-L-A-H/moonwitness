import type { Migration } from "@moonwitness/orm";
import { authMigrations } from "../../../db/migrations";
import { auditLogMigrations } from "../../audit/audit-log";
import { commandCenterMigrations } from "../../../interface/routes/command-center.persistence";
import { probesMigrations } from "../../../interface/routes/probes.persistence";
import { riotAiMigrations } from "../../../interface/routes/riot-ai.persistence";
import { identityMigrations } from "./identity";
import { storageMigrations } from "./storage";
import { opsEventMigrations } from "./ops-events";
import { probeOrmMigrations } from "./probes";
import { commandControlMigrations } from "./command-control";
import {
  memoryMigrations,
  syslogMigrations,
  snmpMigrations,
  radiusMigrations,
} from "./memory-syslog-snmp-radius";

export * from "./identity";
export * from "./storage";
export * from "./ops-events";
export * from "./probes";
export * from "./command-control";
export * from "./memory-syslog-snmp-radius";

/** All API domain migrations in deterministic order. Single source for runtime startup. */
export const domainMigrations: Migration[] = [
  ...authMigrations,
  ...commandCenterMigrations,
  ...probesMigrations,
  ...riotAiMigrations,
  ...auditLogMigrations,
  ...identityMigrations,
  ...storageMigrations,
  ...opsEventMigrations,
  ...probeOrmMigrations,
  ...commandControlMigrations,
  ...memoryMigrations,
  ...syslogMigrations,
  ...snmpMigrations,
  ...radiusMigrations,
];
