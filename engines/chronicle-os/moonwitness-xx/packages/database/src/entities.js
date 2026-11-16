import { EntitySchema } from "@mikro-orm/core";

export class User {}
export class Story {}
export class AddonInstallation {}
export class AuditEvent {}
export class UserSession {}
export class SourceReference {}
export class StoryBlockSource {}
export class ResearchDossier {}
export class ResearchClaim {}
export class ResearchClaimSource {}
export class CreativeEntity {}
export class StoryCreativeEntity {}
export class Role {}
export class RolePermission {}
export class UserRole {}
export class AddonCapabilityGrant {}
export class OutboxMessage {}

const timestamps = {
  createdAt: { type: "Date", fieldName: "created_at", onCreate: () => new Date() },
  updatedAt: {
    type: "Date",
    fieldName: "updated_at",
    onCreate: () => new Date(),
    onUpdate: () => new Date()
  }
};

export const UserSchema = new EntitySchema({
  class: User,
  tableName: "users",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    handle: { type: "string", unique: true, length: 48 },
    displayName: { type: "string", fieldName: "display_name", length: 120 },
    email: { type: "string", nullable: true, unique: true, length: 254 },
    status: { type: "string", default: "active", length: 24 },
    passwordHash: { type: "string", fieldName: "password_hash", length: 255, hidden: true },
    ...timestamps
  }
});

export const StorySchema = new EntitySchema({
  class: Story,
  tableName: "stories",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    author: { kind: "m:1", entity: () => User, fieldName: "author_id", deleteRule: "restrict" },
    slug: { type: "string", unique: true, length: 180 },
    title: { type: "string", length: 240 },
    subtitle: { type: "string", nullable: true, length: 500 },
    status: { type: "string", default: "draft", length: 32 },
    contentBlocks: { type: "json", fieldName: "content_blocks", columnType: "jsonb", defaultRaw: "'[]'::jsonb" },
    publishedAt: { type: "Date", fieldName: "published_at", nullable: true },
    ...timestamps
  },
  indexes: [
    { properties: ["status", "publishedAt"] },
    { properties: ["author", "createdAt"] }
  ]
});

export const AddonInstallationSchema = new EntitySchema({
  class: AddonInstallation,
  tableName: "addon_installations",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    addonId: { type: "string", fieldName: "addon_id", unique: true, length: 120 },
    version: { type: "string", length: 40 },
    state: { type: "string", default: "installed", length: 24 },
    config: { type: "json", columnType: "jsonb", defaultRaw: "'{}'::jsonb" },
    installedAt: { type: "Date", fieldName: "installed_at", onCreate: () => new Date() },
    enabledAt: { type: "Date", fieldName: "enabled_at", nullable: true },
    disabledAt: { type: "Date", fieldName: "disabled_at", nullable: true },
    lastError: { type: "string", fieldName: "last_error", nullable: true, length: 2000 },
    ...timestamps
  }
});

export const AuditEventSchema = new EntitySchema({
  class: AuditEvent,
  tableName: "audit_events",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    actor: { kind: "m:1", entity: () => User, fieldName: "actor_user_id", nullable: true, deleteRule: "set null" },
    action: { type: "string", length: 120 },
    subjectType: { type: "string", fieldName: "subject_type", length: 80 },
    subjectId: { type: "string", fieldName: "subject_id", length: 180 },
    requestId: { type: "string", fieldName: "request_id", nullable: true, length: 120 },
    metadata: { type: "json", columnType: "jsonb", defaultRaw: "'{}'::jsonb" },
    createdAt: { type: "Date", fieldName: "created_at", onCreate: () => new Date() }
  },
  indexes: [
    { properties: ["subjectType", "subjectId", "createdAt"] },
    { properties: ["actor", "createdAt"] }
  ]
});

export const UserSessionSchema = new EntitySchema({
  class: UserSession,
  tableName: "user_sessions",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    user: { kind: "m:1", entity: () => User, fieldName: "user_id", deleteRule: "cascade" },
    tokenHash: { type: "string", fieldName: "token_hash", unique: true, length: 64 },
    csrfTokenHash: { type: "string", fieldName: "csrf_token_hash", length: 64 },
    expiresAt: { type: "Date", fieldName: "expires_at" },
    revokedAt: { type: "Date", fieldName: "revoked_at", nullable: true },
    lastUsedAt: { type: "Date", fieldName: "last_used_at", nullable: true },
    createdAt: { type: "Date", fieldName: "created_at", onCreate: () => new Date() }
  },
  indexes: [
    { properties: ["user", "expiresAt"] },
    { properties: ["revokedAt", "expiresAt"] }
  ]
});

export const SourceReferenceSchema = new EntitySchema({
  class: SourceReference,
  tableName: "source_references",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    createdBy: { kind: "m:1", entity: () => User, fieldName: "created_by", nullable: true, deleteRule: "set null" },
    title: { type: "string", length: 500 },
    url: { type: "string", length: 2048 },
    normalizedUrl: { type: "string", fieldName: "normalized_url", unique: true, length: 2048 },
    authorName: { type: "string", fieldName: "author_name", nullable: true, length: 240 },
    publisher: { type: "string", nullable: true, length: 240 },
    sourceType: { type: "string", fieldName: "source_type", default: "external", length: 40 },
    accessedAt: { type: "Date", fieldName: "accessed_at", nullable: true },
    metadata: { type: "json", columnType: "jsonb", defaultRaw: "'{}'::jsonb" },
    createdAt: { type: "Date", fieldName: "created_at", onCreate: () => new Date() },
    updatedAt: { type: "Date", fieldName: "updated_at", onCreate: () => new Date(), onUpdate: () => new Date() }
  },
  indexes: [{ properties: ["createdBy", "createdAt"] }]
});

export const StoryBlockSourceSchema = new EntitySchema({
  class: StoryBlockSource,
  tableName: "story_block_sources",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    story: { kind: "m:1", entity: () => Story, fieldName: "story_id", deleteRule: "cascade" },
    sourceReference: { kind: "m:1", entity: () => SourceReference, fieldName: "source_reference_id", deleteRule: "restrict" },
    blockId: { type: "string", fieldName: "block_id", length: 80 },
    createdAt: { type: "Date", fieldName: "created_at", onCreate: () => new Date() }
  },
  indexes: [{ properties: ["story", "blockId", "sourceReference"], unique: true }]
});

export const ResearchDossierSchema = new EntitySchema({
  class: ResearchDossier,
  tableName: "research_dossiers",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    author: { kind: "m:1", entity: () => User, fieldName: "author_id", deleteRule: "restrict" },
    slug: { type: "string", unique: true, length: 180 },
    title: { type: "string", length: 240 },
    question: { type: "string", length: 2000 },
    scope: { type: "string", length: 5000 },
    methodologyNote: { type: "string", fieldName: "methodology_note", nullable: true, length: 10000 },
    status: { type: "string", default: "draft", length: 32 },
    findings: { type: "json", columnType: "jsonb", defaultRaw: "'[]'::jsonb" },
    limitations: { type: "json", columnType: "jsonb", defaultRaw: "'[]'::jsonb" },
    nextQuestions: { type: "json", fieldName: "next_questions", columnType: "jsonb", defaultRaw: "'[]'::jsonb" },
    publishedAt: { type: "Date", fieldName: "published_at", nullable: true },
    ...timestamps
  },
  indexes: [{ properties: ["status", "publishedAt"] }, { properties: ["author", "createdAt"] }]
});

export const ResearchClaimSchema = new EntitySchema({
  class: ResearchClaim,
  tableName: "research_claims",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    dossier: { kind: "m:1", entity: () => ResearchDossier, fieldName: "dossier_id", deleteRule: "cascade" },
    statement: { type: "string", length: 5000 },
    classification: { type: "string", length: 40 },
    status: { type: "string", default: "working", length: 32 },
    sortOrder: { type: "number", fieldName: "sort_order", default: 0 },
    notes: { type: "string", nullable: true, length: 10000 },
    ...timestamps
  },
  indexes: [{ properties: ["dossier", "sortOrder"] }]
});

export const ResearchClaimSourceSchema = new EntitySchema({
  class: ResearchClaimSource,
  tableName: "research_claim_sources",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    claim: { kind: "m:1", entity: () => ResearchClaim, fieldName: "claim_id", deleteRule: "cascade" },
    sourceReference: { kind: "m:1", entity: () => SourceReference, fieldName: "source_reference_id", deleteRule: "restrict" },
    relationType: { type: "string", fieldName: "relation_type", length: 32 },
    note: { type: "string", nullable: true, length: 2000 },
    createdAt: { type: "Date", fieldName: "created_at", onCreate: () => new Date() }
  },
  indexes: [{ properties: ["claim", "sourceReference", "relationType"], unique: true }]
});

export const CreativeEntitySchema = new EntitySchema({
  class: CreativeEntity,
  tableName: "creative_entities",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    slug: { type: "string", unique: true, length: 180 },
    displayName: { type: "string", fieldName: "display_name", length: 160 },
    entityType: { type: "string", fieldName: "entity_type", length: 40 },
    summary: { type: "string", nullable: true, length: 2000 },
    status: { type: "string", default: "published", length: 24 },
    metadata: { type: "json", columnType: "jsonb", defaultRaw: "'{}'::jsonb" },
    ...timestamps
  },
  indexes: [{ properties: ["entityType", "status"] }]
});

export const StoryCreativeEntitySchema = new EntitySchema({
  class: StoryCreativeEntity,
  tableName: "story_creative_entities",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    story: { kind: "m:1", entity: () => Story, fieldName: "story_id", deleteRule: "cascade" },
    creativeEntity: { kind: "m:1", entity: () => CreativeEntity, fieldName: "creative_entity_id", deleteRule: "restrict" },
    createdAt: { type: "Date", fieldName: "created_at", onCreate: () => new Date() }
  },
  indexes: [{ properties: ["story", "creativeEntity"], unique: true }]
});


export const RoleSchema = new EntitySchema({
  class: Role,
  tableName: "roles",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    name: { type: "string", unique: true, length: 64 },
    description: { type: "string", length: 500 },
    isSystem: { type: "boolean", fieldName: "is_system", default: true },
    ...timestamps
  }
});

export const RolePermissionSchema = new EntitySchema({
  class: RolePermission,
  tableName: "role_permissions",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    role: { kind: "m:1", entity: () => Role, fieldName: "role_id", deleteRule: "cascade" },
    permission: { type: "string", length: 120 },
    createdAt: { type: "Date", fieldName: "created_at", onCreate: () => new Date() }
  },
  indexes: [{ properties: ["role", "permission"], unique: true }]
});

export const UserRoleSchema = new EntitySchema({
  class: UserRole,
  tableName: "user_roles",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    user: { kind: "m:1", entity: () => User, fieldName: "user_id", deleteRule: "cascade" },
    role: { kind: "m:1", entity: () => Role, fieldName: "role_id", deleteRule: "restrict" },
    grantedBy: { kind: "m:1", entity: () => User, fieldName: "granted_by", nullable: true, deleteRule: "set null" },
    grantedAt: { type: "Date", fieldName: "granted_at", onCreate: () => new Date() }
  },
  indexes: [
    { properties: ["user", "role"], unique: true },
    { properties: ["role", "grantedAt"] }
  ]
});

export const AddonCapabilityGrantSchema = new EntitySchema({
  class: AddonCapabilityGrant,
  tableName: "addon_capability_grants",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    addonId: { type: "string", fieldName: "addon_id", length: 120 },
    permission: { type: "string", length: 120 },
    grantedBy: { kind: "m:1", entity: () => User, fieldName: "granted_by", nullable: true, deleteRule: "set null" },
    grantedAt: { type: "Date", fieldName: "granted_at", onCreate: () => new Date() },
    revokedAt: { type: "Date", fieldName: "revoked_at", nullable: true }
  },
  indexes: [{ properties: ["addonId", "permission", "revokedAt"], unique: true }]
});


export const OutboxMessageSchema = new EntitySchema({
  class: OutboxMessage,
  tableName: "outbox_messages",
  properties: {
    id: { type: "uuid", primary: true, defaultRaw: "gen_random_uuid()" },
    eventType: { type: "string", fieldName: "event_type", length: 120 },
    schemaVersion: { type: "number", fieldName: "schema_version", default: 1 },
    payload: { type: "json", columnType: "jsonb" },
    correlationId: { type: "string", fieldName: "correlation_id", length: 120 },
    idempotencyKey: { type: "string", fieldName: "idempotency_key", nullable: true, unique: true, length: 240 },
    status: { type: "string", default: "pending", length: 24 },
    attempts: { type: "number", default: 0 },
    availableAt: { type: "Date", fieldName: "available_at", onCreate: () => new Date() },
    lockedUntil: { type: "Date", fieldName: "locked_until", nullable: true },
    lockedBy: { type: "string", fieldName: "locked_by", nullable: true, length: 120 },
    lastError: { type: "string", fieldName: "last_error", nullable: true, length: 2000 },
    dispatchedAt: { type: "Date", fieldName: "dispatched_at", nullable: true },
    processedAt: { type: "Date", fieldName: "processed_at", nullable: true },
    ...timestamps
  },
  indexes: [
    { properties: ["status", "availableAt", "createdAt"] },
    { properties: ["status", "lockedUntil"] }
  ]
});
