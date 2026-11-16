const LIFECYCLE_STATES = Object.freeze([
  "discovered",
  "validated",
  "installed",
  "configured",
  "enabling",
  "enabled",
  "disabling",
  "disabled",
  "failed"
]);

export class AddonLifecycleError extends Error {
  constructor(code, message, statusCode = 409) {
    super(message);
    this.name = "AddonLifecycleError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function safeErrorCode(error) {
  const code = typeof error?.code === "string" ? error.code : "ADDON_LIFECYCLE_FAILED";
  return /^[A-Z][A-Z0-9_]{2,79}$/.test(code) ? code : "ADDON_LIFECYCLE_FAILED";
}

export function createPersistentAddonLifecycle({
  em,
  registry,
  AddonInstallation,
  AuditEvent,
  User,
  capabilityService = null
}) {
  if (!em || !registry || !AddonInstallation || !AuditEvent || !User) {
    throw new TypeError("Persistent add-on lifecycle requires EntityManager, registry, and entity models.");
  }

  async function transaction(callback) {
    return typeof em.transactional === "function"
      ? em.transactional(callback)
      : callback(em);
  }

  function manifestFor(addonId) {
    return registry.list().find((item) => item.id === addonId) ?? null;
  }

  async function audit(tx, actorId, action, addonId, metadata = {}, requestId = null) {
    const event = tx.create(AuditEvent, {
      action,
      actor: actorId ? tx.getReference(User, actorId) : null,
      subjectType: "addon",
      subjectId: addonId,
      requestId,
      metadata: { addonId, ...metadata }
    });
    tx.persist(event);
  }

  async function installation(addonId) {
    return em.findOne(AddonInstallation, { addonId });
  }

  async function install(addonId, {
    actorId = null,
    requestId = null,
    configHash = null
  } = {}) {
    const manifest = manifestFor(addonId);
    if (!manifest) {
      throw new AddonLifecycleError("ADDON_NOT_TRUSTED", "The add-on is not registered in the trusted allowlist.", 404);
    }
    if (configHash !== null && !/^[a-f0-9]{64}$/i.test(configHash)) {
      throw new AddonLifecycleError("INVALID_ADDON_CONFIG_HASH", "Add-on config hash must be a SHA-256 hex digest.", 422);
    }

    return transaction(async (tx) => {
      const existing = await tx.findOne(AddonInstallation, { addonId });
      if (existing) return existing;

      const row = tx.create(AddonInstallation, {
        addonId,
        version: manifest.version,
        state: "installed",
        config: configHash ? { configHash } : {},
        lastError: null,
        enabledAt: null,
        disabledAt: null
      });
      tx.persist(row);
      await audit(tx, actorId, "addon.installed", addonId, { version: manifest.version }, requestId);
      await tx.flush();
      return row;
    });
  }

  async function enable(addonId, {
    actorId = null,
    requestId = null,
    context = {}
  } = {}) {
    const manifest = manifestFor(addonId);
    if (!manifest) {
      throw new AddonLifecycleError("ADDON_NOT_TRUSTED", "The add-on is not registered in the trusted allowlist.", 404);
    }

    const order = registry.resolveInstallOrder([addonId]);
    for (const dependencyId of order.slice(0, -1)) {
      const dependency = await installation(dependencyId);
      if (!dependency || dependency.state !== "enabled") {
        throw new AddonLifecycleError(
          "ADDON_DEPENDENCY_NOT_ENABLED",
          `Required add-on dependency is not enabled: ${dependencyId}`,
          409
        );
      }
      const runtimeDependency = manifestFor(dependencyId);
      if (runtimeDependency?.state !== "active") {
        const capabilities = capabilityService ? await capabilityService.resolve(dependencyId) : Object.freeze({});
        await registry.activate(dependencyId, { capabilities });
      }
    }

    const row = await transaction(async (tx) => {
      const current = await tx.findOne(AddonInstallation, { addonId });
      if (!current) {
        throw new AddonLifecycleError("ADDON_NOT_INSTALLED", "Install the add-on before enabling it.", 409);
      }
      if (current.state === "enabled") return null;
      if (!["installed", "configured", "disabled", "failed"].includes(current.state)) {
        throw new AddonLifecycleError("ADDON_INVALID_LIFECYCLE_STATE", "The add-on cannot be enabled from its current state.", 409);
      }
      current.state = "enabling";
      current.lastError = null;
      await audit(tx, actorId, "addon.enabling", addonId, { version: current.version }, requestId);
      await tx.flush();
      return current;
    });

    if (!row) return installation(addonId);

    try {
      const capabilities = capabilityService ? await capabilityService.resolve(addonId) : Object.freeze({});
      await registry.activate(addonId, { capabilities });
    } catch (error) {
      await transaction(async (tx) => {
        const current = await tx.findOne(AddonInstallation, { addonId });
        current.state = "failed";
        current.lastError = safeErrorCode(error.cause ?? error);
        await audit(tx, actorId, "addon.enable_failed", addonId, {
          errorCode: current.lastError
        }, requestId);
        await tx.flush();
      });
      throw error;
    }

    return transaction(async (tx) => {
      const current = await tx.findOne(AddonInstallation, { addonId });
      current.state = "enabled";
      current.enabledAt = new Date();
      current.disabledAt = null;
      current.lastError = null;
      await audit(tx, actorId, "addon.enabled", addonId, { version: current.version }, requestId);
      await tx.flush();
      return current;
    });
  }

  async function disable(addonId, {
    actorId = null,
    requestId = null,
    context = {}
  } = {}) {
    const manifest = manifestFor(addonId);
    if (!manifest) {
      throw new AddonLifecycleError("ADDON_NOT_TRUSTED", "The add-on is not registered in the trusted allowlist.", 404);
    }

    const activeDependents = registry.list().filter((candidate) =>
      (candidate.dependencies ?? []).includes(addonId) && candidate.state === "active"
    );
    if (activeDependents.length) {
      throw new AddonLifecycleError(
        "ADDON_HAS_ACTIVE_DEPENDENTS",
        "Disable active dependent add-ons before disabling this add-on.",
        409
      );
    }

    const row = await transaction(async (tx) => {
      const current = await tx.findOne(AddonInstallation, { addonId });
      if (!current) throw new AddonLifecycleError("ADDON_NOT_INSTALLED", "The add-on is not installed.", 404);
      if (current.state === "disabled" || current.state === "installed") return null;
      if (current.state !== "enabled") {
        throw new AddonLifecycleError("ADDON_INVALID_LIFECYCLE_STATE", "The add-on cannot be disabled from its current state.", 409);
      }
      current.state = "disabling";
      await audit(tx, actorId, "addon.disabling", addonId, {}, requestId);
      await tx.flush();
      return current;
    });

    if (!row) {
      if (capabilityService) {
        await capabilityService.revokeAll(addonId, { actorId, requestId, system: true });
      }
      return installation(addonId);
    }

    try {
      const capabilities = capabilityService ? await capabilityService.resolve(addonId) : Object.freeze({});
      await registry.deactivate(addonId, { capabilities });
      if (capabilityService) {
        await capabilityService.revokeAll(addonId, { actorId, requestId, system: true });
      }
    } catch (error) {
      await transaction(async (tx) => {
        const current = await tx.findOne(AddonInstallation, { addonId });
        current.state = "failed";
        current.lastError = safeErrorCode(error);
        await audit(tx, actorId, "addon.disable_failed", addonId, {
          errorCode: current.lastError
        }, requestId);
        await tx.flush();
      });
      throw error;
    }

    return transaction(async (tx) => {
      const current = await tx.findOne(AddonInstallation, { addonId });
      current.state = "disabled";
      current.disabledAt = new Date();
      await audit(tx, actorId, "addon.disabled", addonId, {}, requestId);
      await tx.flush();
      return current;
    });
  }

  async function list() {
    const rows = await em.find(AddonInstallation, {}, { orderBy: { addonId: "ASC" } });
    return rows.map((row) => ({
      addonId: row.addonId,
      version: row.version,
      state: row.state,
      configHash: row.config?.configHash ?? null,
      installedAt: row.installedAt ?? null,
      enabledAt: row.enabledAt ?? null,
      disabledAt: row.disabledAt ?? null,
      lastError: row.lastError ?? null
    }));
  }

  return Object.freeze({ install, enable, disable, list, states: LIFECYCLE_STATES });
}
