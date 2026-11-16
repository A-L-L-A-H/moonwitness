import test from "node:test";
import assert from "node:assert/strict";
import { createAddonRegistry } from "../src/registry.js";
import {
  AddonCapabilityError,
  createAddonCapabilityService,
  PLATFORM_CAPABILITIES
} from "../src/capabilities.js";

class AddonCapabilityGrant {}
class AddonInstallation {}
class AuditEvent {}
class User {}

function addon(id, permissions) {
  return {
    manifest: {
      id,
      name: id,
      version: "1.0.0",
      apiVersion: "1.0.0",
      description: "Capability test add-on",
      dependencies: [],
      permissions,
      enabledByDefault: false
    },
    activate: async () => {},
    deactivate: async () => {}
  };
}

function harness({ permissions = ["content.read", "content.write"], authorize = async () => true, providers = null } = {}) {
  const registry = createAddonRegistry();
  registry.register(addon("moonwitness.test", permissions));
  const grants = [];
  const installations = new Map([[
    "moonwitness.test",
    Object.assign(new AddonInstallation(), { addonId: "moonwitness.test", state: "installed" })
  ]]);
  const audits = [];
  const em = {
    transactional: async (callback) => callback(em),
    async findOne(Entity, criteria) {
      if (Entity === AddonInstallation) return installations.get(criteria.addonId) ?? null;
      if (Entity === AddonCapabilityGrant) {
        return grants.find((row) =>
          row.addonId === criteria.addonId &&
          row.permission === criteria.permission &&
          (criteria.revokedAt === undefined || row.revokedAt === criteria.revokedAt)
        ) ?? null;
      }
      return null;
    },
    async find(Entity, criteria) {
      if (Entity === AddonInstallation) return [...installations.values()].filter((row) => !criteria.addonId || row.addonId === criteria.addonId);
      if (Entity === AddonCapabilityGrant) return grants.filter((row) => row.addonId === criteria.addonId && (criteria.revokedAt === undefined || row.revokedAt === criteria.revokedAt));
      return [];
    },
    create(Entity, data) {
      return Object.assign(new Entity(), data);
    },
    getReference(_Entity, id) { return { id }; },
    persist(row) {
      if (row instanceof AddonCapabilityGrant) grants.push(row);
      if (row instanceof AuditEvent) audits.push(row);
      return em;
    },
    async flush() {}
  };
  const capabilityService = createAddonCapabilityService({
    em,
    registry,
    AddonCapabilityGrant,
    AddonInstallation,
    AuditEvent,
    User,
    authorize,
    providers: providers ?? {
      "content.read": {
        read: async (id) => ({ id, title: "safe result" })
      },
      "content.write": {
        save: async (input) => ({ saved: true, input })
      }
    }
  });
  return { capabilityService, grants, audits, installations };
}

test("capability grants require a requested, allowlisted permission and explicit operator approval", async () => {
  const denied = harness({ authorize: async () => false });
  await assert.rejects(
    () => denied.capabilityService.grant("moonwitness.test", "content.read", { actorId: "operator-1" }),
    (error) => error.code === "CAPABILITY_PERMISSION_REVIEW_REQUIRED"
  );

  const allowed = harness();
  await assert.rejects(
    () => allowed.capabilityService.grant("moonwitness.test", "integration.whatsapp.send", { actorId: "operator-1" }),
    (error) => error.code === "CAPABILITY_NOT_REQUESTED"
  );
  await assert.rejects(
    () => allowed.capabilityService.grant("moonwitness.test", "root.database", { actorId: "operator-1" }),
    (error) => error.code === "UNKNOWN_ADDON_CAPABILITY"
  );
  await assert.rejects(
    () => allowed.capabilityService.grant("moonwitness.test", "content.read"),
    (error) => error.code === "OPERATOR_REQUIRED"
  );
  assert.ok(PLATFORM_CAPABILITIES.includes("integration.whatsapp.send"));
});

test("grants are idempotent, audited, and expose only explicitly granted provider methods", async () => {
  const { capabilityService, grants, audits, installations } = harness();
  const first = await capabilityService.grant("moonwitness.test", "content.read", { actorId: "operator-1" });
  const second = await capabilityService.grant("moonwitness.test", "content.read", { actorId: "operator-1" });

  assert.equal(first, second);
  assert.equal(grants.length, 1);
  assert.equal(audits.filter((row) => row.action === "addon.capability.granted").length, 1);

  installations.get("moonwitness.test").state = "enabled";
  const capabilities = await capabilityService.resolve("moonwitness.test");
  assert.deepEqual(Object.keys(capabilities), ["content.read"]);
  assert.deepEqual(Object.keys(capabilities["content.read"]), ["read"]);
  assert.deepEqual(await capabilities["content.read"].read("story-1"), {
    id: "story-1",
    title: "safe result"
  });
});

test("revocation blocks an already-issued capability facade on its next call", async () => {
  const { capabilityService, grants, audits, installations } = harness();
  await capabilityService.grant("moonwitness.test", "content.read", { actorId: "operator-1" });
  installations.get("moonwitness.test").state = "enabled";
  const capabilities = await capabilityService.resolve("moonwitness.test");

  assert.equal(await capabilities["content.read"].read("story-1").then((value) => value.id), "story-1");
  assert.equal(await capabilityService.revoke("moonwitness.test", "content.read", { actorId: "operator-1" }), true);
  await assert.rejects(
    () => capabilities["content.read"].read("story-1"),
    (error) => error instanceof AddonCapabilityError && error.code === "ADDON_CAPABILITY_REVOKED"
  );
  assert.ok(grants[0].revokedAt instanceof Date);
  assert.equal(audits.at(-1).action, "addon.capability.revoked");
});

test("capability resolution fails closed when the provider is missing or installation is not active", async () => {
  const { capabilityService, installations } = harness();
  await capabilityService.grant("moonwitness.test", "content.read", { actorId: "operator-1" });
  await assert.rejects(
    () => capabilityService.resolve("moonwitness.test"),
    (error) => error.code === "ADDON_NOT_ACTIVE"
  );
  installations.get("moonwitness.test").state = "enabled";
  const capabilities = await capabilityService.resolve("moonwitness.test");
  assert.equal(typeof capabilities["content.read"].read, "function");

  const missingProvider = harness({ providers: {} });
  await missingProvider.capabilityService.grant("moonwitness.test", "content.read", { actorId: "operator-1" });
  missingProvider.installations.get("moonwitness.test").state = "enabled";
  await assert.rejects(
    () => missingProvider.capabilityService.resolve("moonwitness.test"),
    (error) => error.code === "ADDON_CAPABILITY_PROVIDER_UNAVAILABLE"
  );
});
