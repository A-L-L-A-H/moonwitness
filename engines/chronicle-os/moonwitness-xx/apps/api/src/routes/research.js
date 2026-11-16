import {
  CreateResearchDossierSchema,
  StoryListQuerySchema,
  successEnvelope,
  errorEnvelope
} from "@moonwitness/contracts";
import { AuthServiceError } from "@moonwitness/auth";

function requireAuth(request) {
  if (!request.authUser) throw new AuthServiceError("UNAUTHENTICATED", "Authentication is required.", 401);
  return request.authUser;
}

async function requirePermission(app, request, user, scope) {
  if (!request.em) throw new AuthServiceError("CONTENT_UNAVAILABLE", "Content storage is unavailable.", 503);
  await app.authorizationService.requirePermission(request.em, user.id, scope);
}

function publicDossier(dossier) {
  return {
    id: dossier.id,
    slug: dossier.slug,
    title: dossier.title,
    question: dossier.question,
    scope: dossier.scope,
    methodologyNote: dossier.methodologyNote,
    status: dossier.status,
    findings: dossier.findings ?? [],
    limitations: dossier.limitations ?? [],
    nextQuestions: dossier.nextQuestions ?? [],
    publishedAt: dossier.publishedAt?.toISOString() ?? null,
    author: { handle: dossier.author.handle, displayName: dossier.author.displayName }
  };
}

function publicSource(source) {
  return {
    id: source.id,
    title: source.title,
    url: source.url,
    authorName: source.authorName,
    publisher: source.publisher,
    sourceType: source.sourceType,
    accessedAt: source.accessedAt?.toISOString() ?? null
  };
}

export async function researchRoutes(app) {
  app.post("/", { schema: { body: CreateResearchDossierSchema } }, async (request, reply) => {
    const user = requireAuth(request);
    await requirePermission(app, request, user, "research.create");
    const repositories = app.repositoryFactory(request);
    const dossier = await repositories.research.createDraft(user.id, request.body, request.id);
    return reply.code(201).send(successEnvelope({
      id: dossier.id,
      slug: dossier.slug,
      title: dossier.title,
      status: dossier.status
    }, { requestId: request.id }));
  });

  app.get("/mine", { schema: { querystring: StoryListQuerySchema } }, async (request) => {
    const user = requireAuth(request);
    await requirePermission(app, request, user, "research.read");
    const repositories = app.repositoryFactory(request);
    const { limit = 20, offset = 0 } = request.query;
    const { items, total } = await repositories.research.listMine(user.id, { limit, offset });
    return successEnvelope({
      items: items.map((dossier) => ({
        id: dossier.id,
        slug: dossier.slug,
        title: dossier.title,
        question: dossier.question,
        status: dossier.status,
        updatedAt: dossier.updatedAt?.toISOString() ?? null
      })),
      pagination: { limit, offset, total }
    }, { requestId: request.id });
  });

  app.get("/:slug", async (request, reply) => {
    const repositories = app.repositoryFactory(request);
    const dossier = await repositories.research.findPublicBySlug(request.params.slug);
    if (!dossier) {
      return reply.code(404).send(errorEnvelope("RESEARCH_NOT_FOUND", "Research dossier was not found.", request.id));
    }

    const claims = await repositories.research.findClaims(dossier.id);
    const links = await repositories.research.findClaimSources(claims.map((claim) => claim.id));
    const linksByClaim = new Map();

    for (const link of links) {
      const claimId = link.claim.id;
      if (!linksByClaim.has(claimId)) linksByClaim.set(claimId, []);
      linksByClaim.get(claimId).push({
        relationType: link.relationType,
        note: link.note,
        source: publicSource(link.sourceReference)
      });
    }

    return successEnvelope({
      ...publicDossier(dossier),
      claims: claims.map((claim) => ({
        id: claim.id,
        statement: claim.statement,
        classification: claim.classification,
        status: claim.status,
        notes: claim.notes,
        sources: linksByClaim.get(claim.id) ?? []
      }))
    }, { requestId: request.id });
  });
}
