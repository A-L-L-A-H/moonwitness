import test from "node:test";
import assert from "node:assert/strict";
import {
  createMessagingProviderRegistry,
  MessagingProviderError
} from "../src/messaging.js";

function fakeProvider(overrides = {}) {
  let inboundHandler = null;
  const calls = [];
  return {
    calls,
    id: "whatsapp.baileys",
    async connect(input) { calls.push(["connect", input]); },
    async disconnect(input) { calls.push(["disconnect", input]); },
    async status(input) {
      calls.push(["status", input]);
      return { state: "connected", accountId: input?.accountId ?? "account-1" };
    },
    async send(input) {
      calls.push(["send", input]);
      return {
        providerMessageId: "provider-message-1",
        acceptedAt: "2026-11-11T00:00:00.000Z"
      };
    },
    onInbound(handler) {
      inboundHandler = handler;
      return () => { inboundHandler = null; };
    },
    emit(event) {
      if (!inboundHandler) throw new Error("No inbound handler registered");
      return inboundHandler(event);
    },
    ...overrides
  };
}

const message = {
  accountId: "account-1",
  recipientId: "person-123",
  clientMessageId: "11111111-1111-4111-8111-111111111111",
  text: "Hello from MoonWitness"
};

test("disabled provider status is exposed without opening a connection or socket", async () => {
  const provider = fakeProvider();
  const registry = createMessagingProviderRegistry({ providers: [provider] });

  const status = await registry.status(provider.id, "account-1");
  assert.equal(status.state, "disabled");
  assert.equal(status.providerId, provider.id);
  assert.deepEqual(provider.calls, []);
  assert.deepEqual(registry.list(), [{ providerId: provider.id, state: "disabled" }]);
});

test("enabled provider supports normalized connect, status, send, and disconnect", async () => {
  const provider = fakeProvider();
  const registry = createMessagingProviderRegistry({ providers: [provider] });
  registry.setEnabled(provider.id, true);

  const connected = await registry.connect(provider.id, { accountId: "account-1" });
  assert.equal(connected.state, "connected");

  const status = await registry.status(provider.id, "account-1");
  assert.equal(status.accountId, "account-1");

  const result = await registry.send(provider.id, message);
  assert.deepEqual(result, {
    providerId: provider.id,
    accountId: "account-1",
    recipientId: "person-123",
    clientMessageId: message.clientMessageId,
    providerMessageId: "provider-message-1",
    acceptedAt: "2026-11-11T00:00:00.000Z"
  });

  const disconnected = await registry.disconnect(provider.id, { accountId: "account-1" });
  assert.equal(disconnected.state, "disconnected");
});

test("provider errors map to stable categories and retryability", async () => {
  const provider = fakeProvider({
    async send() {
      throw Object.assign(new Error("socket detail must not escape"), {
        category: "RATE_LIMIT",
        publicMessage: "Provider rate limit reached."
      });
    }
  });
  const registry = createMessagingProviderRegistry({ providers: [provider], enabledProviders: [provider.id] });

  await assert.rejects(
    () => registry.send(provider.id, message),
    (error) => error instanceof MessagingProviderError &&
      error.category === "RATE_LIMIT" &&
      error.retryable === true &&
      error.message === "Provider rate limit reached."
  );
});

test("invalid requests and unknown provider errors fail with safe stable categories", async () => {
  const provider = fakeProvider({
    async send() { throw new Error("private socket stack"); }
  });
  const registry = createMessagingProviderRegistry({ providers: [provider], enabledProviders: [provider.id] });

  await assert.rejects(
    () => registry.send(provider.id, { ...message, recipientId: "" }),
    (error) => error.category === "INVALID_REQUEST" && error.retryable === false
  );
  await assert.rejects(
    () => registry.send(provider.id, message),
    (error) => error.category === "TRANSIENT" && error.retryable === true &&
      !error.message.includes("private socket stack")
  );
});

test("inbound provider events are normalized and validated before reaching core handlers", async () => {
  const provider = fakeProvider();
  const registry = createMessagingProviderRegistry({ providers: [provider], enabledProviders: [provider.id] });
  const received = [];
  const unsubscribe = registry.onInbound(provider.id, async (event) => received.push(event));

  await provider.emit({
    providerId: provider.id,
    accountId: "account-1",
    providerMessageId: "provider-inbound-1",
    conversationId: "conversation-1",
    senderId: "person-123",
    text: "A received message",
    receivedAt: "2026-11-11T00:00:00.000Z"
  });

  assert.equal(received.length, 1);
  assert.equal(received[0].senderId, "person-123");
  unsubscribe();
  assert.throws(() => provider.emit({}), /No inbound handler/);
});

test("provider must implement the complete port and disabled providers cannot send", async () => {
  const registry = createMessagingProviderRegistry();
  assert.throws(() => registry.register({ id: "bad.provider" }), /must implement connect/);
  const provider = fakeProvider();
  registry.register(provider);
  await assert.rejects(
    () => registry.send(provider.id, message),
    (error) => error.category === "DISABLED" && error.retryable === false
  );
});
