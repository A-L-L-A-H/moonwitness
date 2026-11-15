/**
 * Authentication middleware
 * Validates session cookie and attaches user to request
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { getSessionWithUser, SESSION_COOKIE_NAME } from "../services/session";

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: number;
    username: string;
    email: string;
    role: "admin" | "editor" | "viewer";
    displayName: string;
  };
}

type AuthenticatedUser = NonNullable<AuthenticatedRequest["user"]>;

async function resolveAuthenticatedUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<AuthenticatedUser | null> {
  if (request.method === "OPTIONS") return null;

  const typedReq = request as AuthenticatedRequest;
  if (typedReq.user) return typedReq.user;

  const sessionId = request.cookies?.[SESSION_COOKIE_NAME];
  if (!sessionId) {
    reply.code(401).send({ error: "Not authenticated" });
    return null;
  }

  const session = await getSessionWithUser(sessionId);
  if (!session) {
    reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    reply.code(401).send({ error: "Session expired or invalid" });
    return null;
  }

  typedReq.user = {
    id: session.userId,
    username: session.username,
    email: session.email,
    role: session.role,
    displayName: session.displayName,
  };
  return typedReq.user;
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  await resolveAuthenticatedUser(request, reply);
}

export function requireAuth() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await resolveAuthenticatedUser(request, reply);
  };
}

export function requireRole(...allowedRoles: ("admin" | "editor" | "viewer")[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await resolveAuthenticatedUser(request, reply);
    if (!user) return;

    if (!allowedRoles.includes(user.role)) {
      return reply.code(403).send({ error: "Forbidden: insufficient permissions" });
    }
  };
}

export function optionalAuth() {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (request.method === "OPTIONS") return;
    const sessionId = request.cookies?.[SESSION_COOKIE_NAME];
    if (!sessionId) return;

    const session = await getSessionWithUser(sessionId);
    if (session) {
      const typedReq = request as AuthenticatedRequest;
      typedReq.user = {
        id: session.userId,
        username: session.username,
        email: session.email,
        role: session.role,
        displayName: session.displayName,
      };
    }
  };
}
