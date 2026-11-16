export const PLATFORM_CAPABILITIES = Object.freeze([
  "content.read",
  "content.write",
  "research.read",
  "research.write",
  "media.read",
  "media.write",
  "queue.publish",
  "storage.read",
  "storage.write",
  "integration.whatsapp.session",
  "integration.whatsapp.receive",
  "integration.whatsapp.send"
]);

export class AddonCapabilityError extends Error {
  constructor(code, message, statusCode = 403) {
    super(message);
    this.name = "AddonCapabilityError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function safeActor(actorId) {
  if (typeof actorId !== "string" || actorId.trim().length < 1 || actorId.length > 120) {
    throw new AddonCapabilityError("OPERATOR_REQUIRED", "An authorized operator is required.", 403);
  }
}

export function createAddonCapabilityService({
  em,
  registry,
  AddonCapabilityGrant,
  AddonInstallation,
  AuditEvent,
  User,
  providers = {},
  authorize
}) {
  if (!em || !registry || !AddonCapabilityGrant || !AddonInstallation || !AuditEvent || !User) {
    throw new TypeError("Capability service requires EntityManager, registry, and entity models.");
  }

  async function transaction(callback) {
    return typeof em.transactional === "function" ? em.transactional(callback) : callback(em);
  }

  function manifestFor(addonId) {
    return registry.list().find((item) => item.id === addonId) ?? null;
  }

  async function authorizeOperator(input) {
    safeActor(input.actorId);
    if (typeof authorize !== "function" || await authorize(input) !== true) {
      throw new AddonCapabilityError(
        "CAPABILITY_PERMISSION_REVIEW_REQUIRED",
        "An authorized operator must approve this capability change.",
        403
      );
    }
  }

  async function audit(tx, actorId, action, addonId, permission, requestId) {
    tx.persist(tx.create(AuditEvent, {
      action,
      actor: actorId ? tx.getReference(User, actorId) : null,
      subjectType: "addon",
      subjectId: addonId,
      requestId: requestId ?? null,
      metadata: { addonId, permission }
    }));
  }

  async function assertInstalled(addonId) {
    const row = await em.findOne(AddonInstallation, { addonId });
    if (!row || !["installed", "configured", "enabling", "enabled", "disabling", "disabled"].includes(row.state)) {
      throw new AddonCapabilityError("ADDON_NOT_INSTALLED", "Install the add-on before managing its capabilities.", 409);
    }
    return row;
  }

  async function hasGrant(addonId, permission) {
    return Boolean(await em.findOne(AddonCapabilityGrant, {
      addonId,
      permission,
      revokedAt: null
    }));
  }

  function assertRequested(addonId, permission) {
    const manifest = manifestFor(addonId);
    if (!manifest) {
      throw new AddonCapabilityError("ADDON_NOT_TRUSTED", "The add-on is not in the trusted registry.", 404);
    }
    if (!PLATFORM_CAPABILITIES.includes(permission)) {
      throw new AddonCapabilityError("UNKNOWN_ADDON_CAPABILITY", "The requested capability is not supported.", 422);
    }
    if (!(manifest.permissions ?? []).includes(permission)) {
      throw new AddonCapabilityError(
        "CAPABILITY_NOT_REQUESTED",
        "The add-on manifest does not request this capability.",
        403
      );
    }
    return manifest;
  }

  async function grant(addonId, permission, {
    actorId,
    requestId = null
  } = {}) {
    assertRequested(addonId, permission);
    await assertInstalled(addonId);
    await authorizeOperator({ actorId, addonId, permission, action: "grant" });

    return transaction(async (tx) => {
      const existing = await tx.findOne(AddonCapabilityGrant, {
        addonId,
        permission,
        revokedAt: null
      });
      if (existing) return existing;

      const row = tx.create(AddonCapabilityGrant, {
        addonId,
        permission,
        grantedBy: tx.getReference(User, actorId),
        grantedAt: new Date(),
        revokedAt: null
      });
      tx.persist(row);
      await audit(tx, actorId, "addon.capability.granted", addonId, permission, requestId);
      await tx.flush();
      return row;
    });
  }

  async function revoke(addonId, permission, {
    actorId,
    requestId = null,
    system = false
  } = {}) {
    if (!system) {
      assertRequested(addonId, permission);
      await authorizeOperator({ actorId, addonId, permission, action: "revoke" });
    }

    return transaction(async (tx) => {
      const row = await tx.findOne(AddonCapabilityGrant, {
        addonId,
        permission,
        revokedAt: null
      });
      if (!row) return false;
      row.revokedAt = new Date();
      await audit(tx, actorId, "addon.capability.revoked", addonId, permission, requestId);
      await tx.flush();
      return true;
    });
  }

  async function revokeAll(addonId, {
    actorId = null,
    requestId = null,
    system = false
  } = {}) {
    if (!system) {
      const manifest = manifestFor(addonId);
      if (!manifest) throw new AddonCapabilityError("ADDON_NOT_TRUSTED", "The add-on is not in the trusted registry.", 404);
      await authorizeOperator({ actorId, addonId, permission: "*", action: "revoke_all" });
    }

    const active = await em.find(AddonCapabilityGrant, { addonId, revokedAt: null });
    for (const grantRow of active) {
      await revoke(addonId, grantRow.permission, {
        actorId,
        requestId,
        system: true
      });
    }
    return active.length;
  }

  async function resolve(addonId) {
    const manifest = manifestFor(addonId);
    if (!manifest) throw new AddonCapabilityError("ADDON_NOT_TRUSTED", "The add-on is not in the trusted registry.", 404);
    const installation = await assertInstalled(addonId);
    if (!["enabling", "enabled", "disabling"].includes(installation.state)) {
      throw new AddonCapabilityError("ADDON_NOT_ACTIVE", "Capabilities are available only during activation or while enabled.", 409);
    }

    const active = await em.find(AddonCapabilityGrant, { addonId, revokedAt: null });
    const capabilities = {};

    for (const grantRow of active) {
      const permission = grantRow.permission;
      assertRequested(addonId, permission);
      const provider = Object.hasOwn(providers, permission) ? providers[permission] : null;
      if (!provider || typeof provider !== "object") {
        throw new AddonCapabilityError(
          "ADDON_CAPABILITY_PROVIDER_UNAVAILABLE",
          "A granted capability has no configured provider.",
          503
        );
      }

      const facade = {};
      for (const [methodName, method] of Object.entries(provider)) {
        if (typeof method !== "function") continue;
        facade[methodName] = async (...args) => {
          if (!await hasGrant(addonId, permission)) {
            throw new AddonCapabilityError(
              "ADDON_CAPABILITY_REVOKED",
              "This add-on capability has been revoked.",
              403
            );
          }
          return method.apply(provider, args);
        };
      }
      capabilities[permission] = Object.freeze(facade);
    }

    return Object.freeze(capabilities);
  }

  async function list(addonId) {
    const rows = await em.find(AddonCapabilityGrant, { addonId }, {
      orderBy: { permission: "ASC", grantedAt: "ASC" }
    });
    return rows.map((row) => ({
      permission: row.permission,
      grantedAt: row.grantedAt,
      revokedAt: row.revokedAt,
      active: row.revokedAt == null
    }));
  }

  return Object.freeze({ grant, revoke, revokeAll, resolve, list, capabilities: PLATFORM_CAPABILITIES });
}
