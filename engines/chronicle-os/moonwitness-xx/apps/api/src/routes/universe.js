import { errorEnvelope, successEnvelope } from "@moonwitness/contracts";

function publicEntity(entity) {
  return {
    id: entity.id,
    slug: entity.slug,
    displayName: entity.displayName,
    entityType: entity.entityType,
    summary: entity.summary
  };
}

function publicStory(story) {
  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    subtitle: story.subtitle,
    author: {
      handle: story.author.handle,
      displayName: story.author.displayName
    },
    publishedAt: story.publishedAt?.toISOString() ?? null
  };
}

export async function universeRoutes(app) {
  app.get("/", async (request) => {
    const repositories = app.repositoryFactory(request);
    const entities = await repositories.entities.listPublic();

    return successEnvelope({
      items: entities.map(publicEntity),
      total: entities.length
    }, { requestId: request.id });
  });

  app.get("/:slug", async (request, reply) => {
    const repositories = app.repositoryFactory(request);
    const entity = await repositories.entities.findBySlug(request.params.slug);

    if (!entity) {
      return reply.code(404).send(errorEnvelope("ENTITY_NOT_FOUND", "Universe entity was not found.", request.id));
    }

    const stories = await repositories.entities.listPublishedStoriesForEntity(entity.id);

    return successEnvelope({
      ...publicEntity(entity),
      works: stories.map(publicStory)
    }, { requestId: request.id });
  });
}
