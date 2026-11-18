import type { Migration } from "@moonwitness/orm";

export {
  storageBucketModel,
  storageBucketSchema,
  storageObjectModel,
  storageObjectSchema,
  storageUploadSessionModel,
  storageUploadSessionSchema,
} from "@moonwitness/addon-storage";

/** Retired: synced automatically by `@moonwitness/addon-storage`. */
export const storageMigrations: Migration[] = [];
