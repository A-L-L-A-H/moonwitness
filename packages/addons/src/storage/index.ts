import type { FastifyInstance } from "fastify";
import type {
  AddonDefinition,
  AddonManifestInput,
  IrMenuInput,
  IrRuleInput,
  IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };
import { storageBucketModel, storageObjectModel, storageUploadSessionModel } from "./models.js";

export const storageManifest = manifestData as AddonManifestInput;
export * from "./models.js";

export const storageRules: IrRuleInput[] = [
  { model_name: "storage.bucket", role: "viewer", can_read: true },
  {
    model_name: "storage.bucket",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "storage.bucket",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "storage.object", role: "viewer", can_read: true },
  {
    model_name: "storage.object",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "storage.object",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const storageViews: IrViewInput[] = [
  {
    model_name: "storage.bucket",
    view_type: "list",
    actionBindings: {
      listUrl: "/api/v1/storage/buckets",
      createUrl: "/api/v1/storage/buckets",
    },
    spec: {
      title: "Storage Buckets",
      description: "S3-compatible object storage buckets managed via Rust storage daemon.",
      domainIcon: "storage",
      columns: ["name", "region", "versioning", "is_public"],
    },
  },
];

export const storageMenus: IrMenuInput[] = [
  {
    menu_key: "storage.gateway",
    label: "Storage",
    href: "/storage",
    icon: "storage",
    plane: "operations",
    sort_order: 40,
    min_role: "viewer",
  },
];

export function createStorageAddon(
  options: { registerRoutes?: (scope: FastifyInstance) => Promise<void> | void } = {},
): AddonDefinition {
  return {
    manifest: storageManifest,
    models: [storageBucketModel, storageObjectModel, storageUploadSessionModel],
    rules: storageRules,
    views: storageViews,
    menus: storageMenus,
    shouldAutoEnable: () => process.env.MW_ADDON_STORAGE_DISABLED !== "1",
    registerRoutes: options.registerRoutes,
  };
}

export const storageAddon = createStorageAddon();
