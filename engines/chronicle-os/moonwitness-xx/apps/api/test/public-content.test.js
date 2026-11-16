import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";

const author = {
  id: "user-1",
  handle: "writer",
  displayName: "Writer",
  email: "private@example.com"
};
const publishedAt = new Date("2026-11-10T12:00:00.000Z");

function createRepositoryFactory() {
  const source = {
    id: "source-1",
    title: "Research paper",
    url: "https://example.org/paper",
    authorName: "Author",
    publisher: "Publisher",
    sourceType: "paper",
    accessedAt: null
  };
  const story = {
    id: "story-1",
    slug: "night-message",
    title: "Night Message",
    subtitle: null,
    status: "published",
    contentBlocks: [{
      id: "block-1",
      type: "paragraph",
      provenance: "SOURCED",
      text: "A referenced passage.",
      sourceIds: ["source-1"]
    }],
    author,
    publishedAt,
    updatedAt: publishedAt
  };
  const dossier = {
    id: "dossier-1",
    slug: "sound-and-light",
    title: "Sound and Light",
    question: "What can be observed?",
    scope: "A limited sample.",
    methodologyNote: null,
    status: "published",
    findings: [],
    limitations: ["Small sample"],
    nextQuestions: ["What next?"],
    publishedAt,
    author
  };
  const claim = {
    id: "claim-1",
    statement: "A sourced statement.",
    classification: "sourced_claim",
    status: "working",
    notes: null
  };
  const entity = {
    id: "entity-1",
    slug: "rocksoul",
    displayName: "ROCKSOUL",
    entityType: "story_world",
    summary: "Human Pen story world"
  };

  return () => ({
    stories: {
      listPublic: async () => ({ items: [story], total: 1 }),
      listMine: async () => ({ items: [], total: 0 }),
      findPublicBySlug: async (slug) => slug === story.slug ? story : null,
      createDraft: async (userId, input) => ({ id: "draft-1", slug: "new-story", ...input, author: { id: userId } }),
      updateDraft: async (_userId, id, input) => ({ id, slug: "new-story", ...input }),
      submitForReview: async (_userId, id) => ({ id, slug: "new-story", status: "in_review" })
    },
    sources: {
      listByIds: async (ids) => ids.includes(source.id) ? [source] : [],
      create: async (_authorId, input) => ({ id: "source-new", ...input, sourceType: input.sourceType ?? "other", accessedAt: null })
    },
    entities: {
      listPublic: async () => [entity],
      findBySlug: async (slug) => slug === entity.slug ? entity : null,
      listForStory: async () => [entity],
      listPublishedStoriesForEntity: async () => [story]
    },
    research: {
      createDraft: async (_userId, input) => ({ id: "dossier-new", slug: "new-research", ...input, status: "draft" }),
      listMine: async () => ({ items: [], total: 0 }),
      findPublicBySlug: async (slug) => slug === dossier.slug ? dossier : null,
      findClaims: async () => [claim],
      findClaimSources: async () => [{
        claim,
        sourceReference: source,
        relationType: "supports",
        note: null
      }]
    }
  });
}

async function createTestApp() {
  return buildApp({ repositoryFactory: createRepositoryFactory() });
}

test("public story list excludes author private fields", async () => {
  const app = await createTestApp();
  try {
    const response = await app.inject({ method: "GET", url: "/api/v1/stories" });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().data.items[0].title, "Night Message");
    assert.equal(response.json().data.items[0].author.handle, "writer");
    assert.equal(response.json().data.items[0].author.email, undefined);
    assert.equal(response.json().data.pagination.total, 1);
  } finally {
    await app.close();
  }
});

test("public story detail returns provenance and linked source metadata", async () => {
  const app = await createTestApp();
  try {
    const response = await app.inject({ method: "GET", url: "/api/v1/stories/night-message" });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().data.contentBlocks[0].provenance, "SOURCED");
    assert.equal(response.json().data.sources[0].url, "https://example.org/paper");
    assert.equal(response.json().data.entities[0].slug, "rocksoul");
  } finally {
    await app.close();
  }
});

test("non-public story slugs return 404", async () => {
  const app = await createTestApp();
  try {
    const response = await app.inject({ method: "GET", url: "/api/v1/stories/draft-story" });
    assert.equal(response.statusCode, 404);
    assert.equal(response.json().error.code, "STORY_NOT_FOUND");
  } finally {
    await app.close();
  }
});

test("research detail preserves claim classifications and source relationships", async () => {
  const app = await createTestApp();
  try {
    const response = await app.inject({ method: "GET", url: "/api/v1/research/sound-and-light" });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().data.claims[0].classification, "sourced_claim");
    assert.equal(response.json().data.claims[0].sources[0].relationType, "supports");
  } finally {
    await app.close();
  }
});

test("universe index and entity detail expose curated entities and published works", async () => {
  const app = await createTestApp();
  try {
    const index = await app.inject({ method: "GET", url: "/api/v1/universe" });
    const detail = await app.inject({ method: "GET", url: "/api/v1/universe/rocksoul" });

    assert.equal(index.statusCode, 200);
    assert.equal(index.json().data.items[0].displayName, "ROCKSOUL");
    assert.equal(detail.statusCode, 200);
    assert.equal(detail.json().data.works[0].slug, "night-message");
  } finally {
    await app.close();
  }
});
