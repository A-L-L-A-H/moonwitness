import { CreateSourceReferenceSchema, successEnvelope } from "@moonwitness/contracts";
import { AuthServiceError } from "@moonwitness/auth";

export async function sourceRoutes(app) {
  app.post("/", { schema: { body: CreateSourceReferenceSchema } }, async (request, reply) => {
    if (!request.authUser) throw new AuthServiceError("UNAUTHENTICATED", "Authentication is required.", 401);
    if (!request.em) throw new AuthServiceError("CONTENT_UNAVAILABLE", "Content storage is unavailable.", 503);
    await app.authorizationService.requirePermission(request.em, request.authUser.id, "sources.create");
    const repositories = app.repositoryFactory(request);
    const source = await repositories.sources.create(request.authUser.id, request.body);
    return reply.code(201).send(successEnvelope({
      id: source.id,
      title: source.title,
      url: source.url,
      authorName: source.authorName,
      publisher: source.publisher,
      sourceType: source.sourceType,
      accessedAt: source.accessedAt?.toISOString() ?? null
    }, { requestId: request.id }));
  });
}
