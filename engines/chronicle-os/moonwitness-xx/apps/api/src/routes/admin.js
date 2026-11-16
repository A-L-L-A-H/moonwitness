import { AuditListQuerySchema, UserRoleGrantSchema, successEnvelope } from "@moonwitness/contracts";
import { AuthServiceError } from "@moonwitness/auth";

function requireAdminContext(request) {
  if (!request.authUser) throw new AuthServiceError("UNAUTHENTICATED", "Authentication is required.", 401);
  if (!request.em) throw new AuthServiceError("AUTH_UNAVAILABLE", "Authorization storage is unavailable.", 503);
  return request.authUser;
}

export async function adminRoutes(app) {

  app.get("/audit", { schema: { querystring: AuditListQuerySchema } }, async (request) => {
    const actor = requireAdminContext(request);
    await app.authorizationService.requirePermission(request.em, actor.id, "audit.read");
    const repositories = app.repositoryFactory(request);
    const { limit = 50, offset = 0, subjectType, subjectId, action } = request.query;

    if (Boolean(subjectType) !== Boolean(subjectId)) {
      throw new AuthServiceError("INVALID_AUDIT_FILTER", "subjectType and subjectId must be supplied together.", 422);
    }

    const result = subjectType
      ? await repositories.audits.listBySubject(subjectType, subjectId, { limit, offset })
      : await repositories.audits.listRecent({ limit, offset, action });

    return successEnvelope({
      items: result.items.map((event) => ({
        id: event.id,
        action: event.action,
        subjectType: event.subjectType,
        subjectId: event.subjectId,
        requestId: event.requestId,
        metadata: event.metadata,
        createdAt: event.createdAt.toISOString(),
        actor: event.actor ? {
          id: event.actor.id,
          handle: event.actor.handle,
          displayName: event.actor.displayName
        } : null
      })),
      pagination: { limit, offset, total: result.total }
    }, { requestId: request.id });
  });

  app.get("/users/:userId/access", async (request) => {
    const actor = requireAdminContext(request);
    await app.authorizationService.requirePermission(request.em, actor.id, "users.roles.manage");
    return successEnvelope(
      await app.authorizationService.listUserAccess(request.em, request.params.userId),
      { requestId: request.id }
    );
  });

  app.post("/users/:userId/roles", { schema: { body: UserRoleGrantSchema } }, async (request, reply) => {
    const actor = requireAdminContext(request);
    const assignment = await app.authorizationService.grantRole(request.em, {
      actorId: actor.id,
      userId: request.params.userId,
      roleName: request.body.roleName,
      requestId: request.id
    });

    return reply.code(201).send(successEnvelope({
      userId: request.params.userId,
      roleName: request.body.roleName,
      grantedAt: assignment.grantedAt?.toISOString() ?? null
    }, { requestId: request.id }));
  });

  app.delete("/users/:userId/roles/:roleName", async (request) => {
    const actor = requireAdminContext(request);
    const revoked = await app.authorizationService.revokeRole(request.em, {
      actorId: actor.id,
      userId: request.params.userId,
      roleName: request.params.roleName,
      requestId: request.id
    });
    return successEnvelope({ revoked }, { requestId: request.id });
  });
}
