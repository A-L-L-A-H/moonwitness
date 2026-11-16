export * from "./compensation.js";
export * from "./execution.js";

export interface Clock {
  now(): string;
}

export interface IdentityProvider {
  next(scope: string): string;
}

export interface RuntimeProviders {
  clock: Clock;
  identity: IdentityProvider;
}

export function createFixedClock(timestamp: string): Clock {
  assertValidTime(timestamp);
  return Object.freeze({ now: () => timestamp });
}

export function createSequenceIdentityProvider(prefix = "crayon", start = 1): IdentityProvider {
  if (!nonEmpty(prefix)) throw new Error("Identity prefix must be non-empty.");
  if (!Number.isSafeInteger(start) || start < 0) throw new Error("Identity sequence start must be a non-negative safe integer.");
  let sequence = start;
  return Object.freeze({
    next(scope: string): string {
      if (!nonEmpty(scope)) throw new Error("Identity scope must be non-empty.");
      const id = `${prefix}:${scope}:${sequence}`;
      sequence += 1;
      return id;
    },
  });
}

export const systemClock: Clock = Object.freeze({
  now(): string {
    return new Date().toISOString();
  },
});

export const systemIdentityProvider: IdentityProvider = Object.freeze({
  next(scope: string): string {
    if (!nonEmpty(scope)) throw new Error("Identity scope must be non-empty.");
    const cryptoObject = globalThis.crypto;
    if (!cryptoObject?.randomUUID) {
      throw new Error("System identity provider requires globalThis.crypto.randomUUID(). Supply an explicit provider in this runtime.");
    }
    return `${scope}:${cryptoObject.randomUUID()}`;
  },
});

export const systemRuntimeProviders: RuntimeProviders = Object.freeze({
  clock: systemClock,
  identity: systemIdentityProvider,
});

export function createRuntimeProviders(input?: Partial<RuntimeProviders>): RuntimeProviders {
  return Object.freeze({
    clock: input?.clock ?? systemClock,
    identity: input?.identity ?? systemIdentityProvider,
  });
}

export function createRuntimeStamp(providers: RuntimeProviders, scope: string): Readonly<{ id: string; at: string }> {
  const at = providers.clock.now();
  assertValidTime(at);
  return Object.freeze({
    id: providers.identity.next(scope),
    at,
  });
}

function assertValidTime(value: string): void {
  if (!nonEmpty(value) || !Number.isFinite(Date.parse(value))) throw new Error("Clock must return a valid timestamp.");
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
