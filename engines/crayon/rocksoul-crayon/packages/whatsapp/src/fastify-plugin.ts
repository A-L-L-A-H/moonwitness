import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import fastifyView from '@fastify/view';
import fastifyCookie from '@fastify/cookie';
import fastifyFormbody from '@fastify/formbody';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import type { WebSocket } from 'ws';
import ejs from 'ejs';
import QRCode from 'qrcode';
import path from 'node:path';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WhatsAppSessionManager, type SessionManagerOptions } from './manager.js';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyRateLimit from '@fastify/rate-limit';
import { and, eq, sql } from 'drizzle-orm';
import { publishWhatsAppMessageEvent } from './event-publisher.js';
import {
  initWhatsAppDb,
  listApiKeys,
  createNewApiKey,
  revokeApiKey,
  saveIncomingMessage,
  saveOutgoingMessage,
  getSessionChats,
  getChatMessages,
  markChatRead,
  upsertContacts,
  addReactionToMessage,
  deleteMessage,
  toggleStarMessage,
  getStarredMessages,
  getChatMeta,
  updateChatMeta,
  getAllChatMetas,
  listScheduledMessages,
  createScheduledMessage,
  updateScheduledMessageStatus,
  listAutoReplies,
  createAutoReply,
  deleteAutoReply,
  listQuickReplies,
  createQuickReply,
  deleteQuickReply,
  waScheduledMessages,
  waMessages,
  type DatabaseContext,
} from './db.js';
import {
  DEFAULT_WA_PASSWORD,
  WA_SESSION_COOKIE,
  getSessionToken,
  isAuthorized,
  createAuthPreHandlers,
} from './auth.js';
import { formatToWhatsAppJid, extractPhoneNumber } from './utils.js';

export interface WhatsAppPluginOptions extends SessionManagerOptions {
  /** Database URL for isolated SQLite (default: file:./data/whatsapp.db) */
  databaseUrl?: string;
  /** Admin Dashboard password (default: 210491) */
  password?: string;
  /** Pass an existing session manager instance if desired */
  manager?: WhatsAppSessionManager;
}

declare module 'fastify' {
  interface FastifyInstance {
    whatsappManager: WhatsAppSessionManager;
    whatsappDb: DatabaseContext;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const whatsappPluginFn: FastifyPluginAsync<WhatsAppPluginOptions> = async (app, opts) => {
  const password = opts.password || DEFAULT_WA_PASSWORD;

  // Initialize DB Context
  const dbContext = await initWhatsAppDb(opts.databaseUrl);
  app.decorate('whatsappDb', dbContext);

  // Initialize Manager
  const manager = opts.manager ?? new WhatsAppSessionManager({
    baseSessionsDir: opts.baseSessionsDir,
    defaultClientOptions: opts.defaultClientOptions,
  });
  app.decorate('whatsappManager', manager);

  // Auto-restore any existing sessions found on disk (e.g. 6285893429926)
  void manager.restoreSavedSessions();

  // Ensure uploads directory exists
  const uploadsDir = path.resolve(process.cwd(), 'data/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Register multipart upload parser
  if (!app.hasPlugin('@fastify/multipart')) {
    await app.register(fastifyMultipart, {
      limits: {
        fileSize: 64 * 1024 * 1024, // 64 MB
      },
    });
  }

  // Register Swagger OpenApi & UI
  if (!app.hasPlugin('@fastify/swagger')) {
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'Rocksoul WhatsApp Gateway API',
          description: 'Production-ready WhatsApp Multi-Device Gateway REST API',
          version: '2.0.0',
        },
        servers: [{ url: 'http://127.0.0.1:3001' }],
      },
    });
    await app.register(fastifySwaggerUi, {
      routePrefix: '/api/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    });
  }

  // Register Rate Limiting
  if (!app.hasPlugin('@fastify/rate-limit')) {
    await app.register(fastifyRateLimit, {
      max: 1000,
      timeWindow: '1 minute',
    });
  }

  // Register cookie parser
  if (!app.hasPlugin('@fastify/cookie')) {
    await app.register(fastifyCookie);
  }

  // Register form body parser
  if (!app.hasPlugin('@fastify/formbody')) {
    await app.register(fastifyFormbody);
  }

  // Register WebSocket
  if (!app.hasPlugin('@fastify/websocket')) {
    await app.register(fastifyWebsocket);
  }

  // Register View Engine (EJS)
  const candidateDirs = [
    path.resolve(__dirname, '../views'),
    path.resolve(__dirname, '../../views'),
    path.resolve(process.cwd(), 'packages/whatsapp/views'),
    path.resolve(process.cwd(), 'views'),
  ];
  const viewsDir = candidateDirs.find((d) => fs.existsSync(d)) || candidateDirs[0];

  if (!app.hasPlugin('@fastify/view')) {
    await app.register(fastifyView, {
      engine: { ejs },
      root: viewsDir,
      propertyName: 'view',
    });
  }

  // Register Static Vite Client Assets
  const candidateClientDirs = [
    path.resolve(__dirname, '../dist/client'),
    path.resolve(__dirname, '../../dist/client'),
    path.resolve(process.cwd(), 'packages/whatsapp/dist/client'),
    path.resolve(process.cwd(), 'dist/client'),
  ];
  const clientDist = candidateClientDirs.find((d) => fs.existsSync(d));

  if (clientDist && !app.hasPlugin('@fastify/static')) {
    await app.register(fastifyStatic, {
      root: path.join(clientDist, 'assets'),
      prefix: '/assets/',
    });
  }

  // Register Static Route for User Uploaded Media (/uploads/)
  if (fs.existsSync(uploadsDir)) {
    await app.register(fastifyStatic, {
      root: uploadsDir,
      prefix: '/uploads/',
      decorateReply: false,
    });
  }

  // Auth Helpers
  const { requireWebAuth, requireApiOrKeyAuth } = createAuthPreHandlers(dbContext, password);

  // ==========================================
  // REAL-TIME WEBSOCKET BROADCAST ENGINE
  // ==========================================
  const wsClients = new Set<WebSocket>();

  function broadcast(type: string, payload: unknown) {
    const message = JSON.stringify({ type, payload, timestamp: Date.now() });
    for (const ws of wsClients) {
      if (ws.readyState === 1) { // 1 = WebSocket.OPEN
        try {
          ws.send(message);
        } catch {
          wsClients.delete(ws);
        }
      }
    }
  }

  // Hook Manager events directly to SQLite and WebSocket
  manager.on('message', async ({ sessionId, message }) => {
    try {
      // 1. Save to SQLite
      await saveIncomingMessage(dbContext.db, sessionId, message);

      // 2. Broadcast to connected WebSocket clients in real-time
      broadcast('new_message', {
        sessionId,
        message: {
          id: message.id,
          remoteJid: message.from,
          senderNumber: message.senderNumber,
          senderName: message.senderName,
          fromMe: message.fromMe,
          text: message.text,
          timestamp: message.timestamp,
        },
      });

      broadcast('chats_updated', { sessionId });

      // External delivery is centralized and durable in @rocksoul/webhooks.
      void publishWhatsAppMessageEvent({ sessionId, message });

      // 4. Auto-Reply Matching (if incoming and not from me)
      if (!message.fromMe && message.text) {
        try {
          const autoReplies = await listAutoReplies(dbContext.db, sessionId);
          const lower = message.text.toLowerCase().trim();
          for (const ar of autoReplies) {
            if (!ar.isActive) continue;
            const match =
              ar.matchType === 'exact'
                ? lower === ar.keyword
                : lower.includes(ar.keyword);
            if (match) {
              const client = manager.getSession(sessionId);
              if (client && client.isConnected()) {
                await client.sendMessage(message.from, ar.replyText);
                await saveOutgoingMessage(dbContext.db, sessionId, message.from, ar.replyText);
                broadcast('new_message', {
                  sessionId,
                  message: {
                    sessionId,
                    remoteJid: message.from,
                    senderNumber: sessionId,
                    senderName: 'Auto Responder',
                    fromMe: true,
                    text: ar.replyText,
                    timestamp: Math.floor(Date.now() / 1000),
                  },
                });
                broadcast('chats_updated', { sessionId });
              }
              break;
            }
          }
        } catch (e) {
          app.log.error(e, 'Error checking auto-replies');
        }
      }
    } catch (err) {
      app.log.error(err, 'Error saving/broadcasting incoming message');
    }
  });

  manager.on('presence', ({ sessionId, payload }) => {
    broadcast('presence_update', { sessionId, payload });
  });

  // Background worker: execute scheduled messages every 10 seconds
  const schedulerTimer = setInterval(async () => {
    try {
      const nowTs = Math.floor(Date.now() / 1000);
      const pending = await dbContext.db
        .select()
        .from(waScheduledMessages)
        .where(
          and(
            eq(waScheduledMessages.status, 'pending'),
            sql`${waScheduledMessages.scheduledAt} <= ${nowTs}`
          )
        );

      for (const item of pending) {
        const client = manager.getSession(item.sessionId);
        if (client && client.isConnected()) {
          try {
            const parsed = JSON.parse(item.payload);
            if (parsed.text) {
              await client.sendMessage(item.remoteJid, parsed.text);
              await saveOutgoingMessage(dbContext.db, item.sessionId, item.remoteJid, parsed.text);
            }
            await updateScheduledMessageStatus(dbContext.db, item.id, 'sent');
          } catch {
            await updateScheduledMessageStatus(dbContext.db, item.id, 'failed');
          }
        }
      }
    } catch {
      // ignore
    }
  }, 10000);

  app.addHook('onClose', () => {
    clearInterval(schedulerTimer);
  });

  manager.on('qr', ({ sessionId, qr }) => {
    broadcast('qr_update', { sessionId, qr });
  });

  manager.on('ready', ({ sessionId, user }) => {
    broadcast('session_ready', { sessionId, user });
  });

  manager.on('connection', ({ sessionId, update }) => {
    broadcast('connection_update', { sessionId, update });
  });

  manager.on('contacts', async ({ sessionId, contacts }) => {
    try {
      await upsertContacts(dbContext.db, sessionId, contacts);
      broadcast('chats_updated', { sessionId });
      broadcast('contacts_updated', { sessionId });
    } catch (err) {
      app.log.error(err, 'Error upserting synced contacts');
    }
  });

  manager.on('status_update', ({ sessionId, status }) => {
    broadcast('status_update', { sessionId, status });
  });

  manager.on('disconnected', ({ sessionId, payload }) => {
    broadcast('session_disconnected', { sessionId, payload });
  });

  // WebSocket connection endpoint
  app.get('/ws', { websocket: true }, (socket: WebSocket, req: FastifyRequest) => {
    // Check web cookie or query parameter or header
    const authorized = isAuthorized(req, password) || Boolean((req as unknown as { cookies?: Record<string, string> }).cookies?.[WA_SESSION_COOKIE]);
    if (!authorized) {
      socket.close(4001, 'Unauthorized');
      return;
    }

    wsClients.add(socket);

    socket.on('close', () => {
      wsClients.delete(socket);
    });

    socket.on('error', () => {
      wsClients.delete(socket);
    });

    // Send initial handshake
    socket.send(JSON.stringify({
      type: 'connected',
      payload: {
        server: 'rocksoul-whatsapp-gateway',
        activeSessions: manager.listSessions(),
      },
    }));
  });

  // Clean shutdown hook
  app.addHook('onClose', async () => {
    app.log.info('Closing all WhatsApp sessions, WebSockets, and SQLite DB on shutdown...');
    for (const ws of wsClients) {
      ws.close();
    }
    wsClients.clear();
    await manager.disconnectAll();
    dbContext.client.close();
  });

  // ==========================================
  // WEB DASHBOARD & CHAT ROUTES
  // ==========================================

  // Root redirect
  app.get('/', async (req, reply) => {
    if (isAuthorized(req, password)) {
      return reply.redirect('/chat');
    }
    return reply.redirect('/login');
  });

  // Login Page (GET)
  app.get('/login', async (req: FastifyRequest<{ Querystring: { error?: string } }>, reply) => {
    if (isAuthorized(req, password)) {
      return reply.redirect('/chat');
    }
    return reply.view('login.ejs', {
      error: req.query.error || null,
    });
  });

  // Login Form (POST)
  app.post('/login', async (req: FastifyRequest<{ Body: { password?: string } }>, reply) => {
    const inputPassword = req.body?.password;

    if (inputPassword === password) {
      const token = getSessionToken(password);
      reply.setCookie(WA_SESSION_COOKIE, token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return reply.redirect('/chat');
    }

    return reply.view('login.ejs', {
      error: 'Password salah! Silakan coba lagi (Default: 210491).',
    });
  });

  // Logout (GET)
  app.get('/logout', async (_req, reply) => {
    reply.clearCookie(WA_SESSION_COOKIE, { path: '/' });
    return reply.redirect('/login');
  });

  // WhatsApp Web Multi-Device Chat Interface (GET) - Serves React Vite Client if built, fallback to EJS
  app.get<{ Querystring: { session?: string } }>('/chat', { preHandler: requireWebAuth }, async (req, reply) => {
    if (clientDist && fs.existsSync(path.join(clientDist, 'index.html'))) {
      const html = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf-8');
      return reply.type('text/html').send(html);
    }

    const sessions = manager.listSessions();
    const activeSessionId = req.query.session || (sessions[0]?.sessionId ?? 'default');

    return reply.view('chat.ejs', {
      sessions,
      activeSessionId,
    });
  });

  // Settings / Full Dashboard (GET)
  app.get<{ Querystring: { flashKey?: string } }>('/dashboard', { preHandler: requireWebAuth }, async (
    req,
    reply
  ) => {
    const sessions = manager.listSessions();
    const apiKeys = await listApiKeys(dbContext.db);

    return reply.view('dashboard.ejs', {
      sessions,
      apiKeys,
      flashKey: req.query.flashKey || null,
    });
  });

  // API Key Create (POST from Web Form)
  app.post<{ Body: { name?: string; scopes?: string } }>('/api-keys/generate', { preHandler: requireWebAuth }, async (
    req,
    reply
  ) => {
    const name = req.body?.name || 'Dashboard Token';
    const rawScopes = req.body?.scopes || '*';
    const scopes = rawScopes.split(',').map((s) => s.trim()).filter(Boolean);

    const { rawKey } = await createNewApiKey(dbContext.db, name, scopes);
    return reply.redirect(`/dashboard?flashKey=${encodeURIComponent(rawKey)}`);
  });

  // API Key Revoke (POST from Web Form)
  app.post<{ Params: { id: string } }>('/api-keys/:id/revoke', { preHandler: requireWebAuth }, async (
    req,
    reply
  ) => {
    await revokeApiKey(dbContext.db, req.params.id);
    return reply.redirect('/dashboard');
  });

  // REST API: List API Keys
  app.get('/api/keys', { preHandler: requireApiOrKeyAuth }, async () => {
    const keys = await listApiKeys(dbContext.db);
    return {
      success: true,
      data: keys,
    };
  });

  // REST API: Create API Key
  app.post<{ Body: { name?: string; scopes?: string[] } }>('/api/keys', { preHandler: requireApiOrKeyAuth }, async (
    req,
    reply
  ) => {
    const { name = 'API Token', scopes = ['*'] } = req.body || {};
    const { key, rawKey } = await createNewApiKey(dbContext.db, name, scopes);
    return reply.status(201).send({
      success: true,
      data: {
        ...key,
        rawKey,
      },
    });
  });

  // REST API: Revoke API Key
  app.delete<{ Params: { id: string } }>('/api/keys/:id', { preHandler: requireApiOrKeyAuth }, async (
    req,
    _reply
  ) => {
    await revokeApiKey(dbContext.db, req.params.id);
    return {
      success: true,
      message: `API Key '${req.params.id}' revoked`,
    };
  });

  // ==========================================
  // CHAT DATA ENDPOINTS (SQLITE + WEBSOCKET)
  // ==========================================

  // Get list of chats for a session
  app.get<{ Params: { sessionId: string } }>('/api/sessions/:sessionId/chats', { preHandler: requireApiOrKeyAuth }, async (
    req
  ) => {
    const { sessionId } = req.params;
    const chats = await getSessionChats(dbContext.db, sessionId);
    return {
      success: true,
      sessionId,
      data: chats,
    };
  });

  // Get list of contacts for a session - merges in-memory Baileys contacts + DB-persisted chats
  app.get<{ Params: { sessionId: string } }>('/api/sessions/:sessionId/contacts', { preHandler: requireApiOrKeyAuth }, async (
    req
  ) => {
    const { sessionId } = req.params;
    const client = manager.getSession(sessionId);
    const memContacts = client ? client.getContacts() : [];

    // Build merged map: phoneNumber => contact (memory takes precedence over DB)
    const merged = new Map<string, { id: string; phoneNumber: string; name?: string; notify?: string; verifiedName?: string }>();

    // 1. Load from DB chats (contacts synced previously via upsertContacts)
    const dbChats = await getSessionChats(dbContext.db, sessionId);
    for (const chat of dbChats) {
      const phone = chat.remoteJid.split('@')[0];
      if (!phone || chat.remoteJid.endsWith('@g.us')) continue;
      merged.set(phone, {
        id: chat.remoteJid,
        phoneNumber: phone,
        name: chat.name || undefined,
      });
    }

    // 2. Overlay with in-memory contacts (richer metadata, more up to date)
    for (const c of memContacts) {
      const phone = c.phoneNumber || c.id.split('@')[0];
      merged.set(phone, {
        id: c.id,
        phoneNumber: phone,
        name: c.name,
        notify: c.notify,
        verifiedName: c.verifiedName,
      });
    }

    return {
      success: true,
      sessionId,
      data: Array.from(merged.values()),
    };
  });

  // ==========================================
  // STATUS / STORIES ENDPOINTS
  // ==========================================

  // Get recent WhatsApp status / stories updates
  app.get<{ Params: { sessionId: string } }>('/api/sessions/:sessionId/status-updates', { preHandler: requireApiOrKeyAuth }, async (
    req,
    reply
  ) => {
    const { sessionId } = req.params;
    const client = manager.getSession(sessionId);
    if (!client) {
      return reply.status(404).send({ success: false, error: 'Session not found' });
    }

    const updates = client.getStatusUpdates();
    return {
      success: true,
      sessionId,
      data: updates,
    };
  });

  // Post a new WhatsApp Status (Story)
  app.post<{
    Params: { sessionId: string };
    Body: { text?: string; imageUrl?: string };
  }>('/api/sessions/:sessionId/status', { preHandler: requireApiOrKeyAuth }, async (
    req,
    reply
  ) => {
    const { sessionId } = req.params;
    const { text, imageUrl } = req.body || {};

    if (!text && !imageUrl) {
      return reply.status(400).send({ success: false, error: 'text or imageUrl is required' });
    }

    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) {
      return reply.status(400).send({ success: false, error: 'WhatsApp session is not connected' });
    }

    try {
      const result = await client.sendStatus({ text, imageUrl });
      return {
        success: true,
        sessionId,
        messageId: result?.key?.id,
        timestamp: Date.now(),
      };
    } catch (err) {
      app.log.error(err, 'Failed to post status');
      return reply.status(500).send({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // ==========================================
  // PROFILE / ABOUT / AVATAR ENDPOINTS
  // ==========================================

  // Get profile info (name, phone, status text, profile picture)
  app.get<{ Params: { sessionId: string } }>('/api/sessions/:sessionId/profile', { preHandler: requireApiOrKeyAuth }, async (
    req,
    reply
  ) => {
    const { sessionId } = req.params;
    const client = manager.getSession(sessionId);
    if (!client) {
      return reply.status(404).send({ success: false, error: 'Session not found' });
    }

    try {
      const profile = await client.getProfileInfo();
      return {
        success: true,
        sessionId,
        data: profile,
      };
    } catch (err) {
      app.log.error(err, 'Failed to get profile');
      return reply.status(500).send({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Update profile photo
  app.post<{
    Params: { sessionId: string };
    Body: { imageUrl: string };
  }>('/api/sessions/:sessionId/profile/photo', { preHandler: requireApiOrKeyAuth }, async (
    req,
    reply
  ) => {
    const { sessionId } = req.params;
    const { imageUrl } = req.body || {};

    if (!imageUrl) {
      return reply.status(400).send({ success: false, error: 'imageUrl is required' });
    }

    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) {
      return reply.status(400).send({ success: false, error: 'WhatsApp session is not connected' });
    }

    try {
      await client.updateProfilePhoto(imageUrl);
      return {
        success: true,
        sessionId,
        message: 'Profile photo updated successfully',
      };
    } catch (err) {
      app.log.error(err, 'Failed to update profile picture');
      return reply.status(500).send({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Update profile status text (About)
  app.post<{
    Params: { sessionId: string };
    Body: { status: string };
  }>('/api/sessions/:sessionId/profile/status', { preHandler: requireApiOrKeyAuth }, async (
    req,
    reply
  ) => {
    const { sessionId } = req.params;
    const { status } = req.body || {};

    if (typeof status !== 'string') {
      return reply.status(400).send({ success: false, error: 'status string is required' });
    }

    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) {
      return reply.status(400).send({ success: false, error: 'WhatsApp session is not connected' });
    }

    try {
      await client.updateProfileStatus(status);
      return {
        success: true,
        sessionId,
        message: 'Profile status updated successfully',
      };
    } catch (err) {
      app.log.error(err, 'Failed to update profile status');
      return reply.status(500).send({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Update profile display name
  app.post<{
    Params: { sessionId: string };
    Body: { name: string };
  }>('/api/sessions/:sessionId/profile/name', { preHandler: requireApiOrKeyAuth }, async (
    req,
    reply
  ) => {
    const { sessionId } = req.params;
    const { name } = req.body || {};

    if (!name) {
      return reply.status(400).send({ success: false, error: 'name is required' });
    }

    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) {
      return reply.status(400).send({ success: false, error: 'WhatsApp session is not connected' });
    }

    try {
      await client.updateProfileName(name);
      return {
        success: true,
        sessionId,
        message: 'Profile name updated successfully',
      };
    } catch (err) {
      app.log.error(err, 'Failed to update profile name');
      return reply.status(500).send({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });


  // Get message history for a specific chat with optional pagination
  app.get<{
    Params: { sessionId: string; jid: string };
    Querystring: { limit?: string; before?: string };
  }>('/api/sessions/:sessionId/chats/:jid/messages', { preHandler: requireApiOrKeyAuth }, async (
    req
  ) => {
    const { sessionId, jid } = req.params;
    const { limit, before } = req.query;
    const decodedJid = decodeURIComponent(jid);
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedBefore = before ? parseInt(before, 10) : undefined;

    const messages = await getChatMessages(dbContext.db, sessionId, decodedJid, parsedLimit, parsedBefore);

    // Mark as read
    await markChatRead(dbContext.db, sessionId, decodedJid);

    return {
      success: true,
      sessionId,
      jid: decodedJid,
      data: messages,
    };
  });

  // Send message to a specific chat via Web UI or API (with quote support)
  app.post<{
    Params: { sessionId: string; jid: string };
    Body: { text: string; name?: string; quotedMessageId?: string; quotedText?: string; quotedSender?: string };
  }>('/api/sessions/:sessionId/chats/:jid/messages', { preHandler: requireApiOrKeyAuth }, async (
    req,
    reply
  ) => {
    const { sessionId, jid } = req.params;
    const { text, name, quotedMessageId, quotedText, quotedSender } = req.body || {};
    const decodedJid = decodeURIComponent(jid);

    if (!text) {
      return reply.status(400).send({ success: false, error: 'Message text is required' });
    }

    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) {
      return reply.status(400).send({
        success: false,
        error: `Session '${sessionId}' is not connected to WhatsApp`,
      });
    }

    try {
      let quotedMsgObj: any = undefined;
      if (quotedMessageId) {
        quotedMsgObj = {
          key: {
            remoteJid: decodedJid,
            id: quotedMessageId,
          },
          message: {
            conversation: quotedText || '',
          },
        };
      }

      const result = await client.sendMessage(decodedJid, text, quotedMsgObj);
      const msgId = result?.key?.id;

      // 1. Save outgoing message to SQLite with quote data
      await saveOutgoingMessage(dbContext.db, sessionId, decodedJid, text, msgId || undefined, name, {
        quotedId: quotedMessageId,
        quotedText,
        quotedSender,
      });

      const payload = {
        id: msgId,
        sessionId,
        remoteJid: decodedJid,
        senderNumber: extractPhoneNumber(decodedJid),
        fromMe: true,
        text,
        quotedId: quotedMessageId,
        quotedText,
        quotedSender,
        timestamp: Math.floor(Date.now() / 1000),
      };

      // 2. Broadcast via WebSocket immediately
      broadcast('new_message', { sessionId, message: payload });
      broadcast('chats_updated', { sessionId });

      return {
        success: true,
        data: payload,
      };
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Send a media message (Image or Document)
  app.post<{
    Params: { sessionId: string; jid: string };
    Body: { type?: 'image' | 'document'; mediaUrl?: string; caption?: string; fileName?: string; name?: string };
  }>('/api/sessions/:sessionId/chats/:jid/media', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId, jid } = req.params;
    const { type = 'image', mediaUrl, caption, fileName, name } = req.body || {};
    const decodedJid = decodeURIComponent(jid);

    if (!mediaUrl) {
      return reply.status(400).send({ success: false, error: 'mediaUrl is required' });
    }

    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) {
      return reply.status(400).send({
        success: false,
        error: `Session '${sessionId}' is not connected to WhatsApp`,
      });
    }

    try {
      let result;
      let displayMsg = caption || (type === 'image' ? '📷 Foto' : `📄 ${fileName || 'Dokumen'}`);
      if (type === 'image') {
        result = await client.sendImage(decodedJid, mediaUrl, caption);
      } else {
        result = await client.sendDocument(decodedJid, mediaUrl, fileName || 'file.pdf', undefined, caption);
      }
      const msgId = result?.key?.id;

      await saveOutgoingMessage(dbContext.db, sessionId, decodedJid, displayMsg, msgId || undefined, name, {
        mediaType: type,
        mediaUrl,
      });

      const payload = {
        id: msgId,
        sessionId,
        remoteJid: decodedJid,
        senderNumber: extractPhoneNumber(decodedJid),
        fromMe: true,
        text: displayMsg,
        mediaType: type,
        mediaUrl,
        timestamp: Math.floor(Date.now() / 1000),
      };

      broadcast('new_message', { sessionId, message: payload });
      broadcast('chats_updated', { sessionId });

      return {
        success: true,
        data: payload,
      };
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Direct Binary File Upload & Send (Multipart)
  app.post<{ Params: { sessionId: string; jid: string } }>(
    '/api/sessions/:sessionId/chats/:jid/upload',
    { preHandler: requireApiOrKeyAuth },
    async (req, reply) => {
      const { sessionId, jid } = req.params;
      const decodedJid = decodeURIComponent(jid);

      const client = manager.getSession(sessionId);
      if (!client || !client.isConnected()) {
        return reply.status(400).send({ success: false, error: 'Session not connected' });
      }

      const data = await req.file();
      if (!data) {
        return reply.status(400).send({ success: false, error: 'No file uploaded' });
      }

      const buffer = await data.toBuffer();
      const filename = data.filename || 'attachment';
      const mimetype = data.mimetype;
      const isImage = mimetype.startsWith('image/');
      const isAudio = mimetype.startsWith('audio/');
      const isVideo = mimetype.startsWith('video/');

      // Save locally to data/uploads
      const ext = path.extname(filename) || (isImage ? '.jpg' : isAudio ? '.ogg' : '.bin');
      const uniqueName = `${Date.now()}_${randomBytes(6).toString('hex')}${ext}`;
      const savePath = path.resolve(process.cwd(), 'data/uploads', uniqueName);
      fs.writeFileSync(savePath, buffer);
      const localMediaUrl = `/uploads/${uniqueName}`;

      let result;
      let displayMsg = filename;
      let mediaType = 'document';

      if (isImage) {
        mediaType = 'image';
        displayMsg = '📷 Foto';
        result = await client.sendImage(decodedJid, buffer);
      } else if (isAudio) {
        mediaType = 'audio';
        displayMsg = '🎵 Pesan Suara';
        result = await client.sendRaw(decodedJid, {
          audio: buffer,
          mimetype: mimetype || 'audio/ogg; codecs=opus',
          ptt: true,
        });
      } else if (isVideo) {
        mediaType = 'video';
        displayMsg = '📹 Video';
        result = await client.sendRaw(decodedJid, {
          video: buffer,
          caption: filename,
          mimetype,
        });
      } else {
        mediaType = 'document';
        displayMsg = `📄 ${filename}`;
        result = await client.sendDocument(decodedJid, buffer, filename, mimetype);
      }

      const msgId = result?.key?.id;
      await saveOutgoingMessage(dbContext.db, sessionId, decodedJid, displayMsg, msgId || undefined, undefined, {
        mediaType,
        mediaUrl: localMediaUrl,
      });

      const payload = {
        id: msgId,
        sessionId,
        remoteJid: decodedJid,
        senderNumber: extractPhoneNumber(decodedJid),
        fromMe: true,
        text: displayMsg,
        mediaType,
        mediaUrl: localMediaUrl,
        timestamp: Math.floor(Date.now() / 1000),
      };

      broadcast('new_message', { sessionId, message: payload });
      broadcast('chats_updated', { sessionId });

      return {
        success: true,
        data: payload,
      };
    }
  );

  // Send Reaction to a message
  app.post<{
    Params: { sessionId: string; jid: string; messageId: string };
    Body: { emoji: string };
  }>('/api/sessions/:sessionId/chats/:jid/messages/:messageId/react', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId, jid, messageId } = req.params;
    const { emoji } = req.body || {};
    const decodedJid = decodeURIComponent(jid);

    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) {
      return reply.status(400).send({ success: false, error: 'Session not connected' });
    }

    try {
      await client.sendReaction(decodedJid, messageId, emoji || '');
      await addReactionToMessage(dbContext.db, messageId, emoji || '');

      broadcast('reaction_updated', {
        sessionId,
        remoteJid: decodedJid,
        messageId,
        emoji,
      });

      return { success: true, messageId, emoji };
    } catch (err) {
      return reply.status(500).send({ success: false, error: (err as Error).message });
    }
  });

  // Delete message for everyone
  app.delete<{
    Params: { sessionId: string; jid: string; messageId: string };
  }>('/api/sessions/:sessionId/chats/:jid/messages/:messageId', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId, jid, messageId } = req.params;
    const decodedJid = decodeURIComponent(jid);

    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) {
      return reply.status(400).send({ success: false, error: 'Session not connected' });
    }

    try {
      await client.deleteMessageForEveryone(decodedJid, messageId);
      await deleteMessage(dbContext.db, sessionId, messageId);

      broadcast('message_deleted', {
        sessionId,
        remoteJid: decodedJid,
        messageId,
      });

      return { success: true, messageId };
    } catch (err) {
      return reply.status(500).send({ success: false, error: (err as Error).message });
    }
  });

  // Send typing presence indicator
  app.post<{
    Params: { sessionId: string; jid: string };
    Body: { presence: 'composing' | 'recording' | 'paused' | 'available' };
  }>('/api/sessions/:sessionId/chats/:jid/presence', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId, jid } = req.params;
    const { presence = 'composing' } = req.body || {};
    const decodedJid = decodeURIComponent(jid);

    const client = manager.getSession(sessionId);
    if (client && client.isConnected()) {
      void client.sendPresence(decodedJid, presence);
    }
    return { success: true };
  });

  // Create WhatsApp Group
  app.post<{
    Params: { sessionId: string };
    Body: { subject: string; participants: string[] };
  }>('/api/sessions/:sessionId/groups', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId } = req.params;
    const { subject, participants } = req.body || {};

    if (!subject || !Array.isArray(participants) || participants.length === 0) {
      return reply.status(400).send({ success: false, error: 'subject and participants array required' });
    }

    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) {
      return reply.status(400).send({ success: false, error: 'Session not connected' });
    }

    try {
      const group = await client.createGroup(subject, participants);
      return { success: true, group };
    } catch (err) {
      return reply.status(500).send({ success: false, error: (err as Error).message });
    }
  });

  // ==========================================
  // PHASE 2 REST APIS: INTERACTIVE MESSAGES & CHAT FEATURES
  // ==========================================

  // Send Poll / Voting
  app.post<{
    Params: { sessionId: string; jid: string };
    Body: { name: string; values: string[]; selectableCount?: number };
  }>('/api/sessions/:sessionId/chats/:jid/poll', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId, jid } = req.params;
    const { name, values, selectableCount = 1 } = req.body || {};
    const decodedJid = decodeURIComponent(jid);

    if (!name || !Array.isArray(values) || values.length < 2) {
      return reply.status(400).send({ success: false, error: 'name and at least 2 option values required' });
    }

    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) {
      return reply.status(400).send({ success: false, error: 'Session not connected' });
    }

    try {
      const result = await client.sendPoll(decodedJid, name, values, selectableCount);
      const msgId = result?.key?.id;
      const pollData = JSON.stringify({ name, values, selectableCount });
      await saveOutgoingMessage(dbContext.db, sessionId, decodedJid, `📊 ${name}`, msgId || undefined, undefined, {
        mediaType: 'poll',
      });
      if (msgId) {
        await dbContext.db.update(waMessages).set({ pollData }).where(eq(waMessages.id, msgId));
      }
      return { success: true, messageId: msgId, pollData: { name, values, selectableCount } };
    } catch (err) {
      return reply.status(500).send({ success: false, error: (err as Error).message });
    }
  });

  // Send Location
  app.post<{
    Params: { sessionId: string; jid: string };
    Body: { degreesLatitude: number; degreesLongitude: number; name?: string; address?: string };
  }>('/api/sessions/:sessionId/chats/:jid/location', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId, jid } = req.params;
    const { degreesLatitude, degreesLongitude, name, address } = req.body || {};
    const decodedJid = decodeURIComponent(jid);

    if (degreesLatitude === undefined || degreesLongitude === undefined) {
      return reply.status(400).send({ success: false, error: 'degreesLatitude and degreesLongitude are required' });
    }

    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) {
      return reply.status(400).send({ success: false, error: 'Session not connected' });
    }

    try {
      const result = await client.sendLocation(decodedJid, degreesLatitude, degreesLongitude, name, address);
      const msgId = result?.key?.id;
      const locationData = JSON.stringify({ degreesLatitude, degreesLongitude, name, address });
      await saveOutgoingMessage(dbContext.db, sessionId, decodedJid, `📍 ${name || 'Lokasi'}`, msgId || undefined, undefined, {
        mediaType: 'location',
      });
      if (msgId) {
        await dbContext.db.update(waMessages).set({ locationData }).where(eq(waMessages.id, msgId));
      }
      return { success: true, messageId: msgId, locationData };
    } catch (err) {
      return reply.status(500).send({ success: false, error: (err as Error).message });
    }
  });

  // Send Contact Card (vCard)
  app.post<{
    Params: { sessionId: string; jid: string };
    Body: { displayName: string; phoneNumber: string };
  }>('/api/sessions/:sessionId/chats/:jid/contact', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId, jid } = req.params;
    const { displayName, phoneNumber } = req.body || {};
    const decodedJid = decodeURIComponent(jid);

    if (!displayName || !phoneNumber) {
      return reply.status(400).send({ success: false, error: 'displayName and phoneNumber are required' });
    }

    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) {
      return reply.status(400).send({ success: false, error: 'Session not connected' });
    }

    try {
      const result = await client.sendContact(decodedJid, displayName, phoneNumber);
      const msgId = result?.key?.id;
      const vcardData = JSON.stringify({ displayName, phoneNumber });
      await saveOutgoingMessage(dbContext.db, sessionId, decodedJid, `👤 ${displayName}`, msgId || undefined, undefined, {
        mediaType: 'contact',
      });
      if (msgId) {
        await dbContext.db.update(waMessages).set({ vcardData }).where(eq(waMessages.id, msgId));
      }
      return { success: true, messageId: msgId, vcardData };
    } catch (err) {
      return reply.status(500).send({ success: false, error: (err as Error).message });
    }
  });

  // Toggle Star / Bookmark Message
  app.post<{
    Params: { sessionId: string; messageId: string };
  }>('/api/sessions/:sessionId/messages/:messageId/star', { preHandler: requireApiOrKeyAuth }, async (req) => {
    const { messageId } = req.params;
    const isStarred = await toggleStarMessage(dbContext.db, messageId);
    return { success: true, messageId, isStarred };
  });

  // Get Starred Messages
  app.get<{
    Params: { sessionId: string };
    Querystring: { jid?: string };
  }>('/api/sessions/:sessionId/starred', { preHandler: requireApiOrKeyAuth }, async (req) => {
    const { sessionId } = req.params;
    const { jid } = req.query;
    const messages = await getStarredMessages(dbContext.db, sessionId, jid ? decodeURIComponent(jid) : undefined);
    return { success: true, data: messages };
  });

  // Read Receipts (Blue double check)
  app.post<{
    Params: { sessionId: string; jid: string };
    Body: { messageIds?: string[] };
  }>('/api/sessions/:sessionId/chats/:jid/read', { preHandler: requireApiOrKeyAuth }, async (req) => {
    const { sessionId, jid } = req.params;
    const decodedJid = decodeURIComponent(jid);
    const client = manager.getSession(sessionId);

    if (client && client.isConnected() && req.body?.messageIds && req.body.messageIds.length > 0) {
      const keys = req.body.messageIds.map((id) => ({
        remoteJid: decodedJid,
        id,
      }));
      void client.readMessages(keys);
    }
    await markChatRead(dbContext.db, sessionId, decodedJid);
    return { success: true };
  });

  // Chat Metadata (Pin, Archive, Mute, Labels, Notes)
  app.get<{
    Params: { sessionId: string; jid: string };
  }>('/api/sessions/:sessionId/chats/:jid/meta', { preHandler: requireApiOrKeyAuth }, async (req) => {
    const { sessionId, jid } = req.params;
    const meta = await getChatMeta(dbContext.db, sessionId, decodeURIComponent(jid));
    return { success: true, data: meta };
  });

  app.patch<{
    Params: { sessionId: string; jid: string };
    Body: {
      isPinned?: boolean;
      isArchived?: boolean;
      isMuted?: boolean;
      isUnreadManual?: boolean;
      labels?: string[];
      internalNotes?: string;
    };
  }>('/api/sessions/:sessionId/chats/:jid/meta', { preHandler: requireApiOrKeyAuth }, async (req) => {
    const { sessionId, jid } = req.params;
    const meta = await updateChatMeta(dbContext.db, sessionId, decodeURIComponent(jid), req.body || {});
    broadcast('chat_meta_updated', { sessionId, jid: decodeURIComponent(jid), meta });
    return { success: true, data: meta };
  });

  app.get<{
    Params: { sessionId: string };
  }>('/api/sessions/:sessionId/chats-meta', { preHandler: requireApiOrKeyAuth }, async (req) => {
    const { sessionId } = req.params;
    const list = await getAllChatMetas(dbContext.db, sessionId);
    return { success: true, data: list };
  });

  // ==========================================
  // GROUP ADMINISTRATION
  // ==========================================

  // Get Group Metadata
  app.get<{
    Params: { sessionId: string; jid: string };
  }>('/api/sessions/:sessionId/groups/:jid', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId, jid } = req.params;
    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) {
      return reply.status(400).send({ success: false, error: 'Session not connected' });
    }
    try {
      const data = await client.getGroupMetadata(decodeURIComponent(jid));
      return { success: true, data };
    } catch (err) {
      return reply.status(500).send({ success: false, error: (err as Error).message });
    }
  });

  // Update Group Subject
  app.patch<{
    Params: { sessionId: string; jid: string };
    Body: { subject: string };
  }>('/api/sessions/:sessionId/groups/:jid/subject', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId, jid } = req.params;
    const { subject } = req.body || {};
    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) return reply.status(400).send({ success: false, error: 'Not connected' });
    try {
      await client.updateGroupSubject(decodeURIComponent(jid), subject);
      return { success: true };
    } catch (err) {
      return reply.status(500).send({ success: false, error: (err as Error).message });
    }
  });

  // Update Group Description
  app.patch<{
    Params: { sessionId: string; jid: string };
    Body: { description: string };
  }>('/api/sessions/:sessionId/groups/:jid/description', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId, jid } = req.params;
    const { description } = req.body || {};
    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) return reply.status(400).send({ success: false, error: 'Not connected' });
    try {
      await client.updateGroupDescription(decodeURIComponent(jid), description);
      return { success: true };
    } catch (err) {
      return reply.status(500).send({ success: false, error: (err as Error).message });
    }
  });

  // Group Participants (promote, demote, add, remove)
  app.post<{
    Params: { sessionId: string; jid: string };
    Body: { participants: string[]; action: 'add' | 'remove' | 'promote' | 'demote' };
  }>('/api/sessions/:sessionId/groups/:jid/participants', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId, jid } = req.params;
    const { participants, action } = req.body || {};
    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) return reply.status(400).send({ success: false, error: 'Not connected' });
    try {
      const result = await client.updateGroupParticipants(decodeURIComponent(jid), participants, action);
      return { success: true, result };
    } catch (err) {
      return reply.status(500).send({ success: false, error: (err as Error).message });
    }
  });

  // Group Invite Code
  app.get<{
    Params: { sessionId: string; jid: string };
  }>('/api/sessions/:sessionId/groups/:jid/invite-code', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId, jid } = req.params;
    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) return reply.status(400).send({ success: false, error: 'Not connected' });
    try {
      const code = await client.getGroupInviteCode(decodeURIComponent(jid));
      return { success: true, code, link: code ? `https://chat.whatsapp.com/${code}` : null };
    } catch (err) {
      return reply.status(500).send({ success: false, error: (err as Error).message });
    }
  });

  // Leave Group
  app.post<{
    Params: { sessionId: string; jid: string };
  }>('/api/sessions/:sessionId/groups/:jid/leave', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId, jid } = req.params;
    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) return reply.status(400).send({ success: false, error: 'Not connected' });
    try {
      await client.leaveGroup(decodeURIComponent(jid));
      return { success: true };
    } catch (err) {
      return reply.status(500).send({ success: false, error: (err as Error).message });
    }
  });

  // External webhook configuration and delivery are owned by @rocksoul/webhooks.

  // List Scheduled Messages
  app.get<{
    Params: { sessionId: string };
  }>('/api/sessions/:sessionId/scheduled', { preHandler: requireApiOrKeyAuth }, async (req) => {
    const list = await listScheduledMessages(dbContext.db, req.params.sessionId);
    return { success: true, data: list };
  });

  // Schedule a Message
  app.post<{
    Params: { sessionId: string };
    Body: { remoteJid: string; text: string; scheduledAt: number };
  }>('/api/sessions/:sessionId/scheduled', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { remoteJid, text, scheduledAt } = req.body || {};
    if (!remoteJid || !text || !scheduledAt) {
      return reply.status(400).send({ success: false, error: 'remoteJid, text, scheduledAt required' });
    }
    const item = await createScheduledMessage(
      dbContext.db,
      req.params.sessionId,
      remoteJid,
      JSON.stringify({ text }),
      scheduledAt
    );
    return { success: true, data: item };
  });

  // Auto Replies CRUD
  app.get<{
    Params: { sessionId: string };
  }>('/api/sessions/:sessionId/auto-replies', { preHandler: requireApiOrKeyAuth }, async (req) => {
    const list = await listAutoReplies(dbContext.db, req.params.sessionId);
    return { success: true, data: list };
  });

  app.post<{
    Params: { sessionId: string };
    Body: { keyword: string; replyText: string; matchType?: 'exact' | 'contains' };
  }>('/api/sessions/:sessionId/auto-replies', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { keyword, replyText, matchType = 'exact' } = req.body || {};
    if (!keyword || !replyText) return reply.status(400).send({ success: false, error: 'keyword and replyText required' });
    const item = await createAutoReply(dbContext.db, req.params.sessionId, keyword, matchType, replyText);
    return { success: true, data: item };
  });

  app.delete<{
    Params: { id: string };
  }>('/api/auto-replies/:id', { preHandler: requireApiOrKeyAuth }, async (req) => {
    await deleteAutoReply(dbContext.db, req.params.id);
    return { success: true };
  });

  // Quick Replies CRUD
  app.get('/api/quick-replies', { preHandler: requireApiOrKeyAuth }, async () => {
    const list = await listQuickReplies(dbContext.db);
    return { success: true, data: list };
  });

  app.post<{
    Body: { shortcut: string; title: string; content: string };
  }>('/api/quick-replies', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { shortcut, title, content } = req.body || {};
    if (!shortcut || !title || !content) return reply.status(400).send({ success: false, error: 'shortcut, title, content required' });
    const item = await createQuickReply(dbContext.db, shortcut, title, content);
    return { success: true, data: item };
  });

  app.delete<{
    Params: { id: string };
  }>('/api/quick-replies/:id', { preHandler: requireApiOrKeyAuth }, async (req) => {
    await deleteQuickReply(dbContext.db, req.params.id);
    return { success: true };
  });

  app.get('/api/whatsapp/auto-replies', { preHandler: requireApiOrKeyAuth }, async () => {
    const list = await listAutoReplies(dbContext.db);
    return { success: true, data: list };
  });

  app.post<{
    Body: { triggerKeyword?: string; keyword?: string; replyText: string; matchType?: 'exact' | 'contains' | 'regex'; sessionId?: string };
  }>('/api/whatsapp/auto-replies', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { triggerKeyword, keyword, replyText, matchType = 'exact', sessionId } = req.body || {};
    const key = triggerKeyword || keyword;
    if (!key || !replyText) return reply.status(400).send({ success: false, error: 'triggerKeyword and replyText required' });
    const item = await createAutoReply(dbContext.db, sessionId || 'default', key, matchType, replyText);
    return { success: true, autoReply: item, data: item };
  });

  app.delete<{
    Params: { id: string };
  }>('/api/whatsapp/auto-replies/:id', { preHandler: requireApiOrKeyAuth }, async (req) => {
    await deleteAutoReply(dbContext.db, req.params.id);
    return { success: true };
  });

  app.get('/api/whatsapp/quick-replies', { preHandler: requireApiOrKeyAuth }, async () => {
    const list = await listQuickReplies(dbContext.db);
    return { success: true, data: list };
  });

  app.post<{
    Body: { shortcut: string; title: string; content: string };
  }>('/api/whatsapp/quick-replies', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { shortcut, title, content } = req.body || {};
    if (!shortcut || !title || !content) return reply.status(400).send({ success: false, error: 'shortcut, title, content required' });
    const item = await createQuickReply(dbContext.db, shortcut, title, content);
    return { success: true, quickReply: item, data: item };
  });

  app.delete<{
    Params: { id: string };
  }>('/api/whatsapp/quick-replies/:id', { preHandler: requireApiOrKeyAuth }, async (req) => {
    await deleteQuickReply(dbContext.db, req.params.id);
    return { success: true };
  });

  app.get('/api/whatsapp/scheduled-messages', { preHandler: requireApiOrKeyAuth }, async () => {
    const list = await listScheduledMessages(dbContext.db);
    return { success: true, data: list };
  });

  app.post<{
    Body: { sessionId?: string; remoteJid: string; text: string; scheduledAt: number };
  }>('/api/whatsapp/scheduled-messages', { preHandler: requireApiOrKeyAuth }, async (req, reply) => {
    const { sessionId = 'default', remoteJid, text, scheduledAt } = req.body || {};
    if (!remoteJid || !text || !scheduledAt) return reply.status(400).send({ success: false, error: 'remoteJid, text, scheduledAt required' });
    const item = await createScheduledMessage(dbContext.db, sessionId, remoteJid, JSON.stringify({ text }), Math.floor(scheduledAt / 1000));
    return { success: true, scheduledMessage: item, data: item };
  });

  app.post<{
    Params: { id: string };
  }>('/api/whatsapp/scheduled-messages/:id/cancel', { preHandler: requireApiOrKeyAuth }, async (req) => {
    await updateScheduledMessageStatus(dbContext.db, req.params.id, 'cancelled');
    return { success: true };
  });


  // Link Preview Utility
  app.post<{
    Body: { url: string };
  }>('/api/utils/link-preview', async (req, reply) => {
    const { url } = req.body || {};
    if (!url) return reply.status(400).send({ success: false, error: 'url required' });
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'WhatsApp/2.23.20.0' }, signal: AbortSignal.timeout(4000) });
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
      const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

      return {
        success: true,
        data: {
          url,
          title: ogTitle?.[1] || titleMatch?.[1] || url,
          description: ogDesc?.[1] || '',
          image: ogImage?.[1] || null,
        },
      };
    } catch {
      return { success: true, data: { url, title: url, description: '', image: null } };
    }
  });

  // Prometheus Metrics
  app.get('/metrics', async (_req, reply) => {
    const sessions = manager.listSessions();
    const active = sessions.filter((s) => s.status === 'open').length;
    const mem = process.memoryUsage();

    const metricsStr = [
      '# HELP whatsapp_active_sessions Number of active open WhatsApp sessions',
      '# TYPE whatsapp_active_sessions gauge',
      `whatsapp_active_sessions ${active}`,
      '# HELP whatsapp_total_sessions Total number of registered WhatsApp sessions',
      '# TYPE whatsapp_total_sessions gauge',
      `whatsapp_total_sessions ${sessions.length}`,
      '# HELP whatsapp_ws_clients Number of connected frontend WebSocket clients',
      '# TYPE whatsapp_ws_clients gauge',
      `whatsapp_ws_clients ${wsClients.size}`,
      '# HELP node_memory_rss_bytes Node RSS memory usage in bytes',
      '# TYPE node_memory_rss_bytes gauge',
      `node_memory_rss_bytes ${mem.rss}`,
    ].join('\n');

    return reply.type('text/plain').send(metricsStr);
  });

  // Database Backup Snapshot Download
  app.get('/api/admin/backup', { preHandler: requireApiOrKeyAuth }, async (_req, reply) => {
    const dbPath = path.resolve(process.cwd(), 'data/whatsapp.db');
    if (!fs.existsSync(dbPath)) {
      return reply.status(404).send({ success: false, error: 'Database file not found' });
    }
    const buf = fs.readFileSync(dbPath);
    reply.header('Content-Disposition', 'attachment; filename="whatsapp-backup.db"');
    return reply.type('application/x-sqlite3').send(buf);
  });

  // ==========================================
  // REST API: HEALTH & SESSIONS
  // ==========================================

  // Health check
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'whatsapp-gateway',
      activeSessions: manager.listSessions().length,
      wsConnectedClients: wsClients.size,
      database: 'connected (sqlite)',
      timestamp: new Date().toISOString(),
    };
  });

  // List all sessions (Requires Auth)
  app.get('/sessions', { preHandler: requireApiOrKeyAuth }, async () => {
    return {
      success: true,
      data: manager.listSessions(),
    };
  });

  // Start / initialize a session
  app.post<{ Params: { sessionId: string } }>('/sessions/:sessionId/start', { preHandler: requireApiOrKeyAuth }, async (
    req,
    reply
  ) => {
    const { sessionId } = req.params;
    const client = await manager.getOrCreateSession(sessionId);

    const status = client.getStatus();
    if (status === 'idle' || status === 'close') {
      void client.initialize();
    }

    return reply.status(200).send({
      success: true,
      message: `Session '${sessionId}' initialization initiated`,
      status: client.getStatus(),
    });
  });

  // Get session status
  app.get<{ Params: { sessionId: string } }>('/sessions/:sessionId/status', { preHandler: requireApiOrKeyAuth }, async (
    req,
    reply
  ) => {
    const { sessionId } = req.params;
    const client = manager.getSession(sessionId);

    if (!client) {
      return reply.status(404).send({
        success: false,
        error: `Session '${sessionId}' not found`,
      });
    }

    return {
      success: true,
      sessionId,
      status: client.getStatus(),
      user: client.getUser(),
      hasQR: Boolean(client.getQR()),
    };
  });

  // Get QR code (JSON or Visual HTML)
  app.get('/sessions/:sessionId/qr', async (
    req: FastifyRequest<{
      Params: { sessionId: string };
      Querystring: { format?: string };
    }>,
    reply: FastifyReply
  ) => {
    const { sessionId } = req.params;
    const client = await manager.getOrCreateSession(sessionId);

    if (client.getStatus() === 'idle') {
      void client.initialize();
    }

    const qr = client.getQR();
    const status = client.getStatus();
    const user = client.getUser();

    // Check if client is already connected
    if (status === 'open' && user) {
      const acceptsHtml = req.headers.accept?.includes('text/html') || req.query.format === 'html';
      if (acceptsHtml) {
        return reply.type('text/html').send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>WhatsApp Connected - ${sessionId}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: #131b2e; padding: 2.5rem; border-radius: 1rem; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #1e293b; max-width: 400px; width: 90%; }
                .badge { background: #10b981; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: bold; font-size: 0.85rem; display: inline-block; margin-bottom: 1rem; }
                h2 { margin: 0 0 0.5rem 0; color: #fff; }
                p { color: #94a3b8; margin: 0.25rem 0; }
              </style>
            </head>
            <body>
              <div class="card">
                <span class="badge">CONNECTED</span>
                <h2>${user.name || 'WhatsApp Device'}</h2>
                <p><strong>Phone:</strong> +${user.phone}</p>
                <p><strong>Session ID:</strong> ${sessionId}</p>
                <p style="margin-top: 1.5rem; font-size: 0.85rem; color: #64748b;">WhatsApp socket is active and ready to transmit messages.</p>
                <div style="margin-top: 1.5rem;">
                  <a href="/chat?session=${sessionId}" style="background: #22c55e; color: white; text-decoration: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 600;">Buka WhatsApp Web Chat 💬</a>
                </div>
              </div>
            </body>
          </html>
        `);
      }

      return {
        success: true,
        status: 'open',
        user,
        message: 'Device already connected',
      };
    }

    if (!qr) {
      const acceptsHtml = req.headers.accept?.includes('text/html') || req.query.format === 'html';
      if (acceptsHtml) {
        return reply.type('text/html').send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta http-equiv="refresh" content="3">
              <title>Generating QR - ${sessionId}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: #131b2e; padding: 2.5rem; border-radius: 1rem; text-align: center; border: 1px solid #334155; }
                .spinner { width: 40px; height: 40px; border: 4px solid #334155; border-top-color: #22c55e; border-radius: 50%; animation: spin 1s infinite linear; margin: 0 auto 1.5rem auto; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="spinner"></div>
                <h3>Generating QR Code for '${sessionId}'...</h3>
                <p style="color: #94a3b8; font-size: 0.9rem;">Please wait, auto-refreshing in 3 seconds.</p>
              </div>
            </body>
          </html>
        `);
      }

      return reply.status(202).send({
        success: false,
        status,
        message: 'QR Code is generating, please retry in 2-3 seconds',
      });
    }

    // Render QR data URL
    const qrDataUrl = await QRCode.toDataURL(qr, { scale: 8, margin: 2 });

    const acceptsHtml = req.headers.accept?.includes('text/html') || req.query.format === 'html';
    if (acceptsHtml) {
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta http-equiv="refresh" content="15">
            <title>Scan WhatsApp QR - ${sessionId}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #131b2e; padding: 2rem; border-radius: 1rem; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; max-width: 420px; }
              img { background: white; padding: 12px; border-radius: 12px; margin: 1rem 0; width: 260px; height: 260px; }
              h2 { margin: 0; color: #fff; }
              p { color: #94a3b8; font-size: 0.9rem; margin: 0.5rem 0; }
              .instruction { background: #0b0f19; padding: 0.75rem; border-radius: 8px; font-size: 0.8rem; color: #cbd5e1; text-align: left; margin-top: 1rem; border: 1px solid #1e293b; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Scan WhatsApp QR</h2>
              <p>Session: <strong>${sessionId}</strong></p>
              <img src="${qrDataUrl}" alt="WhatsApp QR Code" />
              <p style="font-size: 0.8rem; color: #64748b;">Halaman otomatis refresh setiap 15 detik</p>
              <div class="instruction">
                1. Buka WhatsApp di HP Anda.<br/>
                2. Buka <strong>Perangkat Tertaut</strong> (Linked Devices).<br/>
                3. Arahkan kamera HP ke QR Code di atas.
              </div>
            </div>
          </body>
        </html>
      `);
    }

    return {
      success: true,
      sessionId,
      status: 'qrcode',
      qr,
      qrDataUrl,
    };
  });

  // Send a text message (Protected by API Key or Dashboard Auth)
  app.post<{
    Params: { sessionId: string };
    Body: { to?: string; text?: string };
  }>('/sessions/:sessionId/messages/send', { preHandler: requireApiOrKeyAuth }, async (
    req,
    reply
  ) => {
    const { sessionId } = req.params;
    const { to, text } = req.body || {};

    if (!to || !text) {
      return reply.status(400).send({
        success: false,
        error: "Fields 'to' and 'text' are required in request body",
      });
    }

    const client = manager.getSession(sessionId);
    if (!client || !client.isConnected()) {
      return reply.status(400).send({
        success: false,
        error: `Session '${sessionId}' is not connected to WhatsApp`,
        status: client?.getStatus() ?? 'not_found',
      });
    }

    try {
      const jid = formatToWhatsAppJid(to);
      const result = await client.sendMessage(jid, text);
      const msgId = result?.key?.id;

      // Save to SQLite
      await saveOutgoingMessage(dbContext.db, sessionId, jid, text, msgId || undefined);

      // Broadcast to WebSocket
      broadcast('new_message', {
        sessionId,
        message: {
          id: msgId,
          remoteJid: jid,
          senderNumber: extractPhoneNumber(jid),
          fromMe: true,
          text,
          timestamp: Math.floor(Date.now() / 1000),
        },
      });

      broadcast('chats_updated', { sessionId });

      return {
        success: true,
        messageId: msgId,
        to: jid,
        timestamp: Date.now(),
      };
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Logout session
  app.post<{ Params: { sessionId: string } }>('/sessions/:sessionId/logout', { preHandler: requireApiOrKeyAuth }, async (
    req,
    _reply
  ) => {
    const { sessionId } = req.params;
    const success = await manager.logoutSession(sessionId);

    return {
      success,
      message: success ? `Session '${sessionId}' logged out and cleared` : `Session '${sessionId}' not found`,
    };
  });

  // Disconnect session
  app.delete<{ Params: { sessionId: string } }>('/sessions/:sessionId', { preHandler: requireApiOrKeyAuth }, async (
    req,
    _reply
  ) => {
    const { sessionId } = req.params;
    const success = await manager.deleteSession(sessionId);

    return {
      success,
      message: success ? `Session '${sessionId}' terminated` : `Session '${sessionId}' not found`,
    };
  });
};

export const whatsappPlugin = fp(whatsappPluginFn, {
  name: 'rocksoul-whatsapp',
});
