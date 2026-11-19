import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const i18nLocaleSchema = z.object({
  code: z.string().min(2).max(16),
  name: z.string().min(1).max(80),
  native_name: z.string().min(1).max(80),
  rtl: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

export const i18nLocaleModel = defineModel({
  name: "i18n.locale",
  table: "i18n_locales",
  schema: i18nLocaleSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["code", "name", "native_name"],
  publicFields: ["code", "name", "native_name", "rtl"],
  indexes: [{ fields: ["code"], unique: true }],
});

export const i18nTermSchema = z.object({
  locale_code: z.string().min(2).max(16),
  term_key: z.string().min(1).max(160),
  value: z.string().max(4000),
  module: z.string().max(80).default("common"),
});

export const i18nTermModel = defineModel({
  name: "i18n.term",
  table: "i18n_terms",
  schema: i18nTermSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["term_key", "value", "module"],
  publicFields: ["locale_code", "term_key", "value", "module"],
  indexes: [{ fields: ["locale_code", "term_key"], unique: true }, { fields: ["locale_code"] }],
});
