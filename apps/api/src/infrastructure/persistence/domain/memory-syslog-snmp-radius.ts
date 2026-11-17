import { z } from "zod";
import { defineModel, type Migration } from "@moonwitness/orm";

export const memoryRecordSchema = z.object({
  record_key: z.string().min(1).max(200),
  owner_id: z.string().max(200).nullable(),
  scope: z.string().min(1).max(80).default("global"),
  kind: z.string().min(1).max(80),
  title: z.string().min(1).max(300),
  summary: z.string().max(4000).nullable(),
  content: z.string().nullable(),
  tags_json: z.string().nullable(),
  metadata_json: z.string().nullable(),
  retention_days: z.number().int().positive().nullable(),
  expires_at: z.string().datetime().nullable(),
});

export const memoryRecordModel = defineModel({
  name: "memory.record",
  table: "memory_records",
  schema: memoryRecordSchema,
  indexes: [
    { fields: ["record_key"], unique: true },
    { fields: ["owner_id", "scope"] },
    { fields: ["kind"] },
    { fields: ["expires_at"] },
  ],
});

export const syslogEntrySchema = z.object({
  source_host: z.string().max(255).nullable(),
  app_name: z.string().max(120).nullable(),
  facility: z.string().max(40).nullable(),
  severity: z.string().max(40).nullable(),
  message: z.string().min(1),
  received_at: z.string().datetime(),
  raw_json: z.string().nullable(),
  retention_days: z.number().int().positive().nullable(),
});

export const syslogEntryModel = defineModel({
  name: "syslog.entry",
  table: "syslog_entries",
  schema: syslogEntrySchema,
  softDelete: false,
  indexes: [{ fields: ["received_at"] }, { fields: ["source_host"] }, { fields: ["severity"] }],
});

export const snmpDeviceSchema = z.object({
  device_key: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  host: z.string().min(1).max(255),
  port: z.number().int().positive().default(161),
  version: z.string().max(20).nullable(),
  enabled: z.boolean().default(true),
  metadata_json: z.string().nullable(),
});

export const snmpTargetSchema = z.object({
  target_key: z.string().min(1).max(120),
  device_key: z.string().min(1).max(120),
  oid: z.string().min(1).max(500),
  name: z.string().max(200).nullable(),
  poll_interval_sec: z.number().int().positive().nullable(),
  enabled: z.boolean().default(true),
  metadata_json: z.string().nullable(),
});

export const snmpSampleSchema = z.object({
  target_key: z.string().min(1).max(120),
  device_key: z.string().min(1).max(120),
  value_text: z.string().nullable(),
  value_num: z.number().nullable(),
  unit: z.string().max(40).nullable(),
  sampled_at: z.string().datetime(),
  ok: z.boolean().default(true),
  error_message: z.string().max(1000).nullable(),
});

export const snmpDeviceModel = defineModel({
  name: "snmp.device",
  table: "snmp_devices",
  schema: snmpDeviceSchema,
  indexes: [
    { fields: ["device_key"], unique: true },
    { fields: ["host"] },
    { fields: ["enabled"] },
  ],
});

export const snmpTargetModel = defineModel({
  name: "snmp.target",
  table: "snmp_targets",
  schema: snmpTargetSchema,
  indexes: [
    { fields: ["target_key"], unique: true },
    { fields: ["device_key"] },
    { fields: ["enabled"] },
  ],
});

export const snmpSampleModel = defineModel({
  name: "snmp.sample",
  table: "snmp_samples",
  schema: snmpSampleSchema,
  softDelete: false,
  indexes: [
    { fields: ["target_key", "sampled_at"] },
    { fields: ["device_key", "sampled_at"] },
    { fields: ["sampled_at"] },
  ],
});

export const radiusClientSchema = z.object({
  client_key: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  address: z.string().max(255).nullable(),
  secret_hint: z.string().max(255).nullable(),
  enabled: z.boolean().default(true),
  metadata_json: z.string().nullable(),
});

export const radiusSessionSchema = z.object({
  session_key: z.string().min(1).max(200),
  username: z.string().max(120).nullable(),
  client_key: z.string().max(120).nullable(),
  nas_ip: z.string().max(128).nullable(),
  framed_ip: z.string().max(128).nullable(),
  started_at: z.string().datetime().nullable(),
  ended_at: z.string().datetime().nullable(),
  acct_status: z.string().max(40).nullable(),
  bytes_in: z.number().int().nonnegative().nullable(),
  bytes_out: z.number().int().nonnegative().nullable(),
  metadata_json: z.string().nullable(),
});

export const radiusClientModel = defineModel({
  name: "radius.client",
  table: "radius_clients",
  schema: radiusClientSchema,
  indexes: [
    { fields: ["client_key"], unique: true },
    { fields: ["name"] },
    { fields: ["enabled"] },
  ],
});

export const radiusSessionModel = defineModel({
  name: "radius.session",
  table: "radius_sessions",
  schema: radiusSessionSchema,
  softDelete: false,
  indexes: [
    { fields: ["session_key"], unique: true },
    { fields: ["username"] },
    { fields: ["client_key"] },
    { fields: ["started_at"] },
  ],
});

export const memoryMigrations: Migration[] = [
  { id: "070_create_memory_records", up: memoryRecordModel.ddl },
];
export const syslogMigrations: Migration[] = [
  { id: "071_create_syslog_entries", up: syslogEntryModel.ddl },
];
export const snmpMigrations: Migration[] = [
  { id: "072_create_snmp_devices", up: snmpDeviceModel.ddl },
  { id: "073_create_snmp_targets", up: snmpTargetModel.ddl },
  { id: "074_create_snmp_samples", up: snmpSampleModel.ddl },
];
export const radiusMigrations: Migration[] = [
  { id: "075_create_radius_clients", up: radiusClientModel.ddl },
  { id: "076_create_radius_sessions", up: radiusSessionModel.ddl },
];
