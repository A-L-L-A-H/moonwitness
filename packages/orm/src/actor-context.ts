import { PolicyError } from "./errors.js";

export type ActorSource = "seed" | "api" | "import" | "migration";

export const DEFAULT_TENANT_ID = "default";
const TENANT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

/** Validates and normalizes an actor or record tenant identifier. */
export function normalizeTenantId(tenantId?: string | null): string {
  const trimmed = tenantId?.trim();
  if (!trimmed) return DEFAULT_TENANT_ID;
  if (!TENANT_ID_PATTERN.test(trimmed)) {
    throw new Error(`Invalid tenant identifier '${trimmed}'.`);
  }
  return trimmed;
}

export interface ActorContext {
  actorId: string | null; // null = system job (seed/cron/migration)
  source: ActorSource;
  requestId?: string; // correlation ID
  tenantId?: string;
}

export function createActorContext(
  actorId: string | null,
  source: ActorSource = "api",
  requestId?: string,
  tenantId?: string,
): ActorContext {
  return {
    actorId,
    source,
    requestId,
    ...(tenantId !== undefined ? { tenantId: normalizeTenantId(tenantId) } : {}),
  };
}

export const SYSTEM_ACTOR: ActorContext = createActorContext(null, "seed");

/** Returns true only for internal system seed/migration actors. */
export function isSystemActor(actor: ActorContext): boolean {
  return actor.actorId === null && (actor.source === "seed" || actor.source === "migration");
}

/** Validates that the actor carries an explicit non-blank tenantId and returns it normalized. */
export function requireActorTenantId(actor: ActorContext): string {
  const raw = actor.tenantId;
  if (typeof raw !== "string" || !raw.trim()) {
    throw new PolicyError("Actor context requires an explicit tenantId", "TENANT_REQUIRED", 403);
  }
  return normalizeTenantId(raw);
}
