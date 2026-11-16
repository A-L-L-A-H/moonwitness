import { Value } from "@sinclair/typebox/value";
import { AddonManifestSchema } from "./manifest.js";

export function createAddonRegistry({ apiVersion = "1.0.0" } = {}) {
  const addons = new Map();
  const states = new Map();

  function register(addon) {
    const manifest = addon?.manifest;

    if (!Value.Check(AddonManifestSchema, manifest)) {
      throw new Error("Invalid add-on manifest");
    }

    if (typeof addon.activate !== "function" || typeof addon.deactivate !== "function") {
      throw new Error("Add-on must provide activate() and deactivate() lifecycle functions");
    }

    if (manifest.apiVersion !== apiVersion) {
      throw new Error(
        `Add-on ${manifest.id} requires API ${manifest.apiVersion}; host provides ${apiVersion}`
      );
    }

    if (addons.has(manifest.id)) {
      throw new Error(`Add-on already registered: ${manifest.id}`);
    }

    addons.set(manifest.id, addon);
    states.set(manifest.id, "registered");
  }

  function resolveInstallOrder(ids = [...addons.keys()]) {
    const order = [];
    const visiting = new Set();
    const visited = new Set();

    function visit(id) {
      if (visited.has(id)) return;
      if (visiting.has(id)) throw new Error(`Add-on dependency cycle at ${id}`);

      const addon = addons.get(id);
      if (!addon) throw new Error(`Required add-on is not registered: ${id}`);

      visiting.add(id);
      for (const dependency of addon.manifest.dependencies ?? []) visit(dependency);
      visiting.delete(id);
      visited.add(id);
      order.push(id);
    }

    for (const id of ids) visit(id);
    return order;
  }

  async function activate(id, context) {
    const addon = addons.get(id);
    if (!addon) throw new Error(`Add-on is not registered: ${id}`);
    if (states.get(id) === "active") return;

    const order = resolveInstallOrder([id]);
    const activated = [];

    try {
      for (const addonId of order) {
        if (states.get(addonId) === "active") continue;
        const dependency = addons.get(addonId);
        states.set(addonId, "activating");
        await dependency.activate(context);
        states.set(addonId, "active");
        activated.push(addonId);
      }
    } catch (cause) {
      const rollbackErrors = [];

      for (const addonId of activated.reverse()) {
        const dependency = addons.get(addonId);
        try {
          await dependency.deactivate(context);
          states.set(addonId, "registered");
        } catch (rollbackError) {
          states.set(addonId, "failed");
          rollbackErrors.push({ addonId, error: rollbackError });
        }
      }

      const failedId = order.find((addonId) => states.get(addonId) === "activating");
      if (failedId) states.set(failedId, "failed");

      const error = new Error(
        rollbackErrors.length
          ? `Add-on activation failed; ${rollbackErrors.length} compensation step(s) also failed.`
          : "Add-on activation failed and newly activated dependencies were rolled back.",
        { cause }
      );
      error.code = "ADDON_ACTIVATION_FAILED";
      error.addonId = failedId ?? id;
      error.rollbackErrors = rollbackErrors;
      throw error;
    }
  }

  async function deactivate(id, context) {
    const addon = addons.get(id);
    if (!addon) throw new Error(`Add-on is not registered: ${id}`);
    if (states.get(id) !== "active") return;

    const dependents = [...addons.values()].filter((candidate) =>
      (candidate.manifest.dependencies ?? []).includes(id) &&
      states.get(candidate.manifest.id) === "active"
    );

    if (dependents.length) {
      throw new Error(
        `Cannot deactivate ${id}; active dependents: ${dependents.map((item) => item.manifest.id).join(", ")}`
      );
    }

    await addon.deactivate(context);
    states.set(id, "registered");
  }

  function list() {
    return [...addons.values()].map(({ manifest }) => ({
      ...manifest,
      state: states.get(manifest.id)
    }));
  }

  return Object.freeze({ register, resolveInstallOrder, activate, deactivate, list });
}
