import test from "node:test";
import assert from "node:assert/strict";
import { createStoryRepository } from "../src/repositories.js";
import { AuditEvent, OutboxMessage, Story, User } from "../src/entities.js";

const actorId = "11111111-1111-4111-8111-111111111111";
const storyId = "22222222-2222-4222-8222-222222222222";

function createHarness(status = "in_review") {
  const story = {
    id: storyId,
    slug: "test-story",
    status,
    publishedAt: null
  };
  const persisted = [];
  const tx = {
    transactional: async (callback) => callback(tx),
    findOne: async (entity) => entity === Story ? story : null,
    getReference: (_entity, id) => ({ id }),
    create: (_entity, data) => ({ ...data }),
    persist: (entity) => {
      persisted.push(entity);
      return { flush: async () => {} };
    },
    flush: async () => {}
  };
  return { repository: createStoryRepository(tx), story, persisted };
}

test("publishing a story atomically changes status, publication time, audit and outbox", async () => {
  const { repository, story, persisted } = createHarness();
  const result = await repository.transition(actorId, storyId, "published", "Approved by editor", "request-1");

  assert.equal(result.status, "published");
  assert.ok(result.publishedAt instanceof Date);
  const audit = persisted.find((entry) => entry.action === "story.status_changed");
  assert.deepEqual(audit.metadata, {
    from: "in_review",
    to: "published",
    reason: "Approved by editor"
  });
  const event = persisted.find((entry) => entry.eventType === "story.status_changed");
  assert.deepEqual(event.payload, {
    storyId,
    actorId,
    from: "in_review",
    to: "published"
  });
});

test("invalid transitions are rejected without changing the story", async () => {
  const { repository, story, persisted } = createHarness("draft");
  await assert.rejects(
    () => repository.transition(actorId, storyId, "published", undefined, "request-2"),
    (error) => error.code === "INVALID_STORY_TRANSITION" && error.statusCode === 409
  );
  assert.equal(story.status, "draft");
  assert.equal(persisted.length, 0);
});

test("archiving a published story preserves its publication timestamp", async () => {
  const { repository, story } = createHarness("published");
  const original = new Date("2026-11-10T10:00:00.000Z");
  story.publishedAt = original;

  await repository.transition(actorId, storyId, "archived", "Withdrawn", "request-3");
  assert.equal(story.status, "archived");
  assert.equal(story.publishedAt, original);
});
