import test from "node:test";
import assert from "node:assert/strict";
import { Value } from "@sinclair/typebox/value";
import {
  MESSAGING_PROVIDER_CONTRACT_VERSION,
  InboundMessageEventSchema,
  OutboundMessageRequestSchema,
  OutboundMessageResultSchema,
  MessagingProviderStatusSchema
} from "../src/messaging.js";

test("messaging provider contract is explicitly versioned", () => {
  assert.equal(MESSAGING_PROVIDER_CONTRACT_VERSION, "1.0.0");
});

test("normalized outbound and inbound messages validate without provider wire identifiers", () => {
  const outbound = {
    accountId: "account-1",
    recipientId: "platform-recipient-1",
    clientMessageId: "11111111-1111-4111-8111-111111111111",
    text: "Hello"
  };
  assert.equal(Value.Check(OutboundMessageRequestSchema, outbound), true);
  assert.equal(Value.Check(OutboundMessageRequestSchema, { ...outbound, recipientId: "" }), false);

  assert.equal(Value.Check(InboundMessageEventSchema, {
    providerId: "whatsapp.baileys",
    accountId: "account-1",
    providerMessageId: "provider-message-1",
    conversationId: "platform-conversation-1",
    senderId: "platform-sender-1",
    receivedAt: "2026-11-11T00:00:00.000Z"
  }), true);

  assert.equal(Value.Check(OutboundMessageResultSchema, {
    providerId: "whatsapp.baileys",
    accountId: "account-1",
    recipientId: "platform-recipient-1",
    clientMessageId: outbound.clientMessageId,
    providerMessageId: "provider-message-1",
    acceptedAt: "2026-11-11T00:00:00.000Z"
  }), true);
});

test("provider status only exposes the normalized lifecycle state", () => {
  assert.equal(Value.Check(MessagingProviderStatusSchema, {
    providerId: "whatsapp.baileys",
    state: "disabled",
    checkedAt: "2026-11-11T00:00:00.000Z"
  }), true);
  assert.equal(Value.Check(MessagingProviderStatusSchema, {
    providerId: "whatsapp.baileys",
    state: "socket-open",
    checkedAt: "2026-11-11T00:00:00.000Z"
  }), false);
});
