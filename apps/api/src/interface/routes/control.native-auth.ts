import type { FastifyReply, FastifyRequest } from "fastify";
import { getDb } from "@moonwitness/orm";
import { resolveRequestIdentity } from "../../middleware/auth";
import {
  createSession,
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  getSessionCookieOptions,
  revokeSession,
  SESSION_COOKIE_NAME,
  verifyUserPassword,
} from "@moonwitness/addons/auth";
import { getEdgeLoopbackErrorPayload } from "../../shared/upstream";
import { getArsyUrl } from "./control.upstream";

export function isNativeSetupEnabled(): boolean {
  if (process.env.CONTROL_NATIVE_SETUP === "1") return true;
  if (process.env.CONTROL_NATIVE_SETUP === "0") return false;
  return process.env.NODE_ENV === "development" && !process.env.ARSY_URL?.trim();
}

function isHttpsRequest(request: FastifyRequest): boolean {
  const forwardedProto = request.headers["x-forwarded-proto"];
  if (typeof forwardedProto === "string") {
    return forwardedProto.split(",")[0]?.trim().toLowerCase() === "https";
  }
  return request.protocol === "https";
}

function getControlSessionCookieOptions(request: FastifyRequest) {
  return {
    ...getSessionCookieOptions(),
    secure: process.env.NODE_ENV === "production" ? isHttpsRequest(request) : false,
  };
}

function toIsoTimestamp(raw: unknown): string | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return new Date(raw < 1e12 ? raw * 1000 : raw).toISOString();
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      const parsedUtc = new Date(`${trimmed.replace(" ", "T")}Z`);
      return Number.isNaN(parsedUtc.getTime()) ? undefined : parsedUtc.toISOString();
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }
  return undefined;
}

function formatControlUser(user: {
  id: string | number;
  displayName: string;
  email: string;
  role: string;
  createdAt?: Date | string | number;
}) {
  return {
    id: String(user.id),
    name: user.displayName,
    email: user.email,
    role: user.role === "admin" ? "superadmin" : "readonly",
    created_at:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : (toIsoTimestamp(user.createdAt) ?? new Date().toISOString()),
  };
}

export function sendNoStoreJson(reply: FastifyReply, statusCode: number, payload: unknown) {
  return reply.code(statusCode).header("cache-control", "no-store").send(payload);
}

export async function handleNativeSetupStatus(reply: FastifyReply) {
  const row = await getDb().get<{ count: number; initialized_at: string | number | null }>(
    "SELECT COUNT(*) as count, MIN(create_date) as initialized_at FROM auth_users",
  );
  const initialized = (row?.count ?? 0) > 0;
  const initializedAt = initialized ? toIsoTimestamp(row?.initialized_at) : undefined;
  return sendNoStoreJson(reply, 200, {
    initialized,
    version: "0.1.0",
    instance: {
      id: process.env.INSTANCE_ID?.trim() || "moonwitness-vps",
      name: process.env.INSTANCE_NAME?.trim() || "Moonwitness",
      ...(initializedAt ? { initialized_at: initializedAt } : {}),
      version: "0.1.0",
    },
  });
}

async function syncSuperuserToArsyBestEffort(payload: {
  name: string;
  email: string;
  password: string;
  instance_name: string;
}): Promise<void> {
  if (!process.env.ARSY_URL?.trim()) return;
  const arsyUrl = getArsyUrl();
  if (getEdgeLoopbackErrorPayload("arsy", "ARSY_URL", arsyUrl)) return;
  try {
    await fetch(`${arsyUrl}/v1/setup/superuser`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2_000),
    });
  } catch {
    // Non-blocking when host daemon is offline or container-isolated.
  }
}

export async function handleNativeCreateSuperuser(request: FastifyRequest, reply: FastifyReply) {
  const rawBody = request.body as Record<string, unknown> | undefined;
  const name = typeof rawBody?.name === "string" ? rawBody.name.trim() : "";
  const email = typeof rawBody?.email === "string" ? rawBody.email.trim().toLowerCase() : "";
  const password = typeof rawBody?.password === "string" ? rawBody.password : "";
  const instanceName =
    typeof rawBody?.instance_name === "string" ? rawBody.instance_name.trim() : "";

  if (name.length < 2) {
    return sendNoStoreJson(reply, 400, { error: "Nama minimal 2 karakter" });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return sendNoStoreJson(reply, 400, { error: "Format email tidak valid" });
  }
  const passwordBytes = Buffer.byteLength(password, "utf8");
  if (passwordBytes < 12 || passwordBytes > 72) {
    return sendNoStoreJson(reply, 400, { error: "Password harus 12–72 karakter" });
  }

  const existing = await getDb().get<{ count: number }>("SELECT COUNT(*) as count FROM auth_users");
  if ((existing?.count ?? 0) > 0) {
    return sendNoStoreJson(reply, 409, { error: "instance sudah diinisialisasi" });
  }

  const localPart = email.split("@")[0] ?? "admin";
  const username = localPart.replace(/[^a-z0-9_.-]/g, "").slice(0, 32) || "admin";

  let user;
  try {
    user = await createUser({
      username,
      email,
      password,
      role: "admin",
      displayName: name,
    });
  } catch (error) {
    const afterRace = await getDb().get<{ count: number }>(
      "SELECT COUNT(*) as count FROM auth_users",
    );
    if ((afterRace?.count ?? 0) > 0) {
      return sendNoStoreJson(reply, 409, { error: "instance sudah diinisialisasi" });
    }
    throw error;
  }

  if (instanceName) {
    process.env.INSTANCE_NAME = instanceName;
  }

  const sessionId = await createSession(user.id);
  reply.setCookie(SESSION_COOKIE_NAME, sessionId, getControlSessionCookieOptions(request));

  await syncSuperuserToArsyBestEffort({
    name,
    email,
    password,
    instance_name: instanceName || process.env.INSTANCE_NAME || "Moonwitness",
  });

  return sendNoStoreJson(reply, 201, {
    initialized: true,
    user: formatControlUser(user),
  });
}

export async function handleNativeAuthLogin(request: FastifyRequest, reply: FastifyReply) {
  const rawBody = request.body as Record<string, unknown> | undefined;
  const identifier = typeof rawBody?.email === "string" ? rawBody.email.trim() : "";
  const password = typeof rawBody?.password === "string" ? rawBody.password : "";

  if (!identifier || !password) {
    return sendNoStoreJson(reply, 400, { error: "Email dan password wajib diisi" });
  }

  const normalized = identifier.toLowerCase();
  const user =
    (await findUserByEmail(normalized)) ??
    (await findUserByUsername(normalized)) ??
    (await findUserByUsername(identifier));

  if (!user || !(await verifyUserPassword(user, password))) {
    return sendNoStoreJson(reply, 401, { error: "Email atau password salah" });
  }

  const sessionId = await createSession(user.id);
  reply.setCookie(SESSION_COOKIE_NAME, sessionId, getControlSessionCookieOptions(request));

  return sendNoStoreJson(reply, 200, {
    user: formatControlUser(user),
  });
}

export async function handleNativeAuthMe(request: FastifyRequest, reply: FastifyReply) {
  const { user, expiredSessionCookie } = await resolveRequestIdentity(request);
  if (!user) {
    if (expiredSessionCookie) {
      reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    }
    return sendNoStoreJson(reply, 401, { error: "Not authenticated" });
  }
  const fullUser = await findUserById(user.id);
  return sendNoStoreJson(reply, 200, {
    user: formatControlUser(fullUser ?? user),
  });
}

export async function handleNativeAuthLogout(request: FastifyRequest, reply: FastifyReply) {
  const sessionToken = request.cookies?.[SESSION_COOKIE_NAME];
  if (sessionToken) {
    await revokeSession(sessionToken);
  }
  reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  return sendNoStoreJson(reply, 200, { ok: true });
}
