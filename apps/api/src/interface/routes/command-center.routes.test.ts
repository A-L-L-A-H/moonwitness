import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { applyMigrations, closeDb, initDb } from "@moonwitness/orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import { authMigrations } from "../../db/migrations";
import { commandCenterMigrations } from "./command-center.persistence";

vi.mock("../../middleware/auth", () => ({
  requireAuth: () => async (request: FastifyRequest, reply: FastifyReply) => {
    const cookieHeader = request.headers.cookie ?? "";
    if (!cookieHeader.includes("mw_session=")) {
      return reply.code(401).send({ error: "Not authenticated" });
    }
    const actor = request.headers["x-test-actor"] === "second" ? 2 : 1;
    request.user = {
      id: actor,
      username: actor === 2 ? "editor-two" : "creator-one",
      email: `actor${actor}@moonwitness.local`,
      role: "editor",
      displayName: `Actor ${actor}`,
    };
  },
}));

describe("command center persistence routes", () => {
  let app: FastifyInstance | null = null;
  const authHeaders = { cookie: "mw_session=test-session" };

  beforeEach(async () => {
    await initDb("file::memory:?cache=shared");
    await applyMigrations([...authMigrations, ...commandCenterMigrations]);
    const { commandCenterRoutes } = await import("./command-center.routes");
    app = Fastify({ logger: false });
    await app.register(commandCenterRoutes, { prefix: "/api/v1" });
    await app.ready();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
    await closeDb();
  });

  it("rejects unauthenticated requests with 401", async () => {
    const res = await app!.inject({
      method: "GET",
      url: "/api/v1/command-center/state",
    });
    expect(res.statusCode).toBe(401);
  });

  it("hydrates initial workflows/alerts and persists newly created & toggled workflows", async () => {
    const initial = await app!.inject({
      method: "GET",
      url: "/api/v1/command-center/state",
      headers: authHeaders,
    });
    expect(initial.statusCode).toBe(200);
    const body = initial.json() as {
      workflows: Array<{ id: string; status: string }>;
      alerts: Array<{ id: string }>;
    };
    expect(body.workflows).toHaveLength(5);
    expect(body.alerts).toHaveLength(3);

    const created = await app!.inject({
      method: "POST",
      url: "/api/v1/command-center/workflows",
      headers: authHeaders,
      payload: {
        name: "Nightly Zine Compiler",
        detail: "story-forge · The Batteries",
      },
    });
    expect(created.statusCode).toBe(201);
    const createdWf = (created.json() as { workflow: { id: string; status: string; name: string } })
      .workflow;
    expect(createdWf.name).toBe("Nightly Zine Compiler");
    expect(createdWf.status).toBe("Queued");

    const toggled = await app!.inject({
      method: "PATCH",
      url: `/api/v1/command-center/workflows/${createdWf.id}/toggle`,
      headers: authHeaders,
    });
    expect(toggled.statusCode).toBe(200);
    expect((toggled.json() as { workflow: { status: string } }).workflow.status).toBe("Running");

    const refreshed = await app!.inject({
      method: "GET",
      url: "/api/v1/command-center/state",
      headers: authHeaders,
    });
    const refreshedBody = refreshed.json() as {
      workflows: Array<{ id: string; status: string }>;
    };
    expect(refreshedBody.workflows[0]?.id).toBe(createdWf.id);
    expect(refreshedBody.workflows[0]?.status).toBe("Running");
  });

  it("validates payload schema and keeps dismissed alerts dismissed across reloads", async () => {
    const bad = await app!.inject({
      method: "POST",
      url: "/api/v1/command-center/workflows",
      headers: authHeaders,
      payload: { name: "  ", detail: "" },
    });
    expect(bad.statusCode).toBe(400);

    const dismissed = await app!.inject({
      method: "DELETE",
      url: "/api/v1/command-center/alerts/a-2",
      headers: authHeaders,
    });
    expect(dismissed.statusCode).toBe(200);

    const missing = await app!.inject({
      method: "DELETE",
      url: "/api/v1/command-center/alerts/a-2",
      headers: authHeaders,
    });
    expect(missing.statusCode).toBe(404);

    // Other actors still keep their own alert state isolated
    const otherActor = await app!.inject({
      method: "GET",
      url: "/api/v1/command-center/state",
      headers: { ...authHeaders, "x-test-actor": "second" },
    });
    expect((otherActor.json() as { alerts: Array<{ id: string }> }).alerts).toHaveLength(3);

    const sameActor = await app!.inject({
      method: "GET",
      url: "/api/v1/command-center/state",
      headers: authHeaders,
    });
    const remainingIds = (sameActor.json() as { alerts: Array<{ id: string }> }).alerts.map(
      (a) => a.id,
    );
    expect(remainingIds).toEqual(["a-1", "a-3"]);
  });
});
