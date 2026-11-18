import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const storageBucketSchema = z.object({
  name: z.string().min(1).max(255),
  region: z.string().max(64).nullable().default(null),
  owner_id: z.string().max(200).nullable().default(null),
  versioning: z.boolean().default(false),
  is_public: z.boolean().default(false),
  metadata_json: z.string().nullable().default(null),
});

export const storageObjectSchema = z.object({
  bucket: z.string().min(1).max(255),
  object_key: z.string().min(1).max(1024),
  etag: z.string().max(200).nullable().default(null),
  content_type: z.string().max(255).nullable().default(null),
  size_bytes: z.number().int().nonnegative().nullable().default(null),
  checksum_sha256: z.string().max(128).nullable().default(null),
  storage_class: z.string().max(64).nullable().default(null),
  metadata_json: z.string().nullable().default(null),
  last_modified_at: z.string().nullable().default(null),
});

export const storageUploadSessionSchema = z.object({
  bucket: z.string().min(1).max(255),
  object_key: z.string().min(1).max(1024),
  upload_id: z.string().min(1).max(255),
  upload_type: z.enum(["single", "multipart"]).default("multipart"),
  state: z.enum(["initiated", "uploading", "completed", "aborted", "failed"]).default("initiated"),
  initiated_by: z.string().max(200).nullable().default(null),
  part_count: z.number().int().nonnegative().default(0),
  expires_at: z.string().nullable().default(null),
  metadata_json: z.string().nullable().default(null),
});

export const storageBucketModel = defineModel({
  name: "storage.bucket",
  table: "storage_buckets",
  schema: storageBucketSchema,
  restEnabled: false,
  publicFields: ["name", "region", "is_public"],
  indexes: [{ fields: ["name"], unique: true }, { fields: ["owner_id"] }],
});

export const storageObjectModel = defineModel({
  name: "storage.object",
  table: "storage_objects",
  schema: storageObjectSchema,
  restEnabled: false,
  publicFields: ["bucket", "object_key", "content_type", "size_bytes"],
  indexes: [
    { fields: ["bucket", "object_key"], unique: true },
    { fields: ["bucket"] },
    { fields: ["last_modified_at"] },
  ],
});

export const storageUploadSessionModel = defineModel({
  name: "storage.upload_session",
  table: "storage_upload_sessions",
  schema: storageUploadSessionSchema,
  restEnabled: false,
  indexes: [
    { fields: ["upload_id"], unique: true },
    { fields: ["bucket", "object_key"] },
    { fields: ["state"] },
  ],
});
