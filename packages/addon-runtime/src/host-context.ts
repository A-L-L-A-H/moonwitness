import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createActorContext,
  DEFAULT_TENANT_ID,
  normalizeTenantId,
  type ActorContext,
} from "@moonwitness/orm";
import type { CrewRoleOrPublic } from "./runtime.js";
import type { EdgeLoopbackErrorPayload, UpstreamCorrelationInput } from "./upstream.js";

export type FastifyPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
) => Promise<void> | void;

export interface BaseAddonAuthBridge {
  authenticate: FastifyPreHandler;
  optionalAuthenticate?: FastifyPreHandler;
  requireRole: (...roles: Array<"admin" | "editor" | "viewer">) => FastifyPreHandler;
  getActorRole: (request: FastifyRequest) => CrewRoleOrPublic;
  getActorId: (request: FastifyRequest) => string | null;
  getActorTenant?: (request: FastifyRequest) => string;
  getActorGroups?: (request: FastifyRequest) => string[];
  resolveActorContext?: (request: FastifyRequest, source?: ActorContext["source"]) => ActorContext;
}

export type HostRateLimitFactory = (options: {
  max: number;
  windowMs: number;
  scope: string;
  message?: string;
}) => FastifyPreHandler;

export interface HostProxyBridge {
  readonly resolveServiceUrl: (envVar: string, defaultLocalUrl: string) => string;
  readonly buildHeaders: (
    request: FastifyRequest,
    baseHeaders?: Record<string, string>,
  ) => Record<string, string>;
  readonly checkEdgeLoopback: (
    serviceName: string,
    envVar: string,
    urlString: string,
  ) => EdgeLoopbackErrorPayload | null;
}

export interface HostMidConfig {
  readonly keyEncryptionSecret?: string;
  readonly issuerUrl: string;
  readonly cookieDomain?: string;
  readonly corsOrigins?: string;
}

export interface AddonHostContext {
  readonly prefix: string;
  readonly auth: BaseAddonAuthBridge;
  readonly rateLimit?: HostRateLimitFactory;
  readonly proxy?: HostProxyBridge;
  readonly mid?: HostMidConfig;
  readonly seedDemo?: boolean;
}

export const defaultFailClosedAuthBridge: BaseAddonAuthBridge = {
  authenticate: async (request, reply) => {
    const user = (request as { user?: { id?: unknown; role?: unknown } }).user;
    if (!user) {
      await reply.code(401).send({ error: "Not authenticated" });
    }
  },
  optionalAuthenticate: async () => {},
  requireRole: (...roles) => {
    return async (request, reply) => {
      const user = (request as { user?: { role?: string } }).user;
      if (!user) {
        await reply.code(401).send({ error: "Not authenticated" });
        return;
      }
      if (!user.role || !roles.includes(user.role as "admin" | "editor" | "viewer")) {
        await reply.code(403).send({ error: "Forbidden: insufficient permissions" });
      }
    };
  },
  getActorRole: (request) => {
    const role = (request as { user?: { role?: string } }).user?.role;
    if (role === "admin" || role === "editor" || role === "viewer") return role;
    return "public";
  },
  getActorId: (request) => {
    const id = (request as { user?: { id?: unknown } }).user?.id;
    return id !== undefined && id !== null ? String(id) : null;
  },
  getActorTenant: (request) => {
    const reqWithTenant = request as { tenantId?: unknown; user?: { tenantId?: unknown } };
    const raw = reqWithTenant.tenantId ?? reqWithTenant.user?.tenantId;
    if (typeof raw === "string" && raw.trim()) {
      try {
        return normalizeTenantId(raw);
      } catch {
        return DEFAULT_TENANT_ID;
      }
    }
    return DEFAULT_TENANT_ID;
  },
};

export function resolveActorTenantFromBridge(
  auth: BaseAddonAuthBridge,
  request: FastifyRequest,
): string {
  const fromAuth = auth.getActorTenant?.(request);
  if (fromAuth && fromAuth.trim()) {
    try {
      return normalizeTenantId(fromAuth);
    } catch {
      return DEFAULT_TENANT_ID;
    }
  }
  return defaultFailClosedAuthBridge.getActorTenant!(request);
}

export function resolveActorContextFromBridge(
  auth: BaseAddonAuthBridge,
  request: FastifyRequest,
  source: ActorContext["source"] = "api",
): ActorContext {
  if (auth.resolveActorContext) {
    return auth.resolveActorContext(request, source);
  }
  const actorId = auth.getActorId(request);
  const tenantId = resolveActorTenantFromBridge(auth, request);
  const requestId = (request as UpstreamCorrelationInput).id;
  return createActorContext(actorId, source, requestId, tenantId);
}

interface CookieAwareRequest {
  cookies?: Record<string, string | undefined>;
}

interface CookieAwareReply {
  setCookie?: (name: string, value: string, options?: Record<string, unknown>) => unknown;
  clearCookie?: (name: string, options?: Record<string, unknown>) => unknown;
}

export function getRequestCookie(request: FastifyRequest, name: string): string | undefined {
  return (request as unknown as CookieAwareRequest).cookies?.[name];
}

export function setReplyCookie(
  reply: FastifyReply,
  name: string,
  value: string,
  options?: Record<string, unknown>,
): void {
  (reply as unknown as CookieAwareReply).setCookie?.(name, value, options);
}

export function clearReplyCookie(
  reply: FastifyReply,
  name: string,
  options?: Record<string, unknown>,
): void {
  (reply as unknown as CookieAwareReply).clearCookie?.(name, options);
}
