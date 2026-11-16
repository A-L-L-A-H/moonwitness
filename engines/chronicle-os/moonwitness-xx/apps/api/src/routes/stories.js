import {
  CreateStoryRequestSchema,
  StoryListQuerySchema,
  StoryTransitionRequestSchema,
  UpdateStoryRequestSchema,
  successEnvelope,
  errorEnvelope
} from "@moonwitness/contracts";
import { validateStoryBlocks } from "@moonwitness/core";
import { AuthServiceError } from "@moonwitness/auth";

function requireAuth(request) {
  if (!request.authUser) {
    throw new AuthServiceError("UNAUTHENTICATED", "Authentication is required.", 401);
  }
  return request.authUser;
}

async function requirePermission(app, request, user, scope) {
  if (!request.em) throw new AuthServiceError("CONTENT_UNAVAILABLE", "Content storage is unavailable.", 503);
  await app.authorizationService.requirePermission(request.em, user.id, scope);
}

function publicAuthor(author) {
  return { handle: author.handle, displayName: author.displayName };
}

function publicStory(story) {
  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    subtitle: story.subtitle,
    status: story.status,
    contentBlocks: story.contentBlocks,
    author: publicAuthor(story.author),
    publishedAt: story.publishedAt?.toISOString() ?? null,
    updatedAt: story.updatedAt?.toISOString() ?? null
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

function publicEntity(entity) {
  return {
    id: entity.id,
    slug: entity.slug,
    displayName: entity.displayName,
    entityType: entity.entityType,
    summary: entity.summary
  };
}

const TRANSITION_PERMISSIONS = Object.freeze({
  draft: "stories.update.own",
  in_review: "stories.review",
  changes_requested: "stories.review",
  scheduled: "stories.publish",
  published: "stories.publish",
  archived: "stories.archive"
});

export async function storyRoutes(app) {
  app.get("/", { schema: { querystring: StoryListQuerySchema } }, async (request) => {
    const repositories = app.repositoryFactory(request);
    const { limit = 20, offset = 0, q } = request.query;
    const { items, total } = await repositories.stories.listPublic({ limit, offset, q });
    return successEnvelope({
      items: items.map(publicStory),
      pagination: { limit, offset, total }
    }, { requestId: request.id });
  });

  app.get("/mine", { schema: { querystring: StoryListQuerySchema } }, async (request) => {
    const user = requireAuth(request);
    await requirePermission(app, request, user, "stories.read");
    const repositories = app.repositoryFactory(request);
    const { limit = 20, offset = 0 } = request.query;
    const { items, total } = await repositories.stories.listMine(user.id, { limit, offset });
    return successEnvelope({
      items: items.map((story) => ({
        id: story.id,
        slug: story.slug,
        title: story.title,
        subtitle: story.subtitle,
        status: story.status,
        updatedAt: story.updatedAt?.toISOString() ?? null
      })),
      pagination: { limit, offset, total }
    }, { requestId: request.id });
  });

  app.post("/", { schema: { body: CreateStoryRequestSchema } }, async (request, reply) => {
    const user = requireAuth(request);
    await requirePermission(app, request, user, "stories.create");
    validateStoryBlocks(request.body.contentBlocks);
    const repositories = app.repositoryFactory(request);
    const story = await repositories.stories.createDraft(user.id, request.body, request.id);
    return reply.code(201).send(successEnvelope({
      id: story.id,
      slug: story.slug,
      title: story.title,
      subtitle: story.subtitle,
      status: story.status
    }, { requestId: request.id }));
  });

  app.patch("/:id", { schema: { body: UpdateStoryRequestSchema } }, async (request) => {
    const user = requireAuth(request);
    await requirePermission(app, request, user, "stories.update.own");
    if (request.body.contentBlocks) validateStoryBlocks(request.body.contentBlocks);
    const repositories = app.repositoryFactory(request);
    const story = await repositories.stories.updateDraft(user.id, request.params.id, request.body, request.id);
    return successEnvelope({
      id: story.id,
      slug: story.slug,
      title: story.title,
      subtitle: story.subtitle,
      status: story.status
    }, { requestId: request.id });
  });

  app.post("/:id/submit", async (request) => {
    const user = requireAuth(request);
    await requirePermission(app, request, user, "stories.submit.own");
    const repositories = app.repositoryFactory(request);
    const story = await repositories.stories.submitForReview(user.id, request.params.id, request.id);
    return successEnvelope({
      id: story.id,
      slug: story.slug,
      status: story.status
    }, { requestId: request.id });
  });

  app.post("/:id/transition", {
    schema: { body: StoryTransitionRequestSchema }
  }, async (request) => {
    const user = requireAuth(request);
    const permission = TRANSITION_PERMISSIONS[request.body.to];
    if (!permission) throw new AuthServiceError("INVALID_STORY_TRANSITION", "The requested transition is not supported.", 422);
    await requirePermission(app, request, user, permission);
    const repositories = app.repositoryFactory(request);
    const story = await repositories.stories.transition(
      user.id,
      request.params.id,
      request.body.to,
      request.body.reason,
      request.id
    );
    return successEnvelope({
      id: story.id,
      slug: story.slug,
      status: story.status,
      publishedAt: story.publishedAt?.toISOString() ?? null
    }, { requestId: request.id });
  });

  app.get("/:slug", async (request, reply) => {
    const repositories = app.repositoryFactory(request);
    const story = await repositories.stories.findPublicBySlug(request.params.slug);
    if (!story) {
      return reply.code(404).send(errorEnvelope("STORY_NOT_FOUND", "Story was not found.", request.id));
    }

    const sourceIds = [...new Set((story.contentBlocks ?? []).flatMap((block) => block.sourceIds ?? []))];
    const [sources, entities] = await Promise.all([
      repositories.sources.listByIds(sourceIds),
      repositories.entities.listForStory(story.id)
    ]);
    return successEnvelope({
      ...publicStory(story),
      sources: sources.map(publicSource),
      entities: entities.map(publicEntity)
    }, { requestId: request.id });
  });
}
