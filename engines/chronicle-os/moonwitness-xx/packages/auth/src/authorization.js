import { randomUUID } from "node:crypto";
import {
  AuditEvent,
  createOutboxRepository,
  Role,
  RolePermission,
  User,
  UserRole
} from "@moonwitness/database";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_SCOPES } from "@moonwitness/contracts";

export class AuthorizationError extends Error {
  constructor(code, message, statusCode = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function createAuthorizationService() {
  async function ensureRoleCatalog(em) {
    const roles = new Map();

    for (const [name, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      let role = await em.findOne(Role, { name });
      if (!role) {
        role = em.create(Role, {
          name,
          description: `${name[0].toUpperCase()}${name.slice(1)} access role`,
          isSystem: true
        });
        em.persist(role);
        await em.flush();
      }

      roles.set(name, role);
      const existing = await em.find(RolePermission, { role: role.id });
      const existingPermissions = new Set(existing.map((grant) => grant.permission));

      for (const permission of permissions) {
        if (!existingPermissions.has(permission)) {
          em.persist(em.create(RolePermission, { role, permission }));
        }
      }
      if (permissions.length) await em.flush();
    }

    return roles;
  }

  async function permissionsForUser(em, userId) {
    const assignments = await em.find(UserRole, { user: userId }, { populate: ["role"] });
    if (!assignments.length) return [];

    const roleIds = assignments.map((assignment) => assignment.role.id);
    const grants = await em.find(RolePermission, { role: { $in: roleIds } });
    return [...new Set(grants.map((grant) => grant.permission))].sort();
  }

  async function rolesForUser(em, userId) {
    const assignments = await em.find(UserRole, { user: userId }, { populate: ["role"] });
    return [...new Set(assignments.map((assignment) => assignment.role.name))].sort();
  }

  async function hasPermission(em, userId, permission) {
    if (!PERMISSION_SCOPES.includes(permission)) return false;
    const permissions = await permissionsForUser(em, userId);
    return permissions.includes("*") || permissions.includes(permission);
  }

  async function requirePermission(em, userId, permission) {
    if (!await hasPermission(em, userId, permission)) {
      throw new AuthorizationError("PERMISSION_DENIED", "You do not have permission to perform this action.", 403);
    }
    return true;
  }

  async function assignInitialRole(em, user, roleName = "contributor") {
    const roles = await ensureRoleCatalog(em);
    const role = roles.get(roleName);
    if (!role) throw new AuthorizationError("UNKNOWN_ROLE", "The requested role does not exist.", 422);

    const existing = await em.findOne(UserRole, { user: user.id, role: role.id });
    if (existing) return existing;

    const assignment = em.create(UserRole, { user, role, grantedBy: null });
    em.persist(assignment);
    await em.flush();
    return assignment;
  }

  async function grantRole(em, { actorId, userId, roleName, requestId }) {
    return em.transactional(async (tx) => {
      await requirePermission(tx, actorId, "users.roles.manage");

      const role = await tx.findOne(Role, { name: roleName });
      const user = await tx.findOne(User, { id: userId });
      if (roleName === "owner" && !(await permissionsForUser(tx, actorId)).includes("*")) {
        throw new AuthorizationError("OWNER_GRANT_REQUIRES_OWNER", "Only an existing owner can grant the owner role.", 403);
      }
      if (!role) throw new AuthorizationError("UNKNOWN_ROLE", "The requested role does not exist.", 404);
      if (!user) throw new AuthorizationError("USER_NOT_FOUND", "User was not found.", 404);

      const existing = await tx.findOne(UserRole, { user: userId, role: role.id });
      if (existing) return existing;

      const assignment = tx.create(UserRole, {
        user,
        role,
        grantedBy: tx.getReference(User, actorId)
      });
      tx.persist(assignment);
      tx.persist(tx.create(AuditEvent, {
        actor: tx.getReference(User, actorId),
        action: "user.role.granted",
        subjectType: "user",
        subjectId: userId,
        requestId: requestId ?? null,
        metadata: { roleName }
      }));
      await createOutboxRepository(tx).append({
        eventType: "user.role.granted",
        schemaVersion: 1,
        payload: { userId, actorId, roleName },
        correlationId: requestId ?? randomUUID(),
        idempotencyKey: requestId ? `user.role.granted:${userId}:${roleName}:${requestId}` : null
      });
      await tx.flush();
      return assignment;
    });
  }

  async function revokeRole(em, { actorId, userId, roleName, requestId }) {
    return em.transactional(async (tx) => {
      await requirePermission(tx, actorId, "users.roles.manage");

      const role = await tx.findOne(Role, { name: roleName });
      if (!role) throw new AuthorizationError("UNKNOWN_ROLE", "The requested role does not exist.", 404);

      const assignment = await tx.findOne(UserRole, { user: userId, role: role.id });
      if (!assignment) return false;
      if (roleName === "owner" && !(await permissionsForUser(tx, actorId)).includes("*")) {
        throw new AuthorizationError("OWNER_REVOKE_REQUIRES_OWNER", "Only an owner can revoke the owner role.", 403);
      }

      if (roleName === "owner") {
        const ownerAssignments = await tx.find(UserRole, { role: role.id });
        if (ownerAssignments.length <= 1) {
          throw new AuthorizationError("LAST_OWNER_PROTECTED", "The last owner role assignment cannot be removed.", 409);
        }
      }

      tx.remove(assignment);
      tx.persist(tx.create(AuditEvent, {
        actor: tx.getReference(User, actorId),
        action: "user.role.revoked",
        subjectType: "user",
        subjectId: userId,
        requestId: requestId ?? null,
        metadata: { roleName }
      }));
      await createOutboxRepository(tx).append({
        eventType: "user.role.revoked",
        schemaVersion: 1,
        payload: { userId, actorId, roleName },
        correlationId: requestId ?? randomUUID(),
        idempotencyKey: requestId ? `user.role.revoked:${userId}:${roleName}:${requestId}` : null
      });
      await tx.flush();
      return true;
    });
  }

  async function listUserAccess(em, userId) {
    return {
      userId,
      roles: await rolesForUser(em, userId),
      permissions: await permissionsForUser(em, userId)
    };
  }

  return Object.freeze({
    ensureRoleCatalog,
    assignInitialRole,
    permissionsForUser,
    rolesForUser,
    hasPermission,
    requirePermission,
    grantRole,
    revokeRole,
    listUserAccess
  });
}
