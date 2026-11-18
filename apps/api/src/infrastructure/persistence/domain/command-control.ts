import type { Migration } from "@moonwitness/orm";

export {
  workflowModel,
  workflowSchema,
  alertModel,
  alertSchema,
} from "@moonwitness/addon-command-center";
export { controlCommandModel, controlCommandSchema } from "@moonwitness/addon-control";

/** Retired: synced by `@moonwitness/addon-command-center` and `@moonwitness/addon-control`. */
export const commandControlMigrations: Migration[] = [];
