import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../../middleware/auth";
import {
  executeProbeForNode,
  listProbeNodes,
  listRecentProbeEvents,
  type ProbeEvent,
} from "./probes.persistence";

const probeRunInputSchema = z.object({
  nodeId: z.string().trim().min(1).max(100).optional(),
});

const probeEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

function actorSubFor(request: FastifyRequest): string {
  const user = (request as AuthenticatedRequest).user;
  if (!user) return "unknown";
  return String(user.id);
}

export async function probesRoutes(fastify: FastifyInstance): Promise<void> {
  const authenticate = requireAuth();
  const requireOperator = requireRole("admin", "editor");

  // GET /probes/nodes
  fastify.get(
    "/probes/nodes",
    { preHandler: authenticate },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const nodes = await listProbeNodes();
      return reply.code(200).send({ nodes });
    },
  );

  // GET /probes/events
  fastify.get(
    "/probes/events",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = probeEventsQuerySchema.safeParse(request.query);
      const limit = parsed.success ? (parsed.data.limit ?? 25) : 25;
      const events = await listRecentProbeEvents(limit);
      return reply.code(200).send({ events });
    },
  );

  // POST /probes/run
  fastify.post(
    "/probes/run",
    { preHandler: [authenticate, requireOperator] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = probeRunInputSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: parsed.error.issues[0]?.message ?? "Invalid probe payload",
        });
      }

      const allNodes = await listProbeNodes();
      const enabledNodes = allNodes.filter((node) => node.enabled);
      const targetNodes = parsed.data.nodeId
        ? enabledNodes.filter((node) => node.id === parsed.data.nodeId)
        : enabledNodes;

      if (parsed.data.nodeId && targetNodes.length === 0) {
        return reply.code(404).send({ error: "unknown_node" });
      }

      const actorSub = actorSubFor(request);
      const probed: ProbeEvent[] = [];
      for (const node of targetNodes) {
        const result = await executeProbeForNode(node, actorSub);
        probed.push(result);
      }

      return reply.code(200).send({ probed });
    },
  );

  // Compatibility routes matching IGate NOC endpoints
  fastify.get(
    "/igate/status",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as AuthenticatedRequest).user;
      const [nodes, recentEvents] = await Promise.all([
        listProbeNodes(),
        listRecentProbeEvents(25),
      ]);
      return reply.code(200).send({
        service: "moonwitness-api",
        actor: {
          sub: String(user?.id ?? "unknown"),
          username: user?.username ?? "unknown",
          role: user?.role ?? "viewer",
        },
        nodes,
        recentEvents,
      });
    },
  );

  fastify.post(
    "/igate/probe",
    { preHandler: [authenticate, requireOperator] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = probeRunInputSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: parsed.error.issues[0]?.message ?? "Invalid probe payload",
        });
      }

      const allNodes = await listProbeNodes();
      const enabledNodes = allNodes.filter((node) => node.enabled);
      const targetNodes = parsed.data.nodeId
        ? enabledNodes.filter((node) => node.id === parsed.data.nodeId)
        : enabledNodes;

      if (parsed.data.nodeId && targetNodes.length === 0) {
        return reply.code(404).send({ error: "unknown_node" });
      }

      const actorSub = actorSubFor(request);
      const probed: ProbeEvent[] = [];
      for (const node of targetNodes) {
        const result = await executeProbeForNode(node, actorSub);
        probed.push(result);
      }

      return reply.code(200).send({ probed });
    },
  );
}
