import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requireAuth, type AuthenticatedRequest } from "../../middleware/auth";
import {
  commandCenterIdParamSchema,
  createCommandCenterWorkflow,
  createWorkflowInputSchema,
  dismissCommandCenterAlert,
  ensureCommandCenterSchema,
  getCommandCenterState,
  toggleCommandCenterWorkflow,
} from "./command-center.persistence";

function actorIdFor(request: FastifyRequest): string | null {
  const user = (request as AuthenticatedRequest).user;
  if (!user) return null;
  return String(user.id);
}

export async function commandCenterRoutes(fastify: FastifyInstance): Promise<void> {
  const authenticate = requireAuth();

  fastify.get(
    "/command-center/state",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const actorId = actorIdFor(request);
      if (!actorId) return reply.code(401).send({ error: "Not authenticated" });
      await ensureCommandCenterSchema();
      const state = await getCommandCenterState(actorId);
      return reply.code(200).send(state);
    },
  );

  fastify.post(
    "/command-center/workflows",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const actorId = actorIdFor(request);
      if (!actorId) return reply.code(401).send({ error: "Not authenticated" });
      const parsed = createWorkflowInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: parsed.error.issues[0]?.message ?? "Invalid workflow payload",
        });
      }
      await ensureCommandCenterSchema();
      const workflow = await createCommandCenterWorkflow(actorId, parsed.data);
      return reply.code(201).send({ workflow });
    },
  );

  fastify.patch<{ Params: { id: string } }>(
    "/command-center/workflows/:id/toggle",
    { preHandler: authenticate },
    async (request, reply) => {
      const actorId = actorIdFor(request);
      if (!actorId) return reply.code(401).send({ error: "Not authenticated" });
      const params = commandCenterIdParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: "Invalid workflow identifier" });
      }
      await ensureCommandCenterSchema();
      const workflow = await toggleCommandCenterWorkflow(actorId, params.data.id);
      if (!workflow) {
        return reply.code(404).send({ error: "Workflow not found" });
      }
      return reply.code(200).send({ workflow });
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/command-center/alerts/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const actorId = actorIdFor(request);
      if (!actorId) return reply.code(401).send({ error: "Not authenticated" });
      const params = commandCenterIdParamSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: "Invalid alert identifier" });
      }
      await ensureCommandCenterSchema();
      const dismissed = await dismissCommandCenterAlert(actorId, params.data.id);
      if (!dismissed) {
        return reply.code(404).send({ error: "Alert not found" });
      }
      return reply.code(200).send({ dismissed: true, id: params.data.id });
    },
  );
}
