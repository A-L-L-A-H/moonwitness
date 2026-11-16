import type { FastifyInstance } from 'fastify';
import { randomBytes, randomUUID } from 'node:crypto';
import { successResponse, errorResponse } from '@rocksoul/common';
import {
  users,
  apiKeys,
  userSessions,
  passwordResetTokens,
  hashPassword,
  verifyPassword,
  hashApiKey,
  generateApiKey,
  generateSessionToken,
  and,
  eq,
  gt,
  isNull,
  ne,
  type NewUser,
  type NewApiKey,
  type NewUserSession,
  type NewPasswordResetToken,
} from '@rocksoul/orm';
import { isKnownScope, scopesFor } from '../../security/authorization.js';
import { env } from '../../config/env.js';

const passwordMinLength = 8;
const resetTokenTtlMs = 60 * 60 * 1000;

function createPasswordResetToken(): { rawToken: string; tokenHash: string } {
  const rawToken = `prt_${randomBytes(32).toString('hex')}`;
  return { rawToken, tokenHash: hashApiKey(rawToken) };
}

function safeSession(session: { id: string; ipAddress: string | null; userAgent: string | null; expiresAt: string; createdAt: string; isRevoked: boolean }, currentId?: string) {
  return {
    id: session.id,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    isCurrent: session.id === currentId,
  };
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // 1. Registrasi User Baru
  app.post<{
    Body: {
      name: string;
      email: string;
      password?: string;
      orgId?: string;
    };
  }>(
    '/register',
    {
      schema: {
        description: 'Register a new user account with hashed password',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            orgId: { type: 'string' },
          }, additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { name, email, password = '', orgId } = request.body;

      // Cek apakah email sudah terdaftar
      const existing = await app.db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing[0]) {
        return reply.badRequest(`Email '${email}' is already registered`);
      }

      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();

      const newUser: NewUser = {
        id: `usr_${Date.now()}`,
        name,
        email,
        passwordHash,
        role: 'user',
        orgId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: 'auth/register',
      };

      await app.db.insert(users).values(newUser);
      if (orgId) {
        await app.dbClient.execute({ sql: 'INSERT OR IGNORE INTO organization_members (id, organization_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)', args: [`mem_${Date.now()}`, orgId, newUser.id, 'member', now] });
      }

      // Sembunyikan hash password dari output respon
      const { passwordHash: _, ...safeUser } = newUser;

      return reply.code(201).send(successResponse(safeUser, 'User registered successfully'));
    }
  );

  app.get('/api-keys', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!request.user) return reply.forbidden('API key management requires a user session');
    const rows = await app.db.select().from(apiKeys).where(eq(apiKeys.userId, request.user.id));
    return reply.send(successResponse(rows.map(key => ({ id: key.id, name: key.name, keyPrefix: key.keyPrefix, scopes: JSON.parse(key.scopes), expiresAt: key.expiresAt, lastUsedAt: key.lastUsedAt, isActive: key.isActive, createdAt: key.createdAt })), 'API keys retrieved'));
  });

  app.delete<{ Params: { id: string } }>('/api-keys/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!request.user) return reply.forbidden('API key management requires a user session');
    const key = await app.db.select().from(apiKeys).where(eq(apiKeys.id, request.params.id)).limit(1);
    if (!key[0] || key[0].userId !== request.user.id) return reply.notFound('API key not found');
    await app.db.update(apiKeys).set({ isActive: false, updatedAt: new Date().toISOString() }).where(eq(apiKeys.id, request.params.id));
    return reply.send(successResponse({ id: request.params.id, revoked: true }, 'API key revoked'));
  });

  // 2. Login User
  app.post<{
    Body: {
      email: string;
      password?: string;
    };
  }>(
    '/login',
    {
      schema: {
        description: 'Authenticate with email & password to obtain session token',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password = '' } = request.body;

      const userRows = await app.db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = userRows[0];

      if (!user || !user.passwordHash) {
        return reply.unauthorized('Invalid email or password');
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return reply.unauthorized('Invalid email or password');
      }

      if (!user.isActive) {
        return reply.forbidden('User account is inactive');
      }

      const now = new Date();
      // Update lastLoginAt
      await app.db
        .update(users)
        .set({ lastLoginAt: now.toISOString() })
        .where(eq(users.id, user.id));

      // Buat session token (berlaku 7 hari)
      const { token, tokenHash } = generateSessionToken();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const session: NewUserSession = {
        id: `ses_${Date.now()}`,
        userId: user.id,
        tokenHash,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] as string,
        expiresAt,
        isRevoked: false,
        createdAt: now.toISOString(),
      };

      await app.db.insert(userSessions).values(session);

      const { passwordHash: _, ...safeUser } = user;

      return reply.code(200).send(
        successResponse(
          {
            token,
            tokenType: 'Bearer',
            expiresAt,
            user: safeUser,
          },
          'Login successful'
        )
      );
    }
  );

  app.post<{
    Body: { email: string };
  }>(
    '/password-reset/request',
    {
      schema: {
        description: 'Request a password reset without revealing whether an account exists',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email'],
          additionalProperties: false,
          properties: { email: { type: 'string', format: 'email', maxLength: 320 } },
        },
      },
    },
    async (request, reply) => {
      const rawEmail = request.body.email.trim().toLowerCase();
      const userRows = await app.db.select().from(users).where(eq(users.email, rawEmail)).limit(1);
      const user = userRows[0];
      const { rawToken, tokenHash } = createPasswordResetToken();
      const expiresAt = new Date(Date.now() + resetTokenTtlMs).toISOString();

      if (user?.isActive && user.passwordHash) {
        await app.db.delete(passwordResetTokens).where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.consumedAt)));
        const resetRecord: NewPasswordResetToken = {
          id: `prt_${randomUUID()}`,
          userId: user.id,
          tokenHash,
          expiresAt,
          consumedAt: null,
          createdAt: new Date().toISOString(),
        };
        await app.db.insert(passwordResetTokens).values(resetRecord);
      }

      const data: { accepted: true; expiresAt: string; resetToken?: string } = { accepted: true, expiresAt };
      // No mail delivery adapter exists yet. Keep local/test development usable without
      // ever exposing a reset credential from a production deployment.
      if (env.NODE_ENV !== 'production') data.resetToken = rawToken;
      return reply.code(200).send(successResponse(data, 'If the account exists, password reset instructions have been sent'));
    },
  );

  app.post<{
    Body: { token: string; newPassword: string };
  }>(
    '/password-reset/consume',
    {
      schema: {
        description: 'Consume a one-time password reset token',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['token', 'newPassword'],
          additionalProperties: false,
          properties: {
            token: { type: 'string', minLength: 16, maxLength: 256 },
            newPassword: { type: 'string', minLength: passwordMinLength, maxLength: 256 },
          },
        },
      },
    },
    async (request, reply) => {
      const { token, newPassword } = request.body;
      const tokenHash = hashApiKey(token);
      const tokenRows = await app.db.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash)).limit(1);
      const resetRecord = tokenRows[0];
      if (!resetRecord || resetRecord.consumedAt || new Date(resetRecord.expiresAt).getTime() <= Date.now()) {
        return reply.unauthorized('Invalid or expired password reset token');
      }

      const claimed = await app.db
        .update(passwordResetTokens)
        .set({ consumedAt: new Date().toISOString() })
        .where(and(eq(passwordResetTokens.id, resetRecord.id), isNull(passwordResetTokens.consumedAt)))
        .returning({ id: passwordResetTokens.id });
      if (claimed.length !== 1) return reply.unauthorized('Invalid or expired password reset token');

      await app.db.update(users).set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date().toISOString() }).where(eq(users.id, resetRecord.userId));
      await app.db.update(userSessions).set({ isRevoked: true }).where(eq(userSessions.userId, resetRecord.userId));
      return reply.code(200).send(successResponse({ changed: true }, 'Password reset successfully'));
    },
  );

  app.post<{
    Body: { currentPassword: string; newPassword: string };
  }>(
    '/password/change',
    {
      preHandler: [app.authenticate],
      schema: {
        description: 'Change the authenticated user password',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          additionalProperties: false,
          properties: {
            currentPassword: { type: 'string', minLength: 1, maxLength: 256 },
            newPassword: { type: 'string', minLength: passwordMinLength, maxLength: 256 },
          },
        },
      },
    },
    async (request, reply) => {
      if (!request.user || !request.session) return reply.forbidden('Password changes require an authenticated user session');
      if (!request.user.passwordHash || !(await verifyPassword(request.body.currentPassword, request.user.passwordHash))) {
        return reply.code(400).send(errorResponse({ code: 'INVALID_PASSWORD', statusCode: 400 }, 'Current password is incorrect'));
      }
      if (await verifyPassword(request.body.newPassword, request.user.passwordHash)) {
        return reply.code(400).send(errorResponse({ code: 'PASSWORD_REUSED', statusCode: 400 }, 'New password must be different from the current password'));
      }

      await app.db.update(users).set({ passwordHash: await hashPassword(request.body.newPassword), updatedAt: new Date().toISOString() }).where(eq(users.id, request.user.id));
      await app.db.update(userSessions).set({ isRevoked: true }).where(and(eq(userSessions.userId, request.user.id), ne(userSessions.id, request.session.id)));
      return reply.code(200).send(successResponse({ changed: true }, 'Password changed successfully'));
    },
  );

  app.get('/sessions', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!request.user || !request.session) return reply.forbidden('Session management requires an authenticated user session');
    const now = new Date().toISOString();
    const rows = await app.db.select().from(userSessions).where(and(eq(userSessions.userId, request.user.id), eq(userSessions.isRevoked, false), gt(userSessions.expiresAt, now)));
    return reply.send(successResponse(rows.map(session => safeSession(session, request.session?.id)), 'Active sessions retrieved'));
  });

  app.delete<{ Params: { id: string } }>('/sessions/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!request.user || !request.session) return reply.forbidden('Session management requires an authenticated user session');
    const sessionRows = await app.db.select().from(userSessions).where(and(eq(userSessions.id, request.params.id), eq(userSessions.userId, request.user.id))).limit(1);
    if (!sessionRows[0]) return reply.notFound('Session not found');
    await app.db.update(userSessions).set({ isRevoked: true }).where(eq(userSessions.id, request.params.id));
    return reply.send(successResponse({ id: request.params.id, revoked: true }, 'Session revoked'));
  });

  // 3. Get Current User Profile (Protected)
  app.get(
    '/me',
    {
      preHandler: [app.authenticate],
      schema: {
        description: 'Get authenticated user or API Key profile',
        tags: ['Authentication'],
      },
    },
    async (request, reply) => {
      let safeUser = null;
      if (request.user) {
        const { passwordHash: _, ...rest } = request.user;
        safeUser = rest;
      }

      return reply.code(200).send(
        successResponse(
          {
            user: safeUser,
            apiKey: request.apiKey
              ? {
                  id: request.apiKey.id,
                  name: request.apiKey.name,
                  keyPrefix: request.apiKey.keyPrefix,
                  scopes: request.apiKey.scopes,
                }
              : null,
          },
          'Authenticated profile retrieved'
        )
      );
    }
  );

  // 4. Manajemen API Key (Protected: Create New API Key)
  app.post<{
    Body: {
      name: string;
      orgId?: string;
      scopes?: string[];
      expiresInDays?: number;
    };
  }>(
    '/api-keys',
    {
      preHandler: [app.authenticate],
      schema: {
        description: 'Generate a new API Key. The raw secret key will only be shown ONCE!',
        tags: ['API Key Management'],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 2 },
            orgId: { type: 'string' },
            scopes: { type: 'array', items: { type: 'string' }, default: ['*'] },
            expiresInDays: { type: 'number' },
          },
        },
      },
    },
    async (request, reply) => {
      if (!request.principal) return reply.code(403).send(errorResponse({ code: 'FORBIDDEN', statusCode: 403 }, 'You are not authorized to create API keys'));
      const { name, orgId, scopes, expiresInDays } = request.body;
      const requestedScopes = scopes ?? scopesFor(request.principal.role);
      const allowedScopes = new Set(scopesFor(request.principal.role));
      if (!Array.isArray(requestedScopes) || requestedScopes.length === 0 || new Set(requestedScopes).size !== requestedScopes.length || requestedScopes.some(scope => !isKnownScope(scope) || scope === '*' || !allowedScopes.has(scope))) {
        return reply.code(403).send(errorResponse({ code: 'FORBIDDEN', statusCode: 403 }, 'Requested API key scopes are not permitted'));
      }

      const { rawKey, keyHash, keyPrefix } = generateApiKey();
      const now = new Date();
      const expiresAt = expiresInDays
        ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const newKey: NewApiKey = {
        id: `apk_${Date.now()}`,
        name,
        keyHash,
        keyPrefix,
        userId: request.user?.id || null,
        orgId: orgId || request.user?.orgId || null,
        scopes: JSON.stringify(requestedScopes),
        expiresAt,
        isActive: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        createdBy: request.user?.id || 'system',
      };

      await app.db.insert(apiKeys).values(newKey);

      return reply.code(201).send(
        successResponse(
          {
            id: newKey.id,
            name: newKey.name,
            rawKey, // Penting: Hanya dikembalikan satu kali saat pembuatan!
            keyPrefix: newKey.keyPrefix,
            scopes: requestedScopes,
            expiresAt,
            notice: 'Please store this raw API key safely. It will not be shown again.',
          },
          'API Key created successfully'
        )
      );
    }
  );

  // 5. Logout / Revoke Session (Protected)
  app.post(
    '/logout',
    {
      preHandler: [app.authenticate],
      schema: {
        description: 'Revoke active session token',
        tags: ['Authentication'],
      },
    },
    async (request, reply) => {
      if (!request.session) return reply.forbidden('Logout requires an authenticated user session');
      await app.db
        .update(userSessions)
        .set({ isRevoked: true })
        .where(eq(userSessions.id, request.session.id));

      return reply.code(200).send(successResponse({ revoked: true }, 'Logged out successfully'));
    }
  );

  app.post('/logout-all', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!request.user || !request.session) return reply.forbidden('Logout-all requires an authenticated user session');
    await app.db.update(userSessions).set({ isRevoked: true }).where(eq(userSessions.userId, request.user.id));
    return reply.code(200).send(successResponse({ revoked: true }, 'All sessions revoked'));
  });
}
