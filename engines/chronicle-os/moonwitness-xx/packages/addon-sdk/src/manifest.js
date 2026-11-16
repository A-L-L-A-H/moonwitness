import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

export const AddonManifestSchema = Type.Object({
  id: Type.String({ minLength: 3, maxLength: 120, pattern: "^[a-z][a-z0-9.-]+$" }),
  name: Type.String({ minLength: 2, maxLength: 120 }),
  version: Type.String({ pattern: "^\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?$" }),
  apiVersion: Type.String({ minLength: 1, maxLength: 32 }),
  description: Type.String({ maxLength: 500 }),
  dependencies: Type.Array(Type.String(), { default: [] }),
  permissions: Type.Array(Type.String(), { default: [] }),
  enabledByDefault: Type.Boolean({ default: false }),
  entry: Type.Optional(Type.String({ minLength: 1, maxLength: 240 })),
  provider: Type.Optional(Type.String({ maxLength: 80 })),
  securityProfile: Type.Optional(Type.String({ maxLength: 40 }))
}, { additionalProperties: false });

export function defineAddon({ manifest, activate, deactivate }) {
  if (!Value.Check(AddonManifestSchema, manifest)) {
    throw new Error("Invalid add-on manifest");
  }

  if (typeof activate !== "function" || typeof deactivate !== "function") {
    throw new Error("Add-ons must export activate() and deactivate() lifecycle functions");
  }

  return Object.freeze({
    manifest: Object.freeze({ ...manifest }),
    activate,
    deactivate
  });
}
