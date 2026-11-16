import test from "node:test";
import assert from "node:assert/strict";
import { createAddonRegistry } from "../src/registry.js";

function addon(id, dependencies = [], lifecycle = {}) {
  return {
    manifest: {
      id,
      name: id,
      version: "1.0.0",
      apiVersion: "1.0.0",
      description: "Test add-on",
      dependencies,
      permissions: [],
      enabledByDefault: false
    },
    activate: lifecycle.activate ?? (async () => {}),
    deactivate: lifecycle.deactivate ?? (async () => {})
  };
}

test("registry resolves dependencies before the requested add-on", () => {
  const registry = createAddonRegistry();
  registry.register(addon("moonwitness.base"));
  registry.register(addon("moonwitness.media", ["moonwitness.base"]));

  assert.deepEqual(
    registry.resolveInstallOrder(["moonwitness.media"]),
    ["moonwitness.base", "moonwitness.media"]
  );
});

test("registry rejects invalid manifests and missing lifecycle functions", () => {
  const registry = createAddonRegistry();

  assert.throws(() => registry.register({
    manifest: { id: "invalid", version: "latest", apiVersion: "1.0.0" },
    activate: async () => {},
    deactivate: async () => {}
  }), /Invalid add-on manifest/);

  const valid = addon("moonwitness.incomplete");
  delete valid.deactivate;
  assert.throws(() => registry.register(valid), /lifecycle functions/);
});

test("registry rejects missing dependencies and cycles", () => {
  const missing = createAddonRegistry();
  missing.register(addon("moonwitness.media", ["moonwitness.base"]));
  assert.throws(() => missing.resolveInstallOrder(["moonwitness.media"]), /not registered/);

  const cyclic = createAddonRegistry();
  cyclic.register(addon("moonwitness.a", ["moonwitness.b"]));
  cyclic.register(addon("moonwitness.b", ["moonwitness.a"]));
  assert.throws(() => cyclic.resolveInstallOrder(["moonwitness.a"]), /dependency cycle/);
});

test("registry activates dependencies and prevents disabling an active dependency", async () => {
  const calls = [];
  const registry = createAddonRegistry();
  registry.register(addon("moonwitness.base", [], {
    activate: async () => calls.push("base+"),
    deactivate: async () => calls.push("base-")
  }));
  registry.register(addon("moonwitness.media", ["moonwitness.base"], {
    activate: async () => calls.push("media+"),
    deactivate: async () => calls.push("media-")
  }));

  await registry.activate("moonwitness.media");
  assert.deepEqual(calls, ["base+", "media+"]);
  await assert.rejects(() => registry.deactivate("moonwitness.base"), /active dependents/);
  await registry.deactivate("moonwitness.media");
  await registry.deactivate("moonwitness.base");
  assert.deepEqual(calls, ["base+", "media+", "media-", "base-"]);
});

test("failed child activation compensates only dependencies activated by this request in reverse order", async () => {
  const calls = [];
  const registry = createAddonRegistry();
  registry.register(addon("moonwitness.base", [], {
    activate: async () => calls.push("base+"),
    deactivate: async () => calls.push("base-")
  }));
  registry.register(addon("moonwitness.media", ["moonwitness.base"], {
    activate: async () => calls.push("media+"),
    deactivate: async () => calls.push("media-")
  }));
  registry.register(addon("moonwitness.publisher", ["moonwitness.media"], {
    activate: async () => {
      calls.push("publisher+");
      throw new Error("activation exploded");
    }
  }));

  await assert.rejects(
    () => registry.activate("moonwitness.publisher"),
    (error) => error.code === "ADDON_ACTIVATION_FAILED" && error.cause.message === "activation exploded"
  );
  assert.deepEqual(calls, ["base+", "media+", "publisher+", "media-", "base-"]);
  assert.deepEqual(registry.list().map((item) => item.state), ["registered", "registered", "failed"]);
});

test("failed child activation leaves dependencies active when they were active beforehand", async () => {
  const calls = [];
  const registry = createAddonRegistry();
  registry.register(addon("moonwitness.base", [], {
    activate: async () => calls.push("base+"),
    deactivate: async () => calls.push("base-")
  }));
  registry.register(addon("moonwitness.child", ["moonwitness.base"], {
    activate: async () => { throw new Error("child failed"); }
  }));

  await registry.activate("moonwitness.base");
  await assert.rejects(() => registry.activate("moonwitness.child"), /activation failed/);
  assert.deepEqual(calls, ["base+"]);
  assert.equal(registry.list()[0].state, "active");
});

test("rollback failures are retained without replacing the original activation error", async () => {
  const registry = createAddonRegistry();
  registry.register(addon("moonwitness.base", [], {
    deactivate: async () => { throw new Error("cleanup failed"); }
  }));
  registry.register(addon("moonwitness.child", ["moonwitness.base"], {
    activate: async () => { throw new Error("activation failed"); }
  }));

  await assert.rejects(
    () => registry.activate("moonwitness.child"),
    (error) => error.cause.message === "activation failed" &&
      error.rollbackErrors.length === 1 &&
      error.rollbackErrors[0].error.message === "cleanup failed"
  );
  assert.equal(registry.list()[0].state, "failed");
  assert.equal(registry.list()[1].state, "failed");
});
