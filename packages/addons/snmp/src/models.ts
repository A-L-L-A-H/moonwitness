import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const snmpDeviceSchema = z.object({
  device_key: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  host: z.string().min(1).max(255),
  port: z.number().int().min(1).max(65535).default(161),
  snmp_version: z.enum(["v1", "v2c", "v3"]).default("v2c"),
  community_hint: z.string().max(128).nullable().default(null),
  enabled: z.boolean().default(true),
  metadata_json: z.string().nullable().default(null),
});

export const snmpTargetSchema = z.object({
  target_key: z.string().min(1).max(120),
  device_key: z.string().min(1).max(120),
  oid: z.string().min(1).max(200),
  label: z.string().min(1).max(200),
  interval_sec: z.number().int().positive().default(60),
  enabled: z.boolean().default(true),
});

export const snmpSampleSchema = z.object({
  target_key: z.string().min(1).max(120),
  device_key: z.string().min(1).max(120),
  value_text: z.string().nullable().default(null),
  value_num: z.number().nullable().default(null),
  unit: z.string().max(40).nullable().default(null),
  sampled_at: z.string(),
  ok: z.boolean().default(true),
  error_message: z.string().max(1000).nullable().default(null),
});

export const snmpDeviceModel = defineModel({
  name: "snmp.device",
  table: "snmp_devices",
  schema: snmpDeviceSchema,
  extensible: true,
  restEnabled: false,
  publicFields: ["device_key", "name", "host", "enabled"],
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
  restEnabled: false,
  publicFields: ["target_key", "device_key", "oid", "enabled"],
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
  restEnabled: false,
  indexes: [
    { fields: ["target_key", "sampled_at"] },
    { fields: ["device_key", "sampled_at"] },
    { fields: ["sampled_at"] },
  ],
});
