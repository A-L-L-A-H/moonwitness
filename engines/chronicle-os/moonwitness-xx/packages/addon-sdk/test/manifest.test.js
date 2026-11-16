import test from "node:test";
import assert from "node:assert/strict";
import { AddonManifestSchema, defineAddon } from "../src/manifest.js";
import { Value } from "@sinclair/typebox/value";

const validManifest = {
  id: "moonwitness.example",
  name: "Example Add-on",
  version: "1.0.0",
  apiVersion: "1.0.0",
  description: "A fixture add-on.",
  dependencies: [],
  permissions: [],
  enabledByDefault: false
};

test("manifest accepts a valid minimal add-on", () => {
  assert.equal(Value.Check(AddonManifestSchema, validManifest), true);
  assert.doesNotThrow(() => defineAddon({
    manifest: validManifest,
    activate: async () => {},
    deactivate: async () => {}
  }));
});

test("manifest rejects invalid ids, versions, and undeclared properties", () => {
  assert.equal(Value.Check(AddonManifestSchema, {
    ...validManifest,
    id: "Invalid ID",
    version: "latest"
  }), false);

  assert.equal(Value.Check(AddonManifestSchema, {
    ...validManifest,
    secret: "must-not-be-accepted"
  }), false);
});

test("defineAddon requires lifecycle functions", () => {
  assert.throws(() => defineAddon({
    manifest: validManifest,
    activate: async () => {}
  }), /activate\(\) and deactivate\(\)/);
});
