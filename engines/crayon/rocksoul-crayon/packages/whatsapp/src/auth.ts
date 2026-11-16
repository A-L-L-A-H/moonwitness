import type { FastifyRequest, FastifyReply } from 'fastify';
import { createHmac } from 'node:crypto';
import type { DatabaseContext } from './db.js';
import { validateApiKey } from './db.js';

export const WA_SESSION_COOKIE = 'wa_dashboard_session';
export const DEFAULT_WA_PASSWORD = process.env.WA_DASHBOARD_PASSWORD || '210491';

export function getSessionToken(password = DEFAULT_WA_PASSWORD): string {
  return createHmac('sha256', password)
    .update('rocksoul_wa_gateway_session_v1')
    .digest('hex');
}

export function isAuthorized(req: FastifyRequest, password = DEFAULT_WA_PASSWORD): boolean {
  const token = getSessionToken(password);

  // 1. Signed session cookie
  const cookieVal = (req as FastifyRequest & { cookies?: Record<string, string> }).cookies?.[WA_SESSION_COOKIE];
  if (cookieVal && cookieVal === token) {
    return true;
  }

  // 2. Query param ?key=...
  const query = req.query as Record<string, string> | undefined;
  if (query?.key && query.key === password) {
    return true;
  }

  // 3. Header x-dashboard-key
  const headerKey = req.headers['x-dashboard-key'];
  if (typeof headerKey === 'string' && headerKey === password) {
    return true;
  }

  // 4. Authorization: Bearer <password>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader === `Bearer ${password}`) {
    return true;
  }

  return false;
}

export function createAuthPreHandlers(dbContext: DatabaseContext, password = DEFAULT_WA_PASSWORD) {
  /**
   * For web dashboard pages: redirects to /login if unauthenticated
   */
  const requireWebAuth = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!isAuthorized(req, password)) {
      return reply.redirect('/login');
    }
  };

  /**
   * For REST API endpoints: allows either Dashboard Admin auth (password/cookie) OR valid x-api-key from SQLite
   */
  const requireApiOrKeyAuth = async (req: FastifyRequest, reply: FastifyReply) => {
    if (isAuthorized(req, password)) {
      return;
    }

    let rawApiKey = (req.headers['x-api-key'] as string) || (req.headers['api-key'] as string);
    if (!rawApiKey && req.headers.authorization?.startsWith('Bearer ')) {
      rawApiKey = req.headers.authorization.slice(7).trim();
    }

    if (rawApiKey) {
      const validKey = await validateApiKey(dbContext.db, rawApiKey);
      if (validKey) {
        (req as unknown as { apiKey: unknown }).apiKey = validKey;
        return;
      }
    }

    return reply.status(401).send({
      success: false,
      error: 'Unauthorized: Invalid API Key or Dashboard credentials',
    });
  };

  return {
    requireWebAuth,
    requireApiOrKeyAuth,
  };
}
