import { randomUUID } from "node:crypto";
import { AuditEvent, User } from "./entities.js";

const SENSITIVE_KEY = /(password|secret|token|authorization|cookie|qr|session|message(body)?|content|body)/i;
const MAX_METADATA_BYTES = 8192;

export class AuditMetadataError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuditMetadataError";
    this.code = "INVALID_AUDIT_METADATA";
    this.statusCode = 422;
  }
}

function normalizeValue(value, depth = 0) {
  if (depth > 5) throw new AuditMetadataError("Audit metadata nesting is too deep.");
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;

  if (typeof value === "string") {
    if (value.length > 1000) throw new AuditMetadataError("Audit metadata strings must not exceed 1000 characters.");
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length > 50) throw new AuditMetadataError("Audit metadata arrays must not contain more than 50 items.");
    return value.map((item) => normalizeValue(item, depth + 1));
  }

  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const entries = Object.entries(value);
    if (entries.length > 40) throw new AuditMetadataError("Audit metadata objects must not contain more than 40 fields.");
    const normalized = {};
    for (const [key, nested] of entries) {
      if (SENSITIVE_KEY.test(key)) {
        throw new AuditMetadataError(`Sensitive audit metadata field is prohibited: ${key}`);
      }
      normalized[key] = normalizeValue(nested, depth + 1);
    }
    return normalized;
  }

  throw new AuditMetadataError("Audit metadata supports only JSON-safe values.");
}

export function sanitizeAuditMetadata(metadata = {}) {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new AuditMetadataError("Audit metadata must be a plain object.");
  }
  const safe = normalizeValue(metadata);
  if (Buffer.byteLength(JSON.stringify(safe), "utf8") > MAX_METADATA_BYTES) {
    throw new AuditMetadataError("Audit metadata must not exceed 8 KiB.");
  }
  return safe;
}

function normalizeLimit(value, fallback = 50) {
  const limit = Number(value ?? fallback);
  return Number.isInteger(limit) ? Math.min(100, Math.max(1, limit)) : fallback;
}

function normalizeOffset(value) {
  const offset = Number(value ?? 0);
  return Number.isInteger(offset) ? Math.min(100000, Math.max(0, offset)) : 0;
}

export function createAuditRepository(em) {
  async function append({
    actorId = null,
    action,
    subjectType,
    subjectId,
    requestId = null,
    metadata = {}
  }) {
    if (typeof action !== "string" || !/^[a-z][a-z0-9_.-]{2,119}$/.test(action)) {
      throw new AuditMetadataError("Audit action must be a stable lowercase identifier.");
    }
    if (typeof subjectType !== "string" || subjectType.length < 2 || subjectType.length > 80) {
      throw new AuditMetadataError("Audit subject type is required.");
    }
    if (typeof subjectId !== "string" || subjectId.length < 1 || subjectId.length > 180) {
      throw new AuditMetadataError("Audit subject ID is required.");
    }

    const event = em.create(AuditEvent, {
      id: randomUUID(),
      actor: actorId ? em.getReference(User, actorId) : null,
      action,
      subjectType,
      subjectId,
      requestId,
      metadata: sanitizeAuditMetadata(metadata),
      createdAt: new Date()
    });
    await em.persist(event).flush();
    return event;
  }

  async function listBySubject(subjectType, subjectId, { limit, offset } = {}) {
    const [items, total] = await em.findAndCount(AuditEvent, {
      subjectType,
      subjectId
    }, {
      populate: ["actor"],
      orderBy: { createdAt: "DESC", id: "DESC" },
      limit: normalizeLimit(limit),
      offset: normalizeOffset(offset)
    });
    return { items, total };
  }

  async function listRecent({ limit, offset, action } = {}) {
    const where = action ? { action } : {};
    const [items, total] = await em.findAndCount(AuditEvent, where, {
      populate: ["actor"],
      orderBy: { createdAt: "DESC", id: "DESC" },
      limit: normalizeLimit(limit),
      offset: normalizeOffset(offset)
    });
    return { items, total };
  }

  return Object.freeze({ append, listBySubject, listRecent });
}
