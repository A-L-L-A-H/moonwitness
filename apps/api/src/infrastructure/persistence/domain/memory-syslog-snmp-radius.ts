import type { Migration } from "@moonwitness/orm";

export { memoryRecordModel, memoryRecordSchema } from "@moonwitness/addon-ai";
export { syslogEntryModel, syslogEntrySchema } from "@moonwitness/addon-syslog";
export {
  snmpDeviceModel,
  snmpDeviceSchema,
  snmpTargetModel,
  snmpTargetSchema,
  snmpSampleModel,
  snmpSampleSchema,
} from "@moonwitness/addon-snmp";
export {
  radiusClientModel,
  radiusClientSchema,
  radiusSessionModel,
  radiusSessionSchema,
} from "@moonwitness/addon-radius";

/** Retired: all telemetry/storage/AAA models are auto-synced by their domain addons. */
export const memoryMigrations: Migration[] = [];
export const syslogMigrations: Migration[] = [];
export const snmpMigrations: Migration[] = [];
export const radiusMigrations: Migration[] = [];
