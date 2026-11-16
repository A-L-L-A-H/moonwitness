import { Type } from "@sinclair/typebox";

export const AuditListQuerySchema = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, maximum: 100000, default: 0 })),
  subjectType: Type.Optional(Type.String({ minLength: 2, maxLength: 80 })),
  subjectId: Type.Optional(Type.String({ minLength: 1, maxLength: 180 })),
  action: Type.Optional(Type.String({ minLength: 3, maxLength: 120 }))
}, { additionalProperties: false });

export const AuditEventDtoSchema = Type.Object({
  id: Type.String({ pattern: "^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$" }),
  action: Type.String(),
  subjectType: Type.String(),
  subjectId: Type.String(),
  requestId: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Record(Type.String(), Type.Unknown()),
  createdAt: Type.String({ format: "date-time" }),
  actor: Type.Union([
    Type.Object({
      id: Type.String({ pattern: "^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$" }),
      handle: Type.String(),
      displayName: Type.String()
    }),
    Type.Null()
  ])
}, { additionalProperties: false });
