import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import {
  TimelineErasResponseSchema,
  TimelineEventResponseSchema,
  TimelineListQuerySchema,
  TimelineListResponseSchema,
  TimelineStatsResponseSchema,
} from "@moonwitness/contracts";
import { TimelineUseCase } from "../../domain/usecases/timeline/timeline.usecase";
import { timelineRoutes } from "./timeline.routes";

vi.mock("../../middleware/auth", () => ({
  optionalAuth: () => async (request: FastifyRequest) => {
    request.user = {
      id: "1",
      username: "contract-editor",
      email: "contract@moonwitness.local",
      role: "editor",
      displayName: "Contract Editor",
    };
  },
  requireAuth: () => async () => {},
  requireRole: () => async (_request: FastifyRequest, _reply: FastifyReply) => {},
}));

describe("@moonwitness/contracts timeline parity", () => {
  let app: FastifyInstance | null = null;

  beforeEach(async () => {
    const sampleEvent = {
      id: "evt-1",
      kind: "PROJECT" as const,
      date: "2026-11-18",
      era: "origins" as const,
      title: "Contract Parity Check",
      excerpt: "Verifies API payloads against @moonwitness/contracts.",
      body: "Full body text",
      location: "Zone A",
      tags: ["contracts"],
      sources: 1,
      notes: 1,
      image: "hero-witness" as const,
      related: [],
    };

    const timelineUseCase = new TimelineUseCase({
      listEvents: async () => [sampleEvent],
      countEvents: async () => 1,
      getEvent: async (id) => (id === "evt-1" ? sampleEvent : null),
      getStats: async () => ({ total: 1, byEra: { origins: 1 }, byKind: { PROJECT: 1 } }),
      getEras: async () => [
        {
          id: "origins",
          name: "Origins",
          years: "2024–2026",
          tagline: "Foundation",
          color: "#d4af37",
        },
      ],
      createEvent: async (input) => ({ ...sampleEvent, ...input, id: input.id ?? "evt-created" }),
      updateEvent: async (_id, patch) => ({ ...sampleEvent, ...patch }),
      archiveEvent: async () => sampleEvent,
      restoreEvent: async () => sampleEvent,
      deleteEvent: async () => true,
      getEventHistory: async () => [],
    });

    app = Fastify({ logger: false });
    app.decorate("timelineUseCase", timelineUseCase);
    await app.register(timelineRoutes, { prefix: "/api/v1/timeline" });
    await app.ready();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("validates timeline list, single event, stats, and eras responses against shared contract schemas", async () => {
    expect(TimelineListQuerySchema.safeParse({ era: "origins", limit: 10 }).success).toBe(true);

    const listRes = await app!.inject({ method: "GET", url: "/api/v1/timeline/events?limit=10" });
    expect(listRes.statusCode).toBe(200);
    expect(TimelineListResponseSchema.safeParse(listRes.json()).success).toBe(true);

    const itemRes = await app!.inject({ method: "GET", url: "/api/v1/timeline/events/evt-1" });
    expect(itemRes.statusCode).toBe(200);
    expect(TimelineEventResponseSchema.safeParse(itemRes.json()).success).toBe(true);

    const statsRes = await app!.inject({ method: "GET", url: "/api/v1/timeline/stats" });
    expect(statsRes.statusCode).toBe(200);
    expect(TimelineStatsResponseSchema.safeParse(statsRes.json()).success).toBe(true);

    const erasRes = await app!.inject({ method: "GET", url: "/api/v1/timeline/eras" });
    expect(erasRes.statusCode).toBe(200);
    expect(TimelineErasResponseSchema.safeParse(erasRes.json()).success).toBe(true);
  });
});
