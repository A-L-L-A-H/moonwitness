import { z } from "zod";
import { defineModel, type Migration } from "@moonwitness/orm";

export const opsEventSchema = z.object({
  event_key: z.string().min(1).max(200),
  kind: z.string().min(1).max(80),
  era: z.string().max(80).nullable(),
  date: z.string().max(40).nullable(),
  title: z.string().min(1).max(300),
  excerpt: z.string().max(2000).nullable(),
  body: z.string().nullable(),
  location: z.string().max(300).nullable(),
  tags_json: z.string().nullable(),
  sources_count: z.number().int().nonnegative().default(0),
  notes_count: z.number().int().nonnegative().default(0),
  image_key: z.string().max(120).nullable(),
  image_position: z.string().max(120).nullable(),
  related_json: z.string().nullable(),
  payload_json: z.string().nullable(),
});

export const opsEventModel = defineModel({
  name: "ops.event",
  table: "ops_events",
  schema: opsEventSchema,
  indexes: [
    { fields: ["event_key"], unique: true },
    { fields: ["kind"] },
    { fields: ["era"] },
    { fields: ["date"] },
  ],
});

export const opsEventMigrations: Migration[] = [
  { id: "040_create_ops_events", up: opsEventModel.ddl },
];
