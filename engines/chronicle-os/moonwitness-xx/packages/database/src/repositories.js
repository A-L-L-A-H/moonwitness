import { randomUUID } from "node:crypto";
import { STORY_TRANSITIONS } from "@moonwitness/contracts";
import { createOutboxRepository } from "./outbox.js";
import {
  AuditEvent,
  CreativeEntity,
  ResearchClaim,
  ResearchClaimSource,
  ResearchDossier,
  SourceReference,
  Story,
  StoryBlockSource,
  StoryCreativeEntity,
  User
} from "./entities.js";

export class RepositoryError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = "RepositoryError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function slugBase(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150) || "entry";
}

function normalizeHttpUrl(input) {
  let parsed;

  try {
    parsed = new URL(input);
  } catch {
    throw new RepositoryError("INVALID_SOURCE_URL", "Source URL must be a valid HTTP or HTTPS URL.", 422);
  }

  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new RepositoryError("INVALID_SOURCE_URL", "Only HTTP and HTTPS source URLs are accepted.", 422);
  }

  parsed.hash = "";
  if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  return parsed.toString();
}

function unique(values) {
  return [...new Set((values ?? []).filter(Boolean))];
}

function sourceIdsFromBlocks(blocks) {
  return unique(blocks.flatMap((block) => block.sourceIds ?? []));
}

async function assertSourcesExist(em, ids) {
  if (!ids.length) return [];

  const sources = await em.find(SourceReference, { id: { $in: ids } });
  if (sources.length !== ids.length) {
    throw new RepositoryError(
      "SOURCE_REFERENCE_NOT_FOUND",
      "One or more source references do not exist.",
      422
    );
  }

  return sources;
}

async function replaceStoryBlockSources(em, story, blocks, sourcesById) {
  const existing = await em.find(StoryBlockSource, { story: story.id });
  if (existing.length) em.remove(existing);

  const links = [];
  for (const block of blocks) {
    for (const sourceId of unique(block.sourceIds)) {
      const sourceReference = sourcesById.get(sourceId);
      if (!sourceReference) {
        throw new RepositoryError("SOURCE_REFERENCE_NOT_FOUND", "A story block references a missing source.", 422);
      }

      links.push(em.create(StoryBlockSource, {
        id: randomUUID(),
        story,
        sourceReference,
        blockId: block.id
      }));
    }
  }

  if (links.length) em.persist(links);
}

export function createSourceReferenceRepository(em) {
  return Object.freeze({
    async create(authorId, input) {
      const normalizedUrl = normalizeHttpUrl(input.url);
      const existing = await em.findOne(SourceReference, { normalizedUrl });
      if (existing) return existing;

      const source = em.create(SourceReference, {
        id: randomUUID(),
        createdBy: authorId ? em.getReference(User, authorId) : null,
        title: input.title.trim(),
        url: input.url.trim(),
        normalizedUrl,
        authorName: input.authorName?.trim() || null,
        publisher: input.publisher?.trim() || null,
        sourceType: input.sourceType ?? "other",
        accessedAt: input.accessedAt ? new Date(input.accessedAt) : null,
        metadata: {}
      });

      try {
        await em.persist(source).flush();
        return source;
      } catch (error) {
        if (error?.code === "23505" || error?.name === "UniqueConstraintViolationException") {
          const raced = await em.findOne(SourceReference, { normalizedUrl });
          if (raced) return raced;
        }
        throw error;
      }
    },

    async findById(id) {
      return em.findOne(SourceReference, { id });
    },

    async listByIds(ids) {
      const sourceIds = unique(ids);
      if (!sourceIds.length) return [];
      return em.find(SourceReference, { id: { $in: sourceIds } }, { orderBy: { title: "ASC" } });
    }
  });
}

export function createStoryRepository(em) {
  async function createDraft(authorId, input, requestId) {
    const blocks = input.contentBlocks ?? [];
    const sourceIds = sourceIdsFromBlocks(blocks);

    return em.transactional(async (tx) => {
      const sources = await assertSourcesExist(tx, sourceIds);
      const sourcesById = new Map(sources.map((source) => [source.id, source]));
      const story = tx.create(Story, {
        id: randomUUID(),
        author: tx.getReference(User, authorId),
        slug: `${slugBase(input.title)}-${randomUUID().slice(0, 8)}`,
        title: input.title.trim(),
        subtitle: input.subtitle?.trim() || null,
        status: "draft",
        contentBlocks: blocks,
        publishedAt: null
      });

      await tx.persist(story).flush();
      await replaceStoryBlockSources(tx, story, blocks, sourcesById);

      tx.persist(tx.create(AuditEvent, {
        id: randomUUID(),
        actor: tx.getReference(User, authorId),
        action: "story.created",
        subjectType: "story",
        subjectId: story.id,
        requestId: requestId ?? null,
        metadata: { status: "draft" }
      }));

      await createOutboxRepository(tx).append({
        eventType: "story.created",
        schemaVersion: 1,
        payload: { storyId: story.id, authorId },
        correlationId: requestId ?? randomUUID(),
        idempotencyKey: requestId ? `story.created:${story.id}:${requestId}` : null
      });

      await tx.flush();
      return story;
    });
  }

  async function updateDraft(authorId, storyId, input, requestId) {
    return em.transactional(async (tx) => {
      const story = await tx.findOne(Story, { id: storyId, author: authorId });
      if (!story) throw new RepositoryError("STORY_NOT_FOUND", "Story was not found.", 404);
      if (!["draft", "changes_requested"].includes(story.status)) {
        throw new RepositoryError("STORY_NOT_EDITABLE", "This story can no longer be edited in its current state.", 409);
      }

      const nextBlocks = input.contentBlocks ?? story.contentBlocks;
      const sourceIds = sourceIdsFromBlocks(nextBlocks);
      const sources = await assertSourcesExist(tx, sourceIds);
      const sourcesById = new Map(sources.map((source) => [source.id, source]));

      if (input.title !== undefined) story.title = input.title.trim();
      if (input.subtitle !== undefined) story.subtitle = input.subtitle.trim() || null;
      if (input.contentBlocks !== undefined) {
        story.contentBlocks = nextBlocks;
        await replaceStoryBlockSources(tx, story, nextBlocks, sourcesById);
      }

      await tx.flush();
      tx.persist(tx.create(AuditEvent, {
        id: randomUUID(),
        actor: tx.getReference(User, authorId),
        action: "story.updated",
        subjectType: "story",
        subjectId: story.id,
        requestId: requestId ?? null,
        metadata: { status: story.status }
      }));
      await createOutboxRepository(tx).append({
        eventType: "story.updated",
        schemaVersion: 1,
        payload: { storyId: story.id, authorId },
        correlationId: requestId ?? randomUUID(),
        idempotencyKey: requestId ? `story.updated:${story.id}:${requestId}` : null
      });
      await tx.flush();
      return story;
    });
  }

  async function submitForReview(authorId, storyId, requestId) {
    return em.transactional(async (tx) => {
      const story = await tx.findOne(Story, { id: storyId, author: authorId });
      if (!story) throw new RepositoryError("STORY_NOT_FOUND", "Story was not found.", 404);
      if (story.status !== "draft" && story.status !== "changes_requested") {
        throw new RepositoryError("INVALID_STORY_TRANSITION", "Only drafts or requested changes can be submitted.", 409);
      }

      const previousStatus = story.status;
      story.status = "in_review";
      await tx.flush();
      tx.persist(tx.create(AuditEvent, {
        id: randomUUID(),
        actor: tx.getReference(User, authorId),
        action: "story.submitted_for_review",
        subjectType: "story",
        subjectId: story.id,
        requestId: requestId ?? null,
        metadata: { from: previousStatus, to: "in_review" }
      }));
      await createOutboxRepository(tx).append({
        eventType: "story.submitted_for_review",
        schemaVersion: 1,
        payload: { storyId: story.id, authorId, previousStatus },
        correlationId: requestId ?? randomUUID(),
        idempotencyKey: requestId ? `story.submitted_for_review:${story.id}:${requestId}` : null
      });
      await tx.flush();
      return story;
    });
  }

  async function transition(actorId, storyId, to, reason, requestId) {
    return em.transactional(async (tx) => {
      const story = await tx.findOne(Story, { id: storyId });
      if (!story) throw new RepositoryError("STORY_NOT_FOUND", "Story was not found.", 404);

      const from = story.status;
      if (!STORY_TRANSITIONS[from]?.includes(to)) {
        throw new RepositoryError(
          "INVALID_STORY_TRANSITION",
          `A story cannot transition from ${from} to ${to}.`,
          409
        );
      }

      story.status = to;
      if (to === "published") story.publishedAt = new Date();
      if (to === "draft") story.publishedAt = null;
      await tx.flush();

      tx.persist(tx.create(AuditEvent, {
        id: randomUUID(),
        actor: tx.getReference(User, actorId),
        action: "story.status_changed",
        subjectType: "story",
        subjectId: story.id,
        requestId: requestId ?? null,
        metadata: { from, to, ...(reason ? { reason } : {}) }
      }));

      await createOutboxRepository(tx).append({
        eventType: "story.status_changed",
        schemaVersion: 1,
        payload: { storyId: story.id, actorId, from, to },
        correlationId: requestId ?? randomUUID(),
        idempotencyKey: requestId ? `story.status_changed:${story.id}:${requestId}` : null
      });

      await tx.flush();
      return story;
    });
  }

  async function findPublicBySlug(slug) {
    return em.findOne(
      Story,
      { slug, status: "published", publishedAt: { $ne: null } },
      { populate: ["author"] }
    );
  }

  async function listPublic({ limit = 20, offset = 0, q } = {}) {
    const where = {
      status: "published",
      publishedAt: { $ne: null }
    };

    if (q?.trim()) where.title = { $ilike: `%${q.trim()}%` };

    const [items, total] = await em.findAndCount(Story, where, {
      populate: ["author"],
      orderBy: { publishedAt: "DESC", id: "DESC" },
      limit: Math.min(50, Math.max(1, Number(limit) || 20)),
      offset: Math.max(0, Number(offset) || 0)
    });

    return { items, total };
  }

  async function listMine(authorId, { limit = 20, offset = 0 } = {}) {
    const [items, total] = await em.findAndCount(Story, { author: authorId }, {
      orderBy: { updatedAt: "DESC", id: "DESC" },
      limit: Math.min(50, Math.max(1, Number(limit) || 20)),
      offset: Math.max(0, Number(offset) || 0)
    });
    return { items, total };
  }

  return Object.freeze({
    createDraft,
    updateDraft,
    submitForReview,
    transition,
    findPublicBySlug,
    listPublic,
    listMine
  });
}

export function createResearchRepository(em) {
  async function createDraft(authorId, input, requestId) {
    const claimsInput = input.claims ?? [];
    const allSourceIds = unique(claimsInput.flatMap((claim) => claim.sourceIds ?? []));

    return em.transactional(async (tx) => {
      const sources = await assertSourcesExist(tx, allSourceIds);
      const sourcesById = new Map(sources.map((source) => [source.id, source]));
      const dossier = tx.create(ResearchDossier, {
        id: randomUUID(),
        author: tx.getReference(User, authorId),
        slug: `${slugBase(input.title)}-${randomUUID().slice(0, 8)}`,
        title: input.title.trim(),
        question: input.question.trim(),
        scope: input.scope.trim(),
        methodologyNote: input.methodologyNote?.trim() || null,
        status: "draft",
        findings: input.findings ?? [],
        limitations: input.limitations ?? [],
        nextQuestions: input.nextQuestions ?? [],
        publishedAt: null
      });

      await tx.persist(dossier).flush();

      const claims = [];
      for (let index = 0; index < claimsInput.length; index += 1) {
        const claimInput = claimsInput[index];
        const linkedSourceIds = unique(claimInput.sourceIds);
        if (claimInput.classification === "sourced_claim" && linkedSourceIds.length === 0) {
          throw new RepositoryError(
            "SOURCED_CLAIM_REQUIRES_REFERENCE",
            "A sourced claim must reference at least one source.",
            422
          );
        }

        const claim = tx.create(ResearchClaim, {
          id: randomUUID(),
          dossier,
          statement: claimInput.statement.trim(),
          classification: claimInput.classification,
          status: claimInput.status ?? "working",
          sortOrder: index,
          notes: claimInput.notes?.trim() || null
        });
        claims.push(claim);

        for (const sourceId of linkedSourceIds) {
          const sourceReference = sourcesById.get(sourceId);
          if (!sourceReference) {
            throw new RepositoryError("SOURCE_REFERENCE_NOT_FOUND", "A claim references a missing source.", 422);
          }

          const relationType = claimInput.classification === "counter_evidence" ? "counters" :
            claimInput.classification === "sourced_claim" ? "supports" : "context";

          tx.persist(tx.create(ResearchClaimSource, {
            id: randomUUID(),
            claim,
            sourceReference,
            relationType,
            note: null
          }));
        }
      }

      if (claims.length) tx.persist(claims);

      tx.persist(tx.create(AuditEvent, {
        id: randomUUID(),
        actor: tx.getReference(User, authorId),
        action: "research.created",
        subjectType: "research_dossier",
        subjectId: dossier.id,
        requestId: requestId ?? null,
        metadata: { status: "draft", claimsCount: claims.length }
      }));

      await createOutboxRepository(tx).append({
        eventType: "research.created",
        schemaVersion: 1,
        payload: { dossierId: dossier.id, authorId, claimsCount: claims.length },
        correlationId: requestId ?? randomUUID(),
        idempotencyKey: requestId ? `research.created:${dossier.id}:${requestId}` : null
      });

      await tx.flush();
      return dossier;
    });
  }

  async function listMine(authorId, { limit = 20, offset = 0 } = {}) {
    const [items, total] = await em.findAndCount(ResearchDossier, { author: authorId }, {
      orderBy: { createdAt: "DESC", id: "DESC" },
      limit: Math.min(50, Math.max(1, Number(limit) || 20)),
      offset: Math.max(0, Number(offset) || 0)
    });
    return { items, total };
  }

  async function findPublicBySlug(slug) {
    return em.findOne(
      ResearchDossier,
      { slug, status: "published", publishedAt: { $ne: null } },
      { populate: ["author"] }
    );
  }

  async function findClaims(dossierId) {
    return em.find(ResearchClaim, { dossier: dossierId }, {
      orderBy: { sortOrder: "ASC" }
    });
  }

  async function findClaimSources(claimIds) {
    if (!claimIds.length) return [];
    return em.find(ResearchClaimSource, { claim: { $in: claimIds } }, {
      populate: ["sourceReference"]
    });
  }

  return Object.freeze({ createDraft, listMine, findPublicBySlug, findClaims, findClaimSources });
}

export function createCreativeEntityRepository(em) {
  return Object.freeze({
    async listPublic() {
      return em.find(CreativeEntity, { status: "published" }, {
        orderBy: [{ entityType: "ASC" }, { displayName: "ASC" }]
      });
    },

    async findBySlug(slug) {
      return em.findOne(CreativeEntity, { slug, status: "published" });
    },

    async listForStory(storyId) {
      const links = await em.find(StoryCreativeEntity, {
        story: { id: storyId, status: "published", publishedAt: { $ne: null } },
        creativeEntity: { status: "published" }
      }, { populate: ["creativeEntity"] });
      return links.map((link) => link.creativeEntity);
    },

    async listPublishedStoriesForEntity(entityId, { limit = 20 } = {}) {
      const links = await em.find(StoryCreativeEntity, {
        creativeEntity: { id: entityId, status: "published" },
        story: { status: "published", publishedAt: { $ne: null } }
      }, {
        populate: ["story", "story.author"],
        orderBy: { story: { publishedAt: "DESC" } },
        limit: Math.min(50, Math.max(1, Number(limit) || 20))
      });
      return links.map((link) => link.story);
    }
  });
}

export { normalizeHttpUrl };
