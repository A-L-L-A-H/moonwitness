import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  defaultFailClosedAuthBridge,
  resolveActorContextFromBridge,
  type BaseAddonAuthBridge,
} from "@moonwitness/addon-runtime";
import {
  commandCenterIdParamSchema,
  createCommandCenterWorkflow,
  createWorkflowInputSchema,
  dismissCommandCenterAlert,
  getCommandCenterState,
  getCommandCenterStats,
  toggleCommandCenterWorkflow,
  transitionCommandCenterWorkflow,
  workflowStatusSchema,
} from "./service.js";

export async function registerCommandCenterRoutes(
  fastify: FastifyInstance,
  options: { auth?: BaseAddonAuthBridge } = {},
): Promise<void> {
  const auth = options.auth ?? defaultFailClosedAuthBridge;
  const requireOperator = auth.requireRole("admin", "editor");

  fastify.get(
    "/command-center/state",
    { preHandler: auth.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!auth.getActorId(request)) {
        return reply.code(401).send({ error: "Not authenticated" });
      }
      const actor = resolveActorContextFromBridge(auth, request);
      const state = await getCommandCenterState(actor);
      return reply.code(200).send(state);
    },
  );

  fastify.get(
    "/command-center/stats",
    { preHandler: auth.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!auth.getActorId(request)) {
        return reply.code(401).send({ error: "Not authenticated" });
      }
      const actor = resolveActorContextFromBridge(auth, request);
      const stats = await getCommandCenterStats(actor);
      return reply.code(200).send(stats);
    },
  );

  fastify.post(
    "/command-center/workflows",
    { preHandler: [auth.authenticate, requireOperator] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!auth.getActorId(request)) {
        return reply.code(401).send({ error: "Not authenticated" });
      }
      const parsed = createWorkflowInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: parsed.error.issues[0]?.message ?? "Invalid workflow payload",
        });
      }
      const actor = resolveActorContextFromBridge(auth, request);
      const workflow = await createCommandCenterWorkflow(actor, parsed.data);
      return reply.code(201).send({ workflow });
    },
  );

  fastify.patch<{ Params: { id: string } }>(
    "/command-center/workflows/:id/toggle",
    { preHandler: [auth.authenticate, requireOperator] },
    async (request, reply) => {
      if (!auth.getActorId(request)) {
        return reply.code(401).send({ error: "Not authenticated" });
      }
      const params = commandCenterIdParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: "Invalid workflow identifier" });
      }
      const actor = resolveActorContextFromBridge(auth, request);
      const workflow = await toggleCommandCenterWorkflow(actor, params.data.id);
      if (!workflow) {
        return reply.code(404).send({ error: "Workflow not found" });
      }
      return reply.code(200).send({ workflow });
    },
  );

  fastify.patch<{ Params: { id: string }; Body: { status?: string } }>(
    "/command-center/workflows/:id/status",
    { preHandler: [auth.authenticate, requireOperator] },
    async (request, reply) => {
      if (!auth.getActorId(request)) {
        return reply.code(401).send({ error: "Not authenticated" });
      }
      const params = commandCenterIdParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: "Invalid workflow identifier" });
      }
      const parsedStatus = workflowStatusSchema.safeParse(request.body?.status);
      if (!parsedStatus.success) {
        return reply.code(400).send({ error: "Invalid workflow status" });
      }
      const actor = resolveActorContextFromBridge(auth, request);
      try {
        const workflow = await transitionCommandCenterWorkflow(
          actor,
          params.data.id,
          parsedStatus.data,
        );
        if (!workflow) {
          return reply.code(404).send({ error: "Workflow not found" });
        }
        return reply.code(200).send({ workflow });
      } catch (error) {
        if (
          error instanceof Error &&
          (error as Error & { statusCode?: number }).statusCode === 409
        ) {
          return reply.code(409).send({ error: error.message });
        }
        throw error;
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/command-center/alerts/:id",
    { preHandler: [auth.authenticate, requireOperator] },
    async (request, reply) => {
      if (!auth.getActorId(request)) {
        return reply.code(401).send({ error: "Not authenticated" });
      }
      const params = commandCenterIdParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: "Invalid alert identifier" });
      }
      const actor = resolveActorContextFromBridge(auth, request);
      const dismissed = await dismissCommandCenterAlert(actor, params.data.id);
      if (!dismissed) {
        return reply.code(404).send({ error: "Alert not found" });
      }
      return reply.code(200).send({ dismissed: true, id: params.data.id });
    },
  );
}
