import type { Migration } from "@moonwitness/orm";
import { auditLogMigrations } from "../../audit/audit-log";
import { commandCenterMigrations } from "../../../interface/routes/command-center.persistence";
import { probesMigrations } from "../../../interface/routes/probes.persistence";
import { riotAiMigrations } from "../../../interface/routes/riot-ai.persistence";

export * from "./identity";
export * from "./storage";
export * from "./ops-events";
export * from "./probes";
export * from "./command-control";
export * from "./memory-syslog-snmp-radius";

/** All API domain migrations in deterministic order. Single source for runtime startup. */
export const domainMigrations: Migration[] = [
  ...commandCenterMigrations,
  ...probesMigrations,
  ...riotAiMigrations,
  ...auditLogMigrations,
];
