import test from "node:test";
import assert from "node:assert/strict";
import { AuditEvent } from "../src/entities.js";
import { createAuditRepository, sanitizeAuditMetadata } from "../src/audit.js";

test("audit metadata rejects credentials and message content", () => {
  assert.throws(() => sanitizeAuditMetadata({ passwordHash: "secret" }), /Sensitive audit metadata/);
  assert.throws(() => sanitizeAuditMetadata({ messageBody: "private content" }), /Sensitive audit metadata/);
  assert.deepEqual(sanitizeAuditMetadata({ status: "published", count: 2 }), {
    status: "published",
    count: 2
  });
});

test("audit repository appends normalized immutable-shaped events and paginates queries", async () => {
  const store = [];
  const em = {
    create(Entity, data) { return Object.assign(new Entity(), data); },
    getReference(_Entity, id) { return { id }; },
    persist(entity) {
      return {
        flush: async () => { store.push(entity); }
      };
    },
    async findAndCount(Entity, where, options) {
      assert.equal(Entity, AuditEvent);
      return [store.filter(item => !where.action || item.action === where.action), store.length];
    }
  };

  const audit = createAuditRepository(em);
  const event = await audit.append({
    actorId: "user-1",
    action: "story.published",
    subjectType: "story",
    subjectId: "story-1",
    requestId: "req-1",
    metadata: { status: "published" }
  });

  assert.equal(event.actor.id, "user-1");
  assert.equal(event.metadata.password, undefined);
  const result = await audit.listRecent({ limit: 20, offset: 0 });
  assert.equal(result.total, 1);
  assert.equal(result.items[0].action, "story.published");
  await assert.rejects(() => audit.append({
    action: "story.published",
    subjectType: "story",
    subjectId: "story-1",
    metadata: { authToken: "do-not-store" }
  }), /Sensitive audit metadata/);
});
