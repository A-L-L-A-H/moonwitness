import test from "node:test";
import assert from "node:assert/strict";
import {
  AddonCapabilityGrant,
  AuditEvent,
  Role,
  RolePermission,
  User,
  UserRole,
  UserSession
} from "@moonwitness/database";
import { createAuthService } from "../src/service.js";

function createFakeEntityManager() {
  const store = {
    users: [],
    sessions: [],
    roles: [],
    rolePermissions: [],
    userRoles: [],
    auditEvents: [],
    addonCapabilityGrants: []
  };
  const pending = [];
  let id = 0;

  const getId = (value) => typeof value === "string" ? value : value?.id;
  const em = {
    transactional: async (callback) => callback(em),
    create(Entity, data) {
      return Object.assign(new Entity(), { id: `fake-${++id}` }, data);
    },
    persist(entity) {
      pending.push(entity);
      return em;
    },
    getReference(Entity, entityId) {
      const collection = Entity === User ? store.users : [];
      return collection.find((entry) => entry.id === entityId) ?? { id: entityId };
    },
    remove(entity) {
      const table = entity instanceof UserRole ? store.userRoles : [];
      const index = table.indexOf(entity);
      if (index >= 0) table.splice(index, 1);
    },
    async flush() {
      while (pending.length) {
        const entity = pending.shift();
        const table =
          entity instanceof User ? store.users :
          entity instanceof UserSession ? store.sessions :
          entity instanceof Role ? store.roles :
          entity instanceof RolePermission ? store.rolePermissions :
          entity instanceof UserRole ? store.userRoles :
          entity instanceof AuditEvent ? store.auditEvents :
          entity instanceof AddonCapabilityGrant ? store.addonCapabilityGrants : null;

        if (!table) continue;
        if (entity instanceof User && table.some((user) => user.email === entity.email || user.handle === entity.handle)) {
          const error = new Error("unique constraint violation");
          error.code = "23505";
          throw error;
        }
        table.push(entity);
      }
    },
    async findOne(Entity, criteria) {
      if (Entity === User) {
        return store.users.find((user) =>
          (criteria.email === undefined || user.email === criteria.email) &&
          (criteria.id === undefined || user.id === criteria.id)
        ) ?? null;
      }
      if (Entity === UserSession) {
        return store.sessions.find((item) =>
          item.tokenHash === criteria.tokenHash &&
          item.revokedAt == null &&
          item.expiresAt > criteria.expiresAt.$gt
        ) ?? null;
      }
      if (Entity === Role) {
        return store.roles.find((role) =>
          criteria.name === undefined || role.name === criteria.name
        ) ?? null;
      }
      if (Entity === RolePermission) {
        return store.rolePermissions.find((grant) =>
          getId(grant.role) === getId(criteria.role) &&
          grant.permission === criteria.permission
        ) ?? null;
      }
      if (Entity === UserRole) {
        return store.userRoles.find((assignment) =>
          getId(assignment.user) === getId(criteria.user) &&
          getId(assignment.role) === getId(criteria.role)
        ) ?? null;
      }
      return null;
    },
    async find(Entity, criteria = {}) {
      if (Entity === RolePermission) {
        const roleValue = criteria.role;
        const roleIds = roleValue?.$in ?? [getId(roleValue)];
        return store.rolePermissions.filter((grant) => roleIds.includes(getId(grant.role)));
      }
      if (Entity === UserRole) {
        if (criteria.user !== undefined) {
          return store.userRoles.filter((assignment) => getId(assignment.user) === getId(criteria.user));
        }
        if (criteria.role !== undefined) {
          return store.userRoles.filter((assignment) => getId(assignment.role) === getId(criteria.role));
        }
        return store.userRoles;
      }
      return [];
    }
  };

  return { em, store };
}

test("register normalizes identities, stores Argon2id, and assigns least-privilege contributor access", async () => {
  const { em, store } = createFakeEntityManager();
  const auth = createAuthService();

  const user = await auth.register(em, {
    handle: "MoonWitness",
    displayName: "Moon Witness",
    email: "Writer@Example.COM",
    password: "a long correct horse battery staple"
  });

  assert.equal(user.handle, "moonwitness");
  assert.equal(user.email, "writer@example.com");
  assert.match(user.passwordHash, /^\$argon2id\$/);
  assert.equal(store.users.length, 1);
  assert.equal(store.userRoles.length, 1);
  assert.equal(store.userRoles[0].role.name, "contributor");
  assert.equal(auth.publicUser(user).passwordHash, undefined);
  assert.equal(await auth.authorization.hasPermission(em, user.id, "stories.create"), true);
  assert.equal(await auth.authorization.hasPermission(em, user.id, "stories.publish"), false);
});

test("registration does not expose whether an email or handle already exists", async () => {
  const { em } = createFakeEntityManager();
  const auth = createAuthService();
  const input = {
    handle: "witness01",
    displayName: "Witness One",
    email: "witness@example.com",
    password: "a different long password phrase"
  };

  await auth.register(em, input);
  await assert.rejects(
    () => auth.register(em, input),
    (error) => error.code === "IDENTITY_UNAVAILABLE" && error.statusCode === 409
  );
});

test("authentication distinguishes valid and invalid credentials safely", async () => {
  const { em } = createFakeEntityManager();
  const auth = createAuthService();
  await auth.register(em, {
    handle: "loginuser",
    displayName: "Login User",
    email: "login@example.com",
    password: "a unique login password phrase"
  });

  const user = await auth.authenticate(em, "LOGIN@example.com", "a unique login password phrase");
  assert.equal(user.handle, "loginuser");
  await assert.rejects(
    () => auth.authenticate(em, "login@example.com", "not the right password"),
    (error) => error.code === "INVALID_CREDENTIALS" && error.statusCode === 401
  );
});

test("session tokens are random, stored as hashes, revocable, and CSRF-bound", async () => {
  const { em, store } = createFakeEntityManager();
  const auth = createAuthService();
  const user = await auth.register(em, {
    handle: "witness02",
    displayName: "Witness Two",
    email: "witness2@example.com",
    password: "another unique long password phrase"
  });

  const issued = await auth.createSession(em, user);
  assert.notEqual(issued.sessionToken, store.sessions[0].tokenHash);
  assert.match(store.sessions[0].tokenHash, /^[a-f0-9]{64}$/);
  assert.equal(auth.verifyCsrfToken(store.sessions[0], issued.csrfToken), true);
  assert.equal(auth.verifyCsrfToken(store.sessions[0], "wrong-token"), false);

  const resolved = await auth.resolveSession(em, issued.sessionToken);
  assert.equal(resolved.user.id, user.id);
  assert.equal(resolved.session.id, store.sessions[0].id);

  const rotatedToken = await auth.rotateCsrfToken(em, resolved.session);
  assert.notEqual(rotatedToken, issued.csrfToken);
  assert.equal(auth.verifyCsrfToken(resolved.session, issued.csrfToken), false);
  assert.equal(auth.verifyCsrfToken(resolved.session, rotatedToken), true);

  await auth.revokeSession(em, resolved.session);
  assert.equal(resolved.session.revokedAt instanceof Date, true);
  assert.equal(await auth.resolveSession(em, issued.sessionToken), null);
});
