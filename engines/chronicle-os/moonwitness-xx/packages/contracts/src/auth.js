import { Type } from "@sinclair/typebox";

export const RegisterRequestSchema = Type.Object({
  handle: Type.String({ minLength: 3, maxLength: 48, pattern: "^[A-Za-z0-9][A-Za-z0-9_-]{2,47}$" }),
  displayName: Type.String({ minLength: 2, maxLength: 120 }),
  email: Type.String({ format: "email", minLength: 3, maxLength: 254 }),
  password: Type.String({ minLength: 12, maxLength: 128 })
}, { additionalProperties: false });

export const LoginRequestSchema = Type.Object({
  email: Type.String({ format: "email", minLength: 3, maxLength: 254 }),
  password: Type.String({ minLength: 1, maxLength: 128 })
}, { additionalProperties: false });

export const PublicUserSchema = Type.Object({
  id: Type.String({ pattern: "^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$" }),
  handle: Type.String(),
  displayName: Type.String(),
  email: Type.Union([Type.String({ format: "email" }), Type.Null()]),
  status: Type.String()
}, { additionalProperties: false });

export const AuthSessionSchema = Type.Object({
  user: PublicUserSchema,
  csrfToken: Type.String(),
  expiresAt: Type.String({ format: "date-time" })
}, { additionalProperties: false });

 
export const PERMISSION_SCOPES = Object.freeze([
  "stories.read", "stories.create", "stories.update.own", "stories.submit.own",
  "stories.review", "stories.publish", "stories.archive", "sources.create",
  "research.read", "research.create", "research.review", "research.publish",
  "universe.read", "users.read", "users.roles.manage", "audit.read",
  "addons.read", "addons.install", "addons.enable", "addons.disable",
  "media.upload", "media.manage", "integrations.whatsapp.connect",
  "integrations.whatsapp.send", "integrations.whatsapp.receive"
]);

export const DEFAULT_ROLE_PERMISSIONS = Object.freeze({
  contributor: Object.freeze([
    "stories.read", "stories.create", "stories.update.own", "stories.submit.own",
    "sources.create", "research.read", "research.create", "universe.read", "media.upload"
  ]),
  editor: Object.freeze([
    "stories.read", "stories.create", "stories.update.own", "stories.submit.own",
    "stories.review", "sources.create", "research.read", "research.create",
    "research.review", "universe.read", "media.upload"
  ]),
  publisher: Object.freeze([
    "stories.read", "stories.create", "stories.update.own", "stories.submit.own",
    "stories.review", "stories.publish", "stories.archive", "sources.create",
    "research.read", "research.create", "research.review", "research.publish",
    "universe.read", "media.upload"
  ]),
  admin: Object.freeze([
    "stories.read", "stories.create", "stories.update.own", "stories.submit.own",
    "stories.review", "stories.publish", "stories.archive", "sources.create",
    "research.read", "research.create", "research.review", "research.publish",
    "universe.read", "users.read", "users.roles.manage", "audit.read",
    "addons.read", "addons.install", "addons.enable", "addons.disable",
    "media.upload", "media.manage"
  ]),
  owner: Object.freeze(["*"])
});

export const UserRoleGrantSchema = Type.Object({
  roleName: Type.String({ minLength: 2, maxLength: 64, pattern: "^[a-z][a-z0-9_-]+$" })
}, { additionalProperties: false });

export const UserPermissionsDtoSchema = Type.Object({
  userId: Type.String({ pattern: "^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$" }),
  roles: Type.Array(Type.String()),
  permissions: Type.Array(Type.String())
}, { additionalProperties: false });
