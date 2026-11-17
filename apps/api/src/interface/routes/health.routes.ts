import type { FastifyInstance, FastifyReply } from "fastify";
import { getDb } from "@moonwitness/orm";

/**
 * Liveness and readiness endpoints.
 *
 * Liveness (`/healthz`, `/health`, `/health/live`) reports only that the process is running.
 * Readiness (`/readyz`, `/health/ready`) additionally verifies database connectivity and returns
 * 503 when the database is unreachable, without leaking error details.
 */
export async function registerHealthRoutes(fastify: FastifyInstance): Promise<void> {
  const liveHandler = async () => ({ status: "ok" });
  fastify.get("/healthz", liveHandler);
  fastify.get("/health", liveHandler);
  fastify.get("/health/live", liveHandler);

  const readyHandler = async (_request: unknown, reply: FastifyReply) => {
    let database = "ok";
    try {
      await getDb().get("SELECT 1 AS ok");
    } catch {
      database = "unavailable";
    }

    if (database !== "ok") {
      return reply.code(503).send({ status: "unavailable", database });
    }
    return reply.code(200).send({ status: "ready", database });
  };
  fastify.get("/readyz", readyHandler);
  fastify.get("/health/ready", readyHandler);
}
