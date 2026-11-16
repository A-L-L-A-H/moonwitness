import { DOMAIN_EVENT_DEFINITIONS, validateDomainEvent } from "@moonwitness/contracts";

export class DomainEventHandlerError extends Error {
  constructor(eventType, handlerId, cause) {
    super(`Domain event handler ${handlerId} failed for ${eventType}: ${cause?.message ?? cause}`);
    this.name = "DomainEventHandlerError";
    this.eventType = eventType;
    this.handlerId = handlerId;
    this.cause = cause;
  }
}

export function createDomainEventBus({ logger = console } = {}) {
  const handlers = new Map();

  function register(eventType, handler, { id } = {}) {
    if (!DOMAIN_EVENT_DEFINITIONS[eventType]) {
      throw new Error(`Domain event is not registered: ${eventType}`);
    }
    if (typeof handler !== "function") throw new TypeError("Event handler must be a function");

    const entries = handlers.get(eventType) ?? new Map();
    const handlerId = id ?? `handler-${entries.size + 1}`;
    if (entries.has(handlerId)) throw new Error(`Handler already registered: ${handlerId}`);

    entries.set(handlerId, handler);
    handlers.set(eventType, entries);

    let active = true;
    return () => {
      if (!active) return;
      active = false;
      entries.delete(handlerId);
      if (entries.size === 0) handlers.delete(eventType);
    };
  }

  async function dispatch(event, context = {}) {
    validateDomainEvent(event.eventType, event.schemaVersion, event.payload);
    if (!event.eventId || !event.correlationId || !event.occurredAt) {
      throw new Error("Domain event envelope requires eventId, correlationId, and occurredAt");
    }

    const entries = [...(handlers.get(event.eventType)?.entries() ?? [])];
    const results = [];

    for (const [handlerId, handler] of entries) {
      try {
        const value = await handler(event, context);
        results.push({ handlerId, status: "fulfilled", value });
      } catch (cause) {
        logger.error?.({
          event: "domain_event.handler_failed",
          eventId: event.eventId,
          eventType: event.eventType,
          handlerId,
          message: cause?.message
        });
        throw new DomainEventHandlerError(event.eventType, handlerId, cause);
      }
    }

    return {
      eventId: event.eventId,
      eventType: event.eventType,
      handlerCount: results.length,
      unhandled: results.length === 0,
      results
    };
  }

  function listHandlers() {
    return [...handlers.entries()].map(([eventType, entries]) => ({
      eventType,
      handlerIds: [...entries.keys()]
    }));
  }

  return Object.freeze({ register, dispatch, listHandlers });
}
