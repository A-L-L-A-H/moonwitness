import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import {
  apiKeys,
  userSessions,
  users,
  hashApiKey,
  eq,
  and,
  type User,
  type ApiKey,
  type UserSession,
} from '@rocksoul/orm';
import { normalizeRole, type AuthorizationPrincipal } from '../security/authorization.js';

export interface AuthContext {
  user?: User | null;
  apiKey?: ApiKey | null;
  session?: UserSession | null;
  principal?: AuthorizationPrincipal;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: User | null;
    apiKey?: ApiKey | null;
    session?: UserSession | null;
    principal?: AuthorizationPrincipal;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function authPlugin(app: FastifyInstance): Promise<void> {
  // Middleware/preHandler otentikasi dual-mode (API Key atau Bearer Session Token)
  const authenticate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const rawApiKey =
      (request.headers['x-api-key'] as string) ||
      (request.headers['api-key'] as string);

    const authHeader = request.headers['authorization'];
    const queryToken = request.url.startsWith('/aep') ? (request.query as { access_token?: string } | undefined)?.access_token : undefined;
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : queryToken || null;

    // 1. Validasi via API Key (x-api-key)
    if (rawApiKey) {
      const keyHash = hashApiKey(rawApiKey);
      const keyRows = await app.db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)))
        .limit(1);

      const apiKeyRecord = keyRows[0];
      if (!apiKeyRecord) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid or inactive API Key',
          error: { code: 'UNAUTHORIZED', statusCode: 401 },
          timestamp: new Date().toISOString(),
        });
      }

      // Cek expiry
      if (apiKeyRecord.expiresAt && new Date(apiKeyRecord.expiresAt) < new Date()) {
        return reply.status(401).send({
          success: false,
          message: 'API Key has expired',
          error: { code: 'UNAUTHORIZED', statusCode: 401 },
          timestamp: new Date().toISOString(),
        });
      }

      // Perbarui last_used_at secara non-blocking
      app.db
        .update(apiKeys)
        .set({ lastUsedAt: new Date().toISOString() })
        .where(eq(apiKeys.id, apiKeyRecord.id))
        .catch(() => {});

      request.apiKey = apiKeyRecord;

      // Jika API Key diasosiasikan dengan user
      if (apiKeyRecord.userId) {
        const userRows = await app.db
          .select()
          .from(users)
          .where(eq(users.id, apiKeyRecord.userId))
          .limit(1);
        request.user = userRows[0] || null;
      }

      const role = normalizeRole(request.user?.role);
      const scopes = parseScopes(apiKeyRecord.scopes);
      if (request.user && role && scopes) request.principal = { userId: request.user.id, role, apiKeyScopes: scopes };

      return;
    }

    // 2. Validasi via Bearer Session Token
    if (bearerToken) {
      const tokenHash = hashApiKey(bearerToken);
      const sessionRows = await app.db
        .select()
        .from(userSessions)
        .where(and(eq(userSessions.tokenHash, tokenHash), eq(userSessions.isRevoked, false)))
        .limit(1);

      const sessionRecord = sessionRows[0];
      if (!sessionRecord) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid or revoked session token',
          error: { code: 'UNAUTHORIZED', statusCode: 401 },
          timestamp: new Date().toISOString(),
        });
      }

      // Cek expiry session
      if (new Date(sessionRecord.expiresAt) < new Date()) {
        return reply.status(401).send({
          success: false,
          message: 'Session token has expired',
          error: { code: 'UNAUTHORIZED', statusCode: 401 },
          timestamp: new Date().toISOString(),
        });
      }

      // Ambil user
      const userRows = await app.db
        .select()
        .from(users)
        .where(eq(users.id, sessionRecord.userId))
        .limit(1);

      const userRecord = userRows[0];
      if (!userRecord || !userRecord.isActive) {
        return reply.status(401).send({
          success: false,
          message: 'User account is inactive or not found',
          error: { code: 'UNAUTHORIZED', statusCode: 401 },
          timestamp: new Date().toISOString(),
        });
      }

      request.session = sessionRecord;
      request.user = userRecord;
      const role = normalizeRole(userRecord.role);
      if (role) request.principal = { userId: userRecord.id, role };
      return;
    }

    // Jika tidak menyertakan credential apapun
    return reply.status(401).send({
      success: false,
      message: 'Authentication required. Provide header "x-api-key" or "Authorization: Bearer <token>"',
      error: { code: 'UNAUTHORIZED', statusCode: 401 },
      timestamp: new Date().toISOString(),
    });
  };

  app.decorate('authenticate', authenticate);
}

function parseScopes(value: string): readonly string[] | undefined {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every(scope => typeof scope === 'string') ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export const registerAuth = fp(authPlugin, {
  name: 'rocksoul-auth',
  dependencies: ['rocksoul-db'],
});
