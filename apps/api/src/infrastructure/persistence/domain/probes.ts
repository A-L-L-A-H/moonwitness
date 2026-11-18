import type { Migration } from "@moonwitness/orm";

export {
  probeNodeModel,
  probeNodeSchema,
  probeEventModel,
  probeEventSchema,
} from "@moonwitness/addon-probes";

/** Retired: synced by `@moonwitness/addon-probes`. */
export const probeOrmMigrations: Migration[] = [];
