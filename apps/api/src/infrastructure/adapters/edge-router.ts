import type { FastifyError, FastifyInstance } from "fastify";
import { applyMigrations } from "@moonwitness/orm";
import { authMigrations } from "../../db/migrations";
import { commandCenterMigrations } from "../../interface/routes/command-center.persistence";
import { seedBootstrapAdmin } from "../../services/user";
import { env, parseCorsOrigins } from "../../shared/env";
import { createRateLimiter, resolveRateLimitKey } from "../rate-limit";

type HookFn = (...args: unknown[]) => unknown;
type PluginFn = (instance: unknown, opts: Record<string, unknown>) => unknown;

interface RegisteredRoute {
  method: string;
  pattern: string;
  segments: string[];
  hasWildcard: boolean;
  isStatic: boolean;
  onRequest: HookFn[];
  preHandler: HookFn[];
  onSend: HookFn[];
  bufferRawBody: boolean;
  querystringSchema?: Record<string, unknown>;
  handler: HookFn;
}

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string | boolean;
  maxAge?: number;
  path?: string;
}

interface EdgeRawRequest {
  aborted: boolean;
  once(event: string, listener: () => void): void;
  off(event: string, listener: () => void): void;
}

interface EdgeRawReply {
  destroyed: boolean;
  once(event: string, listener: () => void): void;
  off(event: string, listener: () => void): void;
  writeHead(status: number, headers?: Record<string, string | string[]>): void;
  write(chunk: string | Uint8Array): void;
  end(): void;
}

interface EdgeState {
  routes: RegisteredRoute[];
  onReady: HookFn[];
  onClose: HookFn[];
  errorHandler: ((error: FastifyError, request: unknown, reply: unknown) => unknown) | null;
}

function normalizePath(prefix: string, path: string): string {
  const cleanPrefix = prefix.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!cleanPrefix) return cleanPath || "/";
  if (cleanPath === "/") return cleanPrefix;
  return `${cleanPrefix}${cleanPath}`;
}

function parseCookies(headerValue: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!headerValue) return cookies;
  for (const part of headerValue.split(";")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

function serializeCookie(name: string, value: string, opts: CookieOptions = {}): string {
  const segments = [`${name}=${encodeURIComponent(value)}`];
  segments.push(`Path=${opts.path ?? "/"}`);
  if (typeof opts.maxAge === "number") {
    segments.push(`Max-Age=${Math.max(0, Math.floor(opts.maxAge))}`);
  }
  if (opts.httpOnly) segments.push("HttpOnly");
  if (opts.secure) segments.push("Secure");
  if (opts.sameSite) {
    const sameSite =
      typeof opts.sameSite === "string"
        ? opts.sameSite.charAt(0).toUpperCase() + opts.sameSite.slice(1).toLowerCase()
        : "Lax";
    segments.push(`SameSite=${sameSite}`);
  }
  return segments.join("; ");
}

function parseSearchParams(search: string): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  if (!search || search === "?") return query;
  const params = new URLSearchParams(search);
  params.forEach((value, key) => {
    if (key in query) {
      const existing = query[key];
      query[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      query[key] = value;
    }
  });
  return query;
}

function validateAndCoerceQuery(
  query: Record<string, unknown>,
  schema?: Record<string, unknown>,
): string | null {
  if (!schema) return null;
  const props = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(query)) {
      if (!(key in props)) {
        return `querystring/${key} is not allowed`;
      }
    }
  }
  for (const [key, prop] of Object.entries(props)) {
    const raw = query[key];
    if (raw === undefined) {
      if (prop.default !== undefined) {
        query[key] = prop.default;
      }
      continue;
    }
    const type = prop.type;
    if (type === "integer" || type === "number") {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || (type === "integer" && !Number.isInteger(parsed))) {
        return `querystring/${key} must be ${String(type)}`;
      }
      if (typeof prop.minimum === "number" && parsed < prop.minimum) {
        return `querystring/${key} must be >= ${prop.minimum}`;
      }
      if (typeof prop.maximum === "number" && parsed > prop.maximum) {
        return `querystring/${key} must be <= ${prop.maximum}`;
      }
      query[key] = parsed;
    } else if (type === "string" && typeof raw === "string") {
      if (typeof prop.maxLength === "number" && raw.length > prop.maxLength) {
        return `querystring/${key} must NOT have more than ${prop.maxLength} characters`;
      }
      if (Array.isArray(prop.enum) && !prop.enum.includes(raw)) {
        return `querystring/${key} must be one of allowed values`;
      }
    }
  }
  return null;
}

function matchPath(
  routeSegments: string[],
  hasWildcard: boolean,
  pathSegments: string[],
): Record<string, string> | null {
  const params: Record<string, string> = {};
  for (let i = 0; i < routeSegments.length; i += 1) {
    const patternSeg = routeSegments[i]!;
    if (patternSeg === "*") {
      params["*"] = pathSegments.slice(i).join("/");
      return params;
    }
    if (i >= pathSegments.length) return null;
    const actualSeg = pathSegments[i]!;
    if (patternSeg.startsWith(":")) {
      try {
        params[patternSeg.slice(1)] = decodeURIComponent(actualSeg);
      } catch {
        params[patternSeg.slice(1)] = actualSeg;
      }
    } else if (patternSeg !== actualSeg) {
      return null;
    }
  }
  if (!hasWildcard && pathSegments.length !== routeSegments.length) return null;
  return params;
}

function writeEdgeLog(level: string, args: unknown[]): void {
  if (typeof process === "undefined" || typeof process.stdout?.write !== "function") return;
  process.stdout.write(`${JSON.stringify({ level, ts: Date.now(), args })}\n`);
}

const edgeLogger = {
  level: "info",
  msgPrefix: undefined,
  fatal: (...args: unknown[]) => writeEdgeLog("fatal", args),
  error: (...args: unknown[]) => writeEdgeLog("error", args),
  warn: (...args: unknown[]) => writeEdgeLog("warn", args),
  info: (...args: unknown[]) => writeEdgeLog("info", args),
  debug: (..._args: unknown[]) => undefined,
  trace: (..._args: unknown[]) => undefined,
  silent: (..._args: unknown[]) => undefined,
  child: () => edgeLogger,
};

function normalizeHookList(input: HookFn | HookFn[] | undefined): HookFn[] {
  if (!input) return [];
  return Array.isArray(input) ? input : [input];
}

class EdgeScope {
  constructor(
    private readonly rootState: EdgeState,
    private readonly scopePrefix: string,
    private readonly onRequestHooks: HookFn[],
    private readonly preHandlerHooks: HookFn[],
    private readonly onSendHooks: HookFn[],
    private readonly bufferParsers: boolean[],
  ) {}

  get log() {
    return edgeLogger;
  }

  get prefix(): string {
    return this.scopePrefix;
  }

  getOnSendSnapshot(): HookFn[] {
    return [...this.onSendHooks];
  }

  addHook(name: string, fn: HookFn): this {
    if (name === "onRequest") this.onRequestHooks.push(fn);
    else if (name === "preHandler") this.preHandlerHooks.push(fn);
    else if (name === "onSend") this.onSendHooks.push(fn);
    else if (name === "onReady") this.rootState.onReady.push(fn);
    else if (name === "onClose") this.rootState.onClose.push(fn);
    return this;
  }

  addContentTypeParser(
    contentType: string,
    optsOrParser: Record<string, unknown> | HookFn,
    _maybeParser?: HookFn,
  ): this {
    if (
      typeof optsOrParser === "object" &&
      optsOrParser !== null &&
      optsOrParser.parseAs === "buffer" &&
      contentType === "*/*"
    ) {
      this.bufferParsers[0] = true;
    }
    return this;
  }

  setErrorHandler(fn: (error: FastifyError, request: unknown, reply: unknown) => unknown): this {
    this.rootState.errorHandler = fn;
    return this;
  }

  async register(plugin: unknown, opts: Record<string, unknown> = {}): Promise<this> {
    if (
      typeof opts.max === "number" &&
      typeof opts.timeWindow === "number" &&
      typeof opts.keyGenerator === "function"
    ) {
      const limiter = createRateLimiter({ max: opts.max, windowMs: opts.timeWindow });
      const keyGenerator = opts.keyGenerator as (req: unknown) => string;
      const errorBuilder = opts.errorResponseBuilder as
        ((req: unknown, context: unknown) => unknown) | undefined;
      this.onRequestHooks.push(async (request: unknown, reply: unknown) => {
        const result = limiter.check(keyGenerator(request));
        const r = reply as EdgeReply;
        r.header("x-ratelimit-limit", opts.max as number);
        r.header("x-ratelimit-remaining", result.remaining);
        if (!result.allowed) {
          r.header("retry-after", Math.ceil(result.retryAfterMs / 1000));
          const body = errorBuilder
            ? errorBuilder(request, result)
            : { error: "too many requests" };
          return r.code(429).send(body);
        }
        return undefined;
      });
      return this;
    }

    if (typeof plugin !== "function") {
      return this;
    }

    const childPrefix =
      typeof opts.prefix === "string"
        ? normalizePath(this.scopePrefix, opts.prefix)
        : this.scopePrefix;

    const childScope = new EdgeScope(
      this.rootState,
      childPrefix,
      [...this.onRequestHooks],
      [...this.preHandlerHooks],
      [...this.onSendHooks],
      [...this.bufferParsers],
    );
    await (plugin as PluginFn)(childScope, opts);
    return this;
  }

  private addMethodRoute(
    method: string,
    path: string,
    optsOrHandler: unknown,
    maybeHandler?: unknown,
  ) {
    const opts =
      typeof optsOrHandler === "function" ? {} : ((optsOrHandler ?? {}) as Record<string, unknown>);
    const handler = (typeof optsOrHandler === "function" ? optsOrHandler : maybeHandler) as HookFn;
    const fullPath = normalizePath(this.scopePrefix, path);
    const segments = fullPath === "/" ? [] : fullPath.slice(1).split("/");
    const hasWildcard = segments.includes("*");
    const isStatic = !hasWildcard && !segments.some((s) => s.startsWith(":"));
    const schema = (opts.schema ?? {}) as Record<string, unknown>;

    this.rootState.routes.push({
      method: method.toUpperCase(),
      pattern: fullPath,
      segments,
      hasWildcard,
      isStatic,
      onRequest: [...this.onRequestHooks],
      preHandler: [
        ...this.preHandlerHooks,
        ...normalizeHookList(opts.preHandler as HookFn | HookFn[]),
      ],
      onSend: [...this.onSendHooks],
      bufferRawBody: this.bufferParsers[0] ?? false,
      querystringSchema: schema.querystring as Record<string, unknown> | undefined,
      handler,
    });
    return this;
  }

  get(path: string, optsOrHandler: unknown, maybeHandler?: unknown) {
    return this.addMethodRoute("GET", path, optsOrHandler, maybeHandler);
  }
  post(path: string, optsOrHandler: unknown, maybeHandler?: unknown) {
    return this.addMethodRoute("POST", path, optsOrHandler, maybeHandler);
  }
  put(path: string, optsOrHandler: unknown, maybeHandler?: unknown) {
    return this.addMethodRoute("PUT", path, optsOrHandler, maybeHandler);
  }
  patch(path: string, optsOrHandler: unknown, maybeHandler?: unknown) {
    return this.addMethodRoute("PATCH", path, optsOrHandler, maybeHandler);
  }
  delete(path: string, optsOrHandler: unknown, maybeHandler?: unknown) {
    return this.addMethodRoute("DELETE", path, optsOrHandler, maybeHandler);
  }
  head(path: string, optsOrHandler: unknown, maybeHandler?: unknown) {
    return this.addMethodRoute("HEAD", path, optsOrHandler, maybeHandler);
  }
  options(path: string, optsOrHandler: unknown, maybeHandler?: unknown) {
    return this.addMethodRoute("OPTIONS", path, optsOrHandler, maybeHandler);
  }
  all(path: string, optsOrHandler: unknown, maybeHandler?: unknown) {
    return this.addMethodRoute("ALL", path, optsOrHandler, maybeHandler);
  }
}

class EdgeReply {
  statusCode = 200;
  sent = false;
  payload: unknown = undefined;
  readonly headerEntries: Array<[string, string]> = [];
  private rawChunks: Uint8Array[] = [];
  private rawUsed = false;
  readonly raw: EdgeRawReply;

  constructor() {
    this.raw = {
      destroyed: false,
      once: () => undefined,
      off: () => undefined,
      writeHead: (status, headers) => {
        this.statusCode = status;
        this.rawUsed = true;
        if (headers) {
          for (const [k, v] of Object.entries(headers)) {
            if (Array.isArray(v)) {
              for (const item of v) this.header(k, item);
            } else {
              this.header(k, v);
            }
          }
        }
      },
      write: (chunk) => {
        this.rawUsed = true;
        this.rawChunks.push(typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk);
      },
      end: () => {
        this.sent = true;
        if (this.rawUsed) {
          this.payload = Buffer.concat(this.rawChunks);
        }
      },
    };
  }

  code(status: number): this {
    this.statusCode = status;
    return this;
  }

  status(status: number): this {
    return this.code(status);
  }

  type(contentType: string): this {
    return this.header("content-type", contentType);
  }

  header(key: string, value: string | number | string[]): this {
    const lower = key.toLowerCase();
    if (lower !== "set-cookie") {
      for (let i = this.headerEntries.length - 1; i >= 0; i -= 1) {
        if (this.headerEntries[i]![0].toLowerCase() === lower) {
          this.headerEntries.splice(i, 1);
        }
      }
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        this.headerEntries.push([key, String(item)]);
      }
    } else {
      this.headerEntries.push([key, String(value)]);
    }
    return this;
  }

  setCookie(name: string, value: string, opts?: CookieOptions): this {
    this.headerEntries.push(["set-cookie", serializeCookie(name, value, opts)]);
    return this;
  }

  clearCookie(name: string, opts?: CookieOptions): this {
    this.headerEntries.push(["set-cookie", serializeCookie(name, "", { ...opts, maxAge: 0 })]);
    return this;
  }

  send(payload?: unknown): this {
    this.sent = true;
    this.payload = payload;
    return this;
  }
}

export interface EdgeAppInstance {
  readonly serverAdapter: FastifyInstance;
  ready(): Promise<void>;
  close(): Promise<void>;
  fetch(request: Request): Promise<Response>;
}

/**
 * Builds a zero-`eval` / zero-`new Function` Web-Fetch-native Fastify-compatible runtime for Cloudflare Workers.
 */
export async function createEdgeFastifyAdapter(options: {
  prefix?: string;
}): Promise<EdgeAppInstance> {
  const { registerHealthRoutes } = await import("../../interface/routes/health.routes");
  const { authRoutes } = await import("../../interface/routes/auth.routes");
  const { controlRoutes } = await import("../../interface/routes/control.routes");
  const { radiusRoutes } = await import("../../interface/routes/radius.routes");
  const { storageRoutes } = await import("../../interface/routes/storage.routes");
  const { syslogRoutes } = await import("../../interface/routes/syslog.routes");
  const { snmpPollerRoutes } = await import("../../interface/routes/snmp-poller.routes");
  const { riotAiRoutes } = await import("../../interface/routes/riot-ai.routes");
  const { commandCenterRoutes } = await import("../../interface/routes/command-center.routes");
  const { memoryRoutes } = await import("../../interface/routes/memory.routes");

  const allowedOrigins = parseCorsOrigins(env.CORS_ORIGINS);
  const rootState: EdgeState = {
    routes: [],
    onReady: [],
    onClose: [],
    errorHandler: (error: FastifyError, _request: unknown, reply: unknown) => {
      const r = reply as EdgeReply;
      const status = error.statusCode ?? 500;
      if (env.NODE_ENV === "production" && status >= 500) {
        return r.code(status).send({ error: "internal server error" });
      }
      return r.code(status).send({ error: error.message });
    },
  };

  const root = new EdgeScope(rootState, "", [], [], [], [false]);

  root.addHook("onRequest", async (request: unknown, reply: unknown) => {
    const req = request as { id: string };
    const r = reply as EdgeReply;
    r.header("x-request-id", req.id);
  });

  root.addHook("onSend", async (_request: unknown, reply: unknown, payload: unknown) => {
    const r = reply as EdgeReply;
    r.header("x-content-type-options", "nosniff");
    r.header("x-frame-options", "DENY");
    r.header("referrer-policy", "no-referrer");
    return payload;
  });

  const maxRequests = Number(env.RATE_LIMIT_MAX);
  if (Number.isFinite(maxRequests) && maxRequests > 0) {
    const limiter = createRateLimiter({
      max: maxRequests,
      windowMs: Number(env.RATE_LIMIT_WINDOW_MS),
    });
    root.addHook("onRequest", async (request: unknown, reply: unknown) => {
      const req = request as { ip: string; headers: Record<string, string | string[] | undefined> };
      const r = reply as EdgeReply;
      const result = limiter.check(
        resolveRateLimitKey(req.ip, req.headers["x-forwarded-for"], env.TRUSTED_PROXY_COUNT),
      );
      r.header("x-ratelimit-limit", maxRequests);
      r.header("x-ratelimit-remaining", result.remaining);
      if (!result.allowed) {
        r.header("retry-after", Math.ceil(result.retryAfterMs / 1000));
        return r.code(429).send({ error: "too many requests" });
      }
      return undefined;
    });
  }

  await applyMigrations([...authMigrations, ...commandCenterMigrations]);
  await seedBootstrapAdmin();

  if (options.prefix) {
    await root.register(
      async (scope: unknown) => {
        const instance = scope as FastifyInstance;
        await registerHealthRoutes(instance);
        await instance.register(authRoutes);
        await instance.register(controlRoutes);
        await instance.register(radiusRoutes);
        await instance.register(storageRoutes);
        await instance.register(syslogRoutes);
        await instance.register(snmpPollerRoutes);
        await instance.register(riotAiRoutes);
        await instance.register(commandCenterRoutes);
        await instance.register(memoryRoutes);
      },
      { prefix: options.prefix },
    );
  }

  let readyRan = false;

  const findRoute = (method: string, pathname: string) => {
    const upper = method.toUpperCase();
    const pathSegments = pathname === "/" ? [] : pathname.slice(1).split("/");
    let best: { route: RegisteredRoute; params: Record<string, string> } | null = null;
    for (const route of rootState.routes) {
      if (route.method !== upper && route.method !== "ALL") continue;
      const params = matchPath(route.segments, route.hasWildcard, pathSegments);
      if (!params) continue;
      if (route.isStatic) return { route, params };
      if (!best || (!route.hasWildcard && best.route.hasWildcard)) {
        best = { route, params };
      }
    }
    return best;
  };

  const applyCors = (request: Request, reply: EdgeReply): void => {
    const origin = request.headers.get("origin");
    if (!origin) return;
    if (allowedOrigins.includes(origin)) {
      reply.header("access-control-allow-origin", origin);
      reply.header("access-control-allow-credentials", "true");
      reply.header("vary", "Origin");
    }
  };

  const toResponse = (method: string, reply: EdgeReply): Response => {
    const headers = new Headers();
    for (const [k, v] of reply.headerEntries) {
      headers.append(k, v);
    }

    let body: ConstructorParameters<typeof Response>[0] = null;
    if (
      method !== "HEAD" &&
      reply.statusCode !== 204 &&
      reply.statusCode !== 205 &&
      reply.statusCode !== 304
    ) {
      if (Buffer.isBuffer(reply.payload) || reply.payload instanceof Uint8Array) {
        body = new Uint8Array(reply.payload);
      } else if (typeof reply.payload === "string") {
        if (!headers.has("content-type")) {
          headers.set("content-type", "text/plain; charset=utf-8");
        }
        body = reply.payload;
      } else if (reply.payload !== undefined) {
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json; charset=utf-8");
        }
        body = JSON.stringify(reply.payload);
      }
    }

    return new Response(body, { status: reply.statusCode, headers });
  };

  return {
    serverAdapter: root as unknown as FastifyInstance,
    async ready() {
      if (readyRan) return;
      readyRan = true;
      rootState.routes.sort((a, b) => {
        if (a.isStatic !== b.isStatic) return a.isStatic ? -1 : 1;
        if (a.hasWildcard !== b.hasWildcard) return a.hasWildcard ? 1 : -1;
        return 0;
      });
      for (const hook of rootState.onReady) {
        await hook();
      }
    },
    async close() {
      for (const hook of rootState.onClose) {
        await hook();
      }
    },
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const method = request.method.toUpperCase();
      const reply = new EdgeReply();
      const inboundId = request.headers.get("x-request-id");
      const reqId =
        typeof inboundId === "string" && inboundId.length > 0 && inboundId.length <= 200
          ? inboundId
          : crypto.randomUUID();
      reply.header("x-request-id", reqId);
      applyCors(request, reply);

      if (method === "OPTIONS") {
        reply.header("access-control-allow-methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        const reqHeaders = request.headers.get("access-control-request-headers");
        if (reqHeaders) {
          reply.header("access-control-allow-headers", reqHeaders);
        } else {
          reply.header("access-control-allow-headers", "Content-Type, Authorization");
        }
        return toResponse(method, reply.code(204));
      }

      const headersMap: Record<string, string | undefined> = {};
      request.headers.forEach((value, key) => {
        headersMap[key.toLowerCase()] = value;
      });

      const match = findRoute(method, url.pathname);
      const query = parseSearchParams(url.search);
      const ip =
        request.headers.get("cf-connecting-ip")?.trim() ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "127.0.0.1";

      const rawReq: EdgeRawRequest = {
        aborted: request.signal.aborted,
        once: (event, listener) => {
          if (event === "aborted")
            request.signal.addEventListener("abort", listener, { once: true });
        },
        off: (event, listener) => {
          if (event === "aborted") request.signal.removeEventListener("abort", listener);
        },
      };

      let parsedBody: unknown = undefined;
      if (method !== "GET" && method !== "HEAD") {
        const rawBytes = new Uint8Array(await request.arrayBuffer());
        if (rawBytes.byteLength > 0) {
          const contentType = (headersMap["content-type"] ?? "").toLowerCase();
          if (match?.route.bufferRawBody) {
            parsedBody = Buffer.from(rawBytes);
          } else if (contentType.includes("application/json")) {
            try {
              parsedBody = JSON.parse(new TextDecoder().decode(rawBytes));
            } catch {
              const badJson = new Error("Invalid JSON request body") as FastifyError;
              badJson.statusCode = 400;
              reply.code(400).send({ error: badJson.message });
              return toResponse(method, reply);
            }
          } else {
            parsedBody = new TextDecoder().decode(rawBytes);
          }
        }
      }

      const reqObj = {
        id: reqId,
        method,
        url: `${url.pathname}${url.search}`,
        protocol: url.protocol.replace(":", ""),
        ip,
        headers: headersMap,
        cookies: parseCookies(headersMap.cookie),
        params: match?.params ?? {},
        query,
        body: parsedBody,
        log: edgeLogger,
        raw: rawReq,
      };

      const runOnSend = async (hooks: HookFn[]) => {
        for (const hook of hooks) {
          reply.payload = await hook(reqObj, reply, reply.payload);
        }
      };

      if (!match) {
        reply.code(404).send({
          message: `Route ${method}:${url.pathname} not found`,
          error: "Not Found",
          statusCode: 404,
        });
        await runOnSend(root.getOnSendSnapshot());
        return toResponse(method, reply);
      }

      const { route } = match;
      try {
        for (const hook of route.onRequest) {
          if (reply.sent) break;
          await hook(reqObj, reply);
        }
        if (!reply.sent && route.querystringSchema) {
          const validationError = validateAndCoerceQuery(query, route.querystringSchema);
          if (validationError) {
            const err = new Error(validationError) as FastifyError;
            err.statusCode = 400;
            throw err;
          }
        }
        for (const hook of route.preHandler) {
          if (reply.sent) break;
          await hook(reqObj, reply);
        }
        if (!reply.sent) {
          const result = await route.handler(reqObj, reply);
          if (!reply.sent && result !== reply) {
            reply.send(result);
          }
        }
      } catch (error) {
        if (rootState.errorHandler && !reply.sent) {
          await rootState.errorHandler(error as FastifyError, reqObj, reply);
        } else if (!reply.sent) {
          reply.code(500).send({ error: "internal server error" });
        }
      }

      await runOnSend(route.onSend);
      return toResponse(method, reply);
    },
  };
}
