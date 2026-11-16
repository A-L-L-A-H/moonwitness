import { Value } from "@sinclair/typebox/value";
import {
  InboundMessageEventSchema,
  MESSAGING_ERROR_CATEGORIES,
  OutboundMessageRequestSchema,
  OutboundMessageResultSchema,
  MessagingProviderStatusSchema
} from "@moonwitness/contracts";

const RETRYABLE = new Set(["RATE_LIMIT", "RECIPIENT_UNAVAILABLE", "TRANSIENT"]);

export class MessagingProviderError extends Error {
  constructor(category, message) {
    super(message);
    this.name = "MessagingProviderError";
    this.category = MESSAGING_ERROR_CATEGORIES.includes(category) ? category : "TRANSIENT";
    this.retryable = RETRYABLE.has(this.category);
  }
}

function normalizeError(error) {
  if (error instanceof MessagingProviderError) return error;
  const category = MESSAGING_ERROR_CATEGORIES.includes(error?.category)
    ? error.category
    : "TRANSIENT";
  return new MessagingProviderError(
    category,
    typeof error?.publicMessage === "string" && error.publicMessage.length <= 500
      ? error.publicMessage
      : "Messaging provider operation failed."
  );
}

function validateProvider(provider) {
  if (!provider || typeof provider !== "object") throw new TypeError("Messaging provider must be an object.");
  for (const method of ["connect", "disconnect", "status", "send", "onInbound"]) {
    if (typeof provider[method] !== "function") {
      throw new TypeError(`Messaging provider must implement ${method}().`);
    }
  }
}

function assertProviderId(providerId) {
  if (typeof providerId !== "string" || !/^[a-z][a-z0-9.-]{1,79}$/.test(providerId)) {
    throw new TypeError("Messaging provider ID is invalid.");
  }
}

function statusDto(providerId, state, accountId) {
  const result = {
    providerId,
    state,
    checkedAt: new Date().toISOString(),
    ...(accountId ? { accountId } : {})
  };
  if (!Value.Check(MessagingProviderStatusSchema, result)) {
    throw new MessagingProviderError("PERMANENT", "Messaging provider returned an invalid status.");
  }
  return result;
}

export function createMessagingProviderRegistry({ providers = [], enabledProviders = [] } = {}) {
  const registered = new Map();
  const enabled = new Set(enabledProviders);

  function register(provider) {
    validateProvider(provider);
    assertProviderId(provider.id);
    if (registered.has(provider.id)) throw new Error(`Messaging provider already registered: ${provider.id}`);
    registered.set(provider.id, provider);
  }

  function setEnabled(providerId, isEnabled) {
    assertProviderId(providerId);
    if (!registered.has(providerId)) throw new Error(`Messaging provider is not registered: ${providerId}`);
    if (isEnabled) enabled.add(providerId);
    else enabled.delete(providerId);
  }

  function resolve(providerId) {
    assertProviderId(providerId);
    const provider = registered.get(providerId);
    if (!provider) throw new MessagingProviderError("DISABLED", "Messaging provider is not configured.");
    if (!enabled.has(providerId)) throw new MessagingProviderError("DISABLED", "Messaging provider is disabled.");
    return provider;
  }

  async function status(providerId, accountId) {
    assertProviderId(providerId);
    const provider = registered.get(providerId);
    if (!provider || !enabled.has(providerId)) return statusDto(providerId, "disabled", accountId);
    try {
      const result = await provider.status({ accountId });
      return statusDto(providerId, result?.state ?? "disconnected", result?.accountId ?? accountId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async function connect(providerId, input = {}) {
    const provider = resolve(providerId);
    try {
      await provider.connect(input);
      const current = await provider.status(input);
      return statusDto(providerId, current?.state ?? "connected", current?.accountId ?? input.accountId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async function disconnect(providerId, input = {}) {
    const provider = resolve(providerId);
    try {
      await provider.disconnect(input);
      return statusDto(providerId, "disconnected", input.accountId);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async function send(providerId, input) {
    const provider = resolve(providerId);
    if (!Value.Check(OutboundMessageRequestSchema, input)) {
      throw new MessagingProviderError("INVALID_REQUEST", "Outbound message request does not match the platform contract.");
    }
    try {
      const result = await provider.send(input);
      const normalized = {
        providerId,
        accountId: input.accountId,
        recipientId: input.recipientId,
        clientMessageId: input.clientMessageId,
        providerMessageId: result?.providerMessageId,
        acceptedAt: result?.acceptedAt ?? new Date().toISOString()
      };
      if (!Value.Check(OutboundMessageResultSchema, normalized)) {
        throw new MessagingProviderError("PERMANENT", "Messaging provider returned an invalid send result.");
      }
      return normalized;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  function onInbound(providerId, handler) {
    const provider = resolve(providerId);
    if (typeof handler !== "function") throw new TypeError("Inbound handler must be a function.");
    return provider.onInbound((event) => {
      if (!Value.Check(InboundMessageEventSchema, event) || event.providerId !== providerId) {
        throw new MessagingProviderError("PERMANENT", "Messaging provider emitted an invalid inbound event.");
      }
      return handler(Object.freeze({ ...event }));
    });
  }

  function list() {
    return [...registered.keys()].sort().map((providerId) => ({
      providerId,
      state: enabled.has(providerId) ? "enabled" : "disabled"
    }));
  }

  for (const provider of providers) register(provider);

  return Object.freeze({ register, setEnabled, resolve, status, connect, disconnect, send, onInbound, list });
}
