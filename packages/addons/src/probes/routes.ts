import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  defaultFailClosedAuthBridge,
  resolveActorContextFromBridge,
  resolveActorTenantFromBridge,
  type BaseAddonAuthBridge,
} from "@moonwitness/addon-runtime";
import {
  executeProbeForNode,
  listProbeNodes,
  listRecentProbeEvents,
  type ProbeEvent,
} from "./service.js";

const probeRunInputSchema = z.object({
  nodeId: z.string().trim().min(1).max(100).optional(),
});

const probeEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function registerProbesRoutes(
  fastify: FastifyInstance,
  options: { auth?: BaseAddonAuthBridge } = {},
): Promise<void> {
  const auth = options.auth ?? defaultFailClosedAuthBridge;
  const requireOperator = auth.requireRole("admin", "editor");

  fastify.get(
    "/probes/nodes",
    { preHandler: auth.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = resolveActorTenantFromBridge(auth, request);
      const nodes = await listProbeNodes(tenantId);
      return reply.code(200).send({ nodes });
    },
  );

  fastify.get(
    "/probes/events",
    { preHandler: auth.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = probeEventsQuerySchema.safeParse(request.query);
      const limit = parsed.success ? (parsed.data.limit ?? 25) : 25;
      const tenantId = resolveActorTenantFromBridge(auth, request);
      const events = await listRecentProbeEvents(limit, tenantId);
      return reply.code(200).send({ events });
    },
  );

  fastify.post(
    "/probes/run",
    { preHandler: [auth.authenticate, requireOperator] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = probeRunInputSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: parsed.error.issues[0]?.message ?? "Invalid probe payload",
        });
      }

      const actor = resolveActorContextFromBridge(auth, request);
      const allNodes = await listProbeNodes(actor.tenantId);
      const enabledNodes = allNodes.filter((node) => node.enabled);
      const targetNodes = parsed.data.nodeId
        ? enabledNodes.filter((node) => node.id === parsed.data.nodeId)
        : enabledNodes;

      if (parsed.data.nodeId && targetNodes.length === 0) {
        return reply.code(404).send({ error: "unknown_node" });
      }

      const probed: ProbeEvent[] = [];
      for (const node of targetNodes) {
        const result = await executeProbeForNode(node, actor);
        probed.push(result);
      }

      return reply.code(200).send({ probed });
    },
  );

  // Compatibility routes matching IGate NOC endpoints
  fastify.get(
    "/igate/status",
    { preHandler: auth.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as { user?: { id?: unknown; username?: string; role?: string } }).user;
      const tenantId = resolveActorTenantFromBridge(auth, request);
      const [nodes, recentEvents] = await Promise.all([
        listProbeNodes(tenantId),
        listRecentProbeEvents(25, tenantId),
      ]);
      return reply.code(200).send({
        service: "moonwitness-api",
        actor: {
          sub: String(user?.id ?? auth.getActorId(request) ?? "unknown"),
          username: user?.username ?? "unknown",
          role: user?.role ?? auth.getActorRole(request),
        },
        nodes,
        recentEvents,
      });
    },
  );

  fastify.post(
    "/igate/probe",
    { preHandler: [auth.authenticate, requireOperator] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = probeRunInputSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: parsed.error.issues[0]?.message ?? "Invalid probe payload",
        });
      }

      const actor = resolveActorContextFromBridge(auth, request);
      const allNodes = await listProbeNodes(actor.tenantId);
      const enabledNodes = allNodes.filter((node) => node.enabled);
      const targetNodes = parsed.data.nodeId
        ? enabledNodes.filter((node) => node.id === parsed.data.nodeId)
        : enabledNodes;

      if (parsed.data.nodeId && targetNodes.length === 0) {
        return reply.code(404).send({ error: "unknown_node" });
      }

      const probed: ProbeEvent[] = [];
      for (const node of targetNodes) {
        const result = await executeProbeForNode(node, actor);
        probed.push(result);
      }

      return reply.code(200).send({ probed });
    },
  );
}
