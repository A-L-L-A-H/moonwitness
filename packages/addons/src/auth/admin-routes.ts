import type { FastifyInstance } from "fastify";
import { defaultFailClosedAuthBridge, type BaseAddonAuthBridge } from "@moonwitness/addon-runtime";
import {
  createUser,
  deleteUser,
  findUserByEmail,
  findUserByUsername,
  listUsers,
  updateUserRole,
} from "./service.js";

export function registerAuthAdminRoutes(
  fastify: FastifyInstance,
  auth: BaseAddonAuthBridge = defaultFailClosedAuthBridge,
): void {
  const requireAdmin = [auth.authenticate, auth.requireRole("admin")];

  fastify.get("/auth/users", { preHandler: requireAdmin }, async (_request, reply) => {
    reply.header("cache-control", "no-store");
    const users = await listUsers();
    return reply.send({ users });
  });

  fastify.post("/auth/users", { preHandler: requireAdmin }, async (request, reply) => {
    reply.header("cache-control", "no-store");
    const body = request.body as {
      username?: unknown;
      email?: unknown;
      password?: unknown;
      role?: unknown;
      displayName?: unknown;
    } | null;

    const rawUsername =
      typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
    const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const role = typeof body?.role === "string" ? body.role : "viewer";
    const displayName =
      typeof body?.displayName === "string" ? body.displayName.trim() : rawUsername;

    if (!/^[a-z0-9][a-z0-9._-]{1,78}$/.test(rawUsername)) {
      return reply.code(400).send({ error: "Username must be 2-80 valid identifier characters" });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rawEmail)) {
      return reply.code(400).send({ error: "Email must be valid" });
    }
    const pwdBytes = Buffer.byteLength(password, "utf8");
    if (pwdBytes < 12 || pwdBytes > 72) {
      return reply.code(400).send({ error: "Password must be between 12 and 72 UTF-8 bytes" });
    }
    if (!["admin", "editor", "viewer"].includes(role)) {
      return reply.code(400).send({ error: "Role must be admin, editor, or viewer" });
    }
    if (displayName.length < 2 || displayName.length > 160) {
      return reply.code(400).send({ error: "displayName must be 2-160 characters" });
    }

    if ((await findUserByUsername(rawUsername)) || (await findUserByEmail(rawEmail))) {
      return reply.code(409).send({ error: "Username or email already exists" });
    }

    const user = await createUser({
      username: rawUsername,
      email: rawEmail,
      password,
      role: role as "admin" | "editor" | "viewer",
      displayName,
    });
    return reply.code(201).send({ user });
  });

  fastify.patch<{ Params: { id: string } }>(
    "/auth/users/:id/role",
    { preHandler: requireAdmin },
    async (request, reply) => {
      reply.header("cache-control", "no-store");
      const targetId = request.params.id.trim();
      if (!targetId) return reply.code(400).send({ error: "Invalid user id" });
      const body = request.body as { role?: unknown } | null;
      const role = typeof body?.role === "string" ? body.role : "";
      if (!["admin", "editor", "viewer"].includes(role)) {
        return reply.code(400).send({ error: "Role must be admin, editor, or viewer" });
      }
      const actorId = auth.getActorId(request) ?? undefined;
      const result = await updateUserRole(targetId, role as "admin" | "editor" | "viewer", actorId);
      if (!result.ok) {
        const status =
          result.code === "NOT_FOUND"
            ? 404
            : result.code === "FORBIDDEN"
              ? 403
              : result.code === "CONFLICT"
                ? 409
                : 400;
        return reply.code(status).send({ error: result.error });
      }
      return reply.send({ user: result.user });
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/auth/users/:id",
    { preHandler: requireAdmin },
    async (request, reply) => {
      reply.header("cache-control", "no-store");
      const targetId = request.params.id.trim();
      if (!targetId) return reply.code(400).send({ error: "Invalid user id" });
      const actorId = auth.getActorId(request) ?? undefined;
      const result = await deleteUser(targetId, actorId);
      if (!result.ok) {
        const status = result.code === "NOT_FOUND" ? 404 : result.code === "FORBIDDEN" ? 403 : 409;
        return reply.code(status).send({ error: result.error });
      }
      return reply.send({ ok: true, user: result.user });
    },
  );
}
