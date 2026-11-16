import test from "node:test";
import assert from "node:assert/strict";
import { createAuthorizationService } from "../src/authorization.js";
import { RolePermission, UserRole } from "@moonwitness/database";

test("role permission resolution allows least-privilege contributor and owner wildcard", async () => {
  const store = {
    assignments: [
      { user: { id: "u1" }, role: { id: "r1", name: "contributor" } },
      { user: { id: "u2" }, role: { id: "r2", name: "owner" } }
    ],
    grants: [
      { role: { id: "r1" }, permission: "stories.create" },
      { role: { id: "r1" }, permission: "stories.update.own" },
      { role: { id: "r2" }, permission: "*" }
    ]
  };
  const em = {
    async find(Entity, criteria) {
      if (Entity === UserRole) return store.assignments.filter(item => item.user.id === criteria.user);
      if (Entity === RolePermission) {
        const ids = criteria.role.$in;
        return store.grants.filter(item => ids.includes(item.role.id));
      }
      return [];
    }
  };

  const authorization = createAuthorizationService();
  assert.equal(await authorization.hasPermission(em, "u1", "stories.create"), true);
  assert.equal(await authorization.hasPermission(em, "u1", "stories.publish"), false);
  assert.equal(await authorization.hasPermission(em, "u2", "stories.publish"), true);
  assert.equal(await authorization.hasPermission(em, "u1", "unknown.permission"), false);
  assert.deepEqual(await authorization.rolesForUser(em, "u1"), ["contributor"]);
});

test("requirePermission fails closed for users without an assignment", async () => {
  const authorization = createAuthorizationService();
  const em = { find: async () => [] };
  await assert.rejects(
    () => authorization.requirePermission(em, "u-no-role", "users.roles.manage"),
    error => error.code === "PERMISSION_DENIED" && error.statusCode === 403
  );
});
