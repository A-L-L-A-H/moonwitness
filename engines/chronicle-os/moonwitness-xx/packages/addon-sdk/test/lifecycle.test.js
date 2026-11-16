import test from "node:test";
import assert from "node:assert/strict";
import { createAddonRegistry } from "../src/registry.js";
import { createPersistentAddonLifecycle } from "../src/lifecycle.js";

class AddonInstallation {}
class AuditEvent {}
class User {}

function addon(id, dependencies = [], lifecycle = {}) {
  return {
    manifest: {
      id,
      name: id,
      version: "1.0.0",
      apiVersion: "1.0.0",
      description: "Lifecycle test add-on",
      dependencies,
      permissions: [],
      enabledByDefault: false
    },
    activate: lifecycle.activate ?? (async () => {}),
    deactivate: lifecycle.deactivate ?? (async () => {})
  };
}

function harness(addons, capabilityService = null) {
  const registry = createAddonRegistry();
  for (const item of addons) registry.register(item);
  const rows = new Map();
  const audits = [];
  const em = {
    transactional: async (callback) => callback(em),
    async findOne(Entity, criteria) {
      return Entity === AddonInstallation ? rows.get(criteria.addonId) ?? null : null;
    },
    async find(Entity) {
      return Entity === AddonInstallation ? [...rows.values()] : [];
    },
    create(Entity, data) {
      return Object.assign(new Entity(), data);
    },
    getReference(_Entity, id) {
      return { id };
    },
    persist(entity) {
      if (entity instanceof AddonInstallation) rows.set(entity.addonId, entity);
      if (entity instanceof AuditEvent) audits.push(entity);
      return em;
    },
    async flush() {}
  };
  const lifecycle = createPersistentAddonLifecycle({
    em,
    registry,
    AddonInstallation,
    AuditEvent,
    User,
    capabilityService
  });
  return { lifecycle, registry, rows, audits };
}

test("install is trusted, persistent, idempotent, and stores only a config hash", async () => {
  const { lifecycle, rows, audits } = harness([addon("moonwitness.base")]);
  const hash = "a".repeat(64);
  const first = await lifecycle.install("moonwitness.base", { actorId: "operator-1", configHash: hash });
  const second = await lifecycle.install("moonwitness.base", { actorId: "operator-1", configHash: hash });

  assert.equal(first, second);
  assert.equal(rows.size, 1);
  assert.equal(first.state, "installed");
  assert.deepEqual(first.config, { configHash: hash });
  assert.equal(audits.filter((event) => event.action === "addon.installed").length, 1);
});

test("enable requires installed and enabled dependencies, then persists runtime state", async () => {
  const { lifecycle, registry, rows } = harness([
    addon("moonwitness.base"),
    addon("moonwitness.media", ["moonwitness.base"])
  ]);
  await lifecycle.install("moonwitness.base");
  await lifecycle.install("moonwitness.media");

  await assert.rejects(
    () => lifecycle.enable("moonwitness.media"),
    (error) => error.code === "ADDON_DEPENDENCY_NOT_ENABLED"
  );

  await lifecycle.enable("moonwitness.base");
  const enabled = await lifecycle.enable("moonwitness.media");
  assert.equal(enabled.state, "enabled");
  assert.equal(registry.list().find((item) => item.id === "moonwitness.media").state, "active");
  assert.equal(rows.get("moonwitness.base").state, "enabled");
});

test("disable refuses active dependents without corrupting persisted state", async () => {
  const { lifecycle, rows } = harness([
    addon("moonwitness.base"),
    addon("moonwitness.media", ["moonwitness.base"])
  ]);
  await lifecycle.install("moonwitness.base");
  await lifecycle.install("moonwitness.media");
  await lifecycle.enable("moonwitness.base");
  await lifecycle.enable("moonwitness.media");

  await assert.rejects(
    () => lifecycle.disable("moonwitness.base"),
    (error) => error.code === "ADDON_HAS_ACTIVE_DEPENDENTS"
  );
  assert.equal(rows.get("moonwitness.base").state, "enabled");
});

test("failed activation persists a safe failed state and error code", async () => {
  const { lifecycle, rows, audits } = harness([
    addon("moonwitness.broken", [], {
      activate: async () => {
        const error = new Error("private stack details");
        error.code = "ADDON_START_FAILED";
        throw error;
      }
    })
  ]);
  await lifecycle.install("moonwitness.broken");

  await assert.rejects(
    () => lifecycle.enable("moonwitness.broken"),
    (error) => error.code === "ADDON_ACTIVATION_FAILED" && error.cause.message === "private stack details"
  );
  assert.equal(rows.get("moonwitness.broken").state, "failed");
  assert.equal(rows.get("moonwitness.broken").lastError, "ADDON_START_FAILED");
  assert.equal(audits.at(-1).action, "addon.enable_failed");
  assert.equal(JSON.stringify(audits).includes("private stack details"), false);
});

test("activation receives only scoped capabilities and disable revokes all grants", async () => {
  let receivedContext;
  const calls = [];
  const capabilityService = {
    resolve: async (addonId) => {
      calls.push(`resolve:${addonId}`);
      return Object.freeze({
        "content.read": Object.freeze({
          read: async () => "scoped"
        })
      });
    },
    revokeAll: async (addonId, options) => {
      calls.push(`revoke:${addonId}:${options.system}`);
      return 1;
    }
  };
  const { lifecycle } = harness([
    addon("moonwitness.scoped", [], {
      activate: async (context) => { receivedContext = context; },
      deactivate: async (context) => { receivedContext = context; }
    })
  ], capabilityService);

  await lifecycle.install("moonwitness.scoped");
  await lifecycle.enable("moonwitness.scoped", { context: { orm: { secret: true } } });
  assert.deepEqual(Object.keys(receivedContext), ["capabilities"]);
  assert.equal(typeof receivedContext.capabilities["content.read"].read, "function");

  await lifecycle.disable("moonwitness.scoped");
  assert.deepEqual(calls, [
    "resolve:moonwitness.scoped",
    "resolve:moonwitness.scoped",
    "revoke:moonwitness.scoped:true"
  ]);
});
