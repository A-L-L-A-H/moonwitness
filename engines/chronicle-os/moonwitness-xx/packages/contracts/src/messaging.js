export const MESSAGING_PROVIDER_CONTRACT_VERSION = "1.0.0";

import { Type } from "@sinclair/typebox";

const uuidPattern = "^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$";

export const MessagingProviderStatusSchema = Type.Object({
  providerId: Type.String({ minLength: 2, maxLength: 80 }),
  state: Type.Union([
    Type.Literal("disabled"),
    Type.Literal("disconnected"),
    Type.Literal("connecting"),
    Type.Literal("connected"),
    Type.Literal("error")
  ]),
  accountId: Type.Optional(Type.String({ minLength: 1, maxLength: 120 })),
  checkedAt: Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,9})?(?:Z|[+-]\\d{2}:\\d{2})$" })
}, { additionalProperties: false });

export const OutboundMessageRequestSchema = Type.Object({
  accountId: Type.String({ minLength: 1, maxLength: 120 }),
  recipientId: Type.String({ minLength: 1, maxLength: 160 }),
  clientMessageId: Type.String({ pattern: uuidPattern }),
  text: Type.String({ minLength: 1, maxLength: 10000 })
}, { additionalProperties: false });

export const OutboundMessageResultSchema = Type.Object({
  providerId: Type.String({ minLength: 2, maxLength: 80 }),
  accountId: Type.String({ minLength: 1, maxLength: 120 }),
  recipientId: Type.String({ minLength: 1, maxLength: 160 }),
  clientMessageId: Type.String({ pattern: uuidPattern }),
  providerMessageId: Type.String({ minLength: 1, maxLength: 200 }),
  acceptedAt: Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,9})?(?:Z|[+-]\\d{2}:\\d{2})$" })
}, { additionalProperties: false });

export const InboundMessageEventSchema = Type.Object({
  providerId: Type.String({ minLength: 2, maxLength: 80 }),
  accountId: Type.String({ minLength: 1, maxLength: 120 }),
  providerMessageId: Type.String({ minLength: 1, maxLength: 200 }),
  conversationId: Type.String({ minLength: 1, maxLength: 200 }),
  senderId: Type.String({ minLength: 1, maxLength: 160 }),
  recipientId: Type.Optional(Type.String({ minLength: 1, maxLength: 160 })),
  text: Type.Optional(Type.String({ maxLength: 10000 })),
  receivedAt: Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,9})?(?:Z|[+-]\\d{2}:\\d{2})$" }),
  media: Type.Optional(Type.Array(Type.Object({
    mediaId: Type.String({ minLength: 1, maxLength: 200 }),
    mediaType: Type.String({ minLength: 1, maxLength: 120 }),
    fileName: Type.Optional(Type.String({ maxLength: 255 }))
  }, { additionalProperties: false }), { maxItems: 20 }))
}, { additionalProperties: false });

export const MESSAGING_ERROR_CATEGORIES = Object.freeze([
  "AUTHENTICATION",
  "RATE_LIMIT",
  "RECIPIENT_UNAVAILABLE",
  "INVALID_REQUEST",
  "TRANSIENT",
  "PERMANENT",
  "DISABLED"
]);

export const MessagingProviderErrorSchema = Type.Object({
  category: Type.Union(MESSAGING_ERROR_CATEGORIES.map((value) => Type.Literal(value))),
  retryable: Type.Boolean(),
  message: Type.String({ minLength: 1, maxLength: 500 })
}, { additionalProperties: false });
