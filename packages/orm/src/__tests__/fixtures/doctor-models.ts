import { z } from "zod";
import { defineModel } from "../../index.js";

export const DOCTOR_FIXTURE_TABLES = {
  tag: "doctor_fx_tags",
  parent: "doctor_fx_parents",
  child: "doctor_fx_children",
  join: "doctor_fx_child_tags",
} as const;

export const doctorFixtureTag = defineModel({
  name: "doctor_fx.tag",
  table: DOCTOR_FIXTURE_TABLES.tag,
  schema: z.object({ label: z.string() }),
});

export const doctorFixtureParent = defineModel({
  name: "doctor_fx.parent",
  table: DOCTOR_FIXTURE_TABLES.parent,
  schema: z.object({ name: z.string() }),
});

export const doctorFixtureChild = defineModel({
  name: "doctor_fx.child",
  table: DOCTOR_FIXTURE_TABLES.child,
  schema: z.object({
    parent_id: z.string().nullable(),
    title: z.string(),
    weight: z.number().int().default(1),
  }),
  indexes: [{ fields: ["title"], unique: true }],
  relations: {
    parent_id: { model: "doctor_fx.parent", onDelete: "set null" },
    tags: {
      model: "doctor_fx.tag",
      type: "many2many",
      through: DOCTOR_FIXTURE_TABLES.join,
      sourceKey: "child_id",
      targetKey: "tag_id",
    },
  },
});
