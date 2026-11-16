import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/view';
import '@fastify/cookie';
import { env } from '../config/env.js';
import { marked } from 'marked';
import { rocksoulAssets } from '../services/assets.js';
import { ai } from '@rocksoul/ai-base';
import { successResponse, errorResponse } from '@rocksoul/common';
import {
  users,
  apiKeys,
  organizations,
  hashPassword,
  generateApiKey,
  eq,
} from '@rocksoul/orm';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DASHBOARD_SESSION_COOKIE = 'rs_dashboard_auth';

function getDashboardSessionToken(): string {
  return createHmac('sha256', env.DASHBOARD_PASSWORD)
    .update('rocksoul_dashboard_session_v1')
    .digest('hex');
}

function isDashboardAuthorized(request: FastifyRequest): boolean {
  const token = getDashboardSessionToken();

  // 1. Check signed/encrypted cookie
  const cookieVal = request.cookies?.[DASHBOARD_SESSION_COOKIE];
  if (cookieVal && cookieVal === token) {
    return true;
  }

  // 2. Check query parameter ?key=...
  const query = request.query as Record<string, string> | undefined;
  if (query?.key && query.key === env.DASHBOARD_PASSWORD) {
    return true;
  }

  // 3. Check header x-dashboard-key
  const headerKey = request.headers['x-dashboard-key'];
  if (typeof headerKey === 'string' && headerKey === env.DASHBOARD_PASSWORD) {
    return true;
  }

  // 4. Check Authorization: Bearer <password>
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader === `Bearer ${env.DASHBOARD_PASSWORD}`) {
    return true;
  }

  return false;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function getMemoryTelemetry() {
  const mem = process.memoryUsage();
  return {
    rss: `${(mem.rss / (1024 * 1024)).toFixed(2)} MB`,
    heapTotal: `${(mem.heapTotal / (1024 * 1024)).toFixed(2)} MB`,
    heapUsed: `${(mem.heapUsed / (1024 * 1024)).toFixed(2)} MB`,
    external: `${(mem.external / (1024 * 1024)).toFixed(2)} MB`,
    heapUsagePercentage: `${((mem.heapUsed / mem.heapTotal) * 100).toFixed(1)}%`,
  };
}

function getRootDir(): string {
  const rootCandidates = [
    resolve(process.cwd()),
    resolve(__dirname, '../../../../'),
    resolve(__dirname, '../../../'),
    resolve(__dirname, '../../'),
  ];
  return rootCandidates.find((dir) => existsSync(join(dir, 'packages'))) || process.cwd();
}

/**
 * Discovers and inspects all workspace packages programmatically from filesystem
 */
function getWorkspacePackages() {
  const rootDir = getRootDir();

  const packagesDir = join(rootDir, 'packages');
  const appsDir = join(rootDir, 'apps');

  const discoveredPackages: Array<{
    name: string;
    version: string;
    description: string;
    type: string;
    dependencies: string[];
    devDependencies: string[];
    path: string;
  }> = [];

  function scanFolder(basePath: string) {
    if (!existsSync(basePath)) return;
    try {
      const entries = readdirSync(basePath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const fullPath = join(basePath, entry.name);
        const pkgPath = join(fullPath, 'package.json');

        if (existsSync(pkgPath)) {
          try {
            const raw = readFileSync(pkgPath, 'utf-8');
            const pkg = JSON.parse(raw);
            discoveredPackages.push({
              name: pkg.name || entry.name,
              version: pkg.version || '1.0.0',
              description: pkg.description || '',
              type: pkg.type || 'module',
              dependencies: Object.keys(pkg.dependencies || {}),
              devDependencies: Object.keys(pkg.devDependencies || {}),
              path: fullPath.replace(rootDir, '').replace(/^[\\\/]/, ''),
            });
          } catch {
            // skip if malformed
          }
        } else {
          try {
            const subEntries = readdirSync(fullPath, { withFileTypes: true });
            for (const sub of subEntries) {
              if (!sub.isDirectory()) continue;
              const subPkgPath = join(fullPath, sub.name, 'package.json');
              if (existsSync(subPkgPath)) {
                try {
                  const rawSub = readFileSync(subPkgPath, 'utf-8');
                  const pkg = JSON.parse(rawSub);
                  discoveredPackages.push({
                    name: pkg.name || `${entry.name}/${sub.name}`,
                    version: pkg.version || '1.0.0',
                    description: pkg.description || '',
                    type: pkg.type || 'module',
                    dependencies: Object.keys(pkg.dependencies || {}),
                    devDependencies: Object.keys(pkg.devDependencies || {}),
                    path: join(fullPath, sub.name).replace(rootDir, '').replace(/^[\\\/]/, ''),
                  });
                } catch {
                  // skip
                }
              }
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      // skip
    }
  }

  scanFolder(packagesDir);
  scanFolder(appsDir);

  return discoveredPackages;
}

/**
 * Programmatically queries SQLite catalog (sqlite_master) for tables, row counts and columns
 */
async function getProgrammaticDbStats(app: FastifyInstance) {
  const startPing = process.hrtime();
  let status = 'DISCONNECTED';
  let pingLatencyMs = 0;
  const tables: Array<{
    name: string;
    rowCount: number;
    columnCount: number;
    columns: string[];
  }> = [];

  try {
    const pingRes = await app.dbClient.execute('SELECT 1 as ping;');
    const diff = process.hrtime(startPing);
    pingLatencyMs = Number((diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2));
    if (pingRes.rows && pingRes.rows.length > 0) {
      status = 'CONNECTED';
    }

    const tablesMaster = await app.dbClient.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%' ORDER BY name ASC;"
    );

    for (const row of tablesMaster.rows) {
      const tableName = String(row.name);
      try {
        const countRes = await app.dbClient.execute(`SELECT count(*) as total FROM "${tableName}";`);
        const rowCount = Number(countRes.rows[0]?.total ?? 0);

        const colRes = await app.dbClient.execute(`PRAGMA table_info("${tableName}");`);
        const columns = colRes.rows.map((r: any) => String(r.name));

        tables.push({
          name: tableName,
          rowCount,
          columnCount: columns.length,
          columns,
        });
      } catch {
        tables.push({
          name: tableName,
          rowCount: 0,
          columnCount: 0,
          columns: [],
        });
      }
    }
  } catch (err) {
    status = 'ERROR';
    app.log.warn({ err }, 'Failed querying database stats');
  }

  const totalRecords = tables.reduce((acc, t) => acc + t.rowCount, 0);

  return {
    status,
    pingLatency: `${pingLatencyMs}ms`,
    target: env.DATABASE_URL,
    totalTables: tables.length,
    totalRecords,
    tables,
  };
}

/**
 * Programmatically queries recent logs and calculates level distribution directly from SQLite
 */
async function getRecentLogsAndStats(app: FastifyInstance) {
  try {
    const logsRes = await app.dbClient.execute(
      'SELECT id, level, message, method, url, status_code as statusCode, response_time as responseTime, created_at as createdAt FROM system_logs ORDER BY created_at DESC LIMIT 20;'
    );

    const statsRes = await app.dbClient.execute(
      'SELECT level, count(*) as count FROM system_logs GROUP BY level;'
    );

    const logDistribution: Record<string, number> = {};
    for (const row of statsRes.rows) {
      logDistribution[String(row.level)] = Number(row.count ?? 0);
    }

    return {
      recentLogs: logsRes.rows.map((r: any) => ({
        id: String(r.id),
        level: String(r.level || 'info'),
        message: String(r.message || ''),
        method: r.method ? String(r.method) : null,
        url: r.url ? String(r.url) : null,
        statusCode: r.statusCode ? Number(r.statusCode) : null,
        responseTime: r.responseTime ? Number(r.responseTime) : null,
        createdAt: String(r.createdAt || ''),
      })),
      logStats: logDistribution,
    };
  } catch {
    return {
      recentLogs: [],
      logStats: {},
    };
  }
}

/**
 * Programmatically queries Users and API Keys for User/Auth Management
 */
async function getUserAndAuthData(app: FastifyInstance) {
  try {
    const usersRes = await app.dbClient.execute(
      'SELECT id, name, email, role, status, plan, is_active as isActive, created_at as createdAt FROM users ORDER BY created_at DESC LIMIT 50;'
    );

    const apiKeysRes = await app.dbClient.execute(
      'SELECT id, name, key_prefix as keyPrefix, scopes, user_id as userId, is_active as isActive, created_at as createdAt, expires_at as expiresAt FROM api_keys ORDER BY created_at DESC LIMIT 50;'
    );

    const usersList = usersRes.rows.map((u: any) => ({
      id: String(u.id),
      name: String(u.name || 'Anonymous'),
      email: String(u.email || ''),
      role: String(u.role || 'user'),
      status: String(u.status || 'Active'),
      plan: u.plan ? String(u.plan) : 'Standard',
      isActive: Boolean(u.isActive),
      createdAt: String(u.createdAt || ''),
    }));

    const apiKeysList = apiKeysRes.rows.map((k: any) => {
      let parsedScopes: string[] = [];
      try {
        parsedScopes = JSON.parse(String(k.scopes || '["*"]'));
      } catch {
        parsedScopes = ['*'];
      }
      return {
        id: String(k.id),
        name: String(k.name || 'API Key'),
        keyPrefix: String(k.keyPrefix || 'rs_live'),
        scopes: parsedScopes,
        userId: k.userId ? String(k.userId) : null,
        isActive: Boolean(k.isActive),
        createdAt: String(k.createdAt || ''),
        expiresAt: k.expiresAt ? String(k.expiresAt) : null,
      };
    });

    return {
      users: usersList,
      apiKeys: apiKeysList,
    };
  } catch (err) {
    app.log.warn({ err }, 'Error loading user and auth telemetry');
    return {
      users: [],
      apiKeys: [],
    };
  }
}

/**
 * Builds the complete dynamic telemetry data object
 */
async function buildFullTelemetryData(app: FastifyInstance, startTime: [number, number]) {
  const uptimeSec = process.uptime();
  const memStats = getMemoryTelemetry();
  const cpu = process.cpuUsage();

  const dbStats = await getProgrammaticDbStats(app);
  const workspacePackages = getWorkspacePackages();
  const { users: usersList, apiKeys: apiKeysList } = await getUserAndAuthData(app);

  let aiAgents: Array<{ id: string; name: string; status: string; description?: string; capabilities: string[] }> = [];
  let aiTools: Array<{ id: string; name: string; description: string; policy: string }> = [];

  try {
    aiAgents = ai.getAgents().map((a) => ({
      id: a.id,
      name: a.name,
      status: a.status,
      description: a.description,
      capabilities: a.capabilities || [],
    }));

    aiTools = ai.tools.list().map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      policy: t.policy || 'ALLOW',
    }));
  } catch (err) {
    app.log.warn({ err }, 'Error retrieving AI engine reflection');
  }

  const rawRoutes = app.routeRegistry || [];
  const seenRoutes = new Set<string>();
  const routes = rawRoutes.filter((r) => {
    const key = `${r.method}:${r.url}`;
    if (seenRoutes.has(key)) return false;
    seenRoutes.add(key);
    return true;
  });

  const decoratorChecks = [
    { name: 'app.db (Drizzle ORM)', available: app.hasDecorator('db'), type: 'Database ORM' },
    { name: 'app.dbClient (LibSQL Driver)', available: app.hasDecorator('dbClient'), type: 'Database Driver' },
    { name: 'app.logToDb (SQLite Logging Hook)', available: app.hasDecorator('logToDb'), type: 'Observability' },
    { name: 'app.authenticate (JWT & API-Key Guard)', available: app.hasDecorator('authenticate'), type: 'Security' },
    { name: 'app.swagger (OpenAPI 3.0 Engine)', available: app.hasDecorator('swagger'), type: 'Documentation' },
    { name: 'app.routeRegistry (Reflection Hook)', available: app.hasDecorator('routeRegistry'), type: 'Router Telemetry' },
    { name: 'reply.view (Fastify View EJS Engine)', available: app.hasDecorator('view'), type: 'Template Rendering' },
  ];

  const { recentLogs, logStats } = await getRecentLogsAndStats(app);

  const rootDir = getRootDir();
  let readmeHtml = '';
  try {
    const rootReadmePath = join(rootDir, 'README.md');
    if (existsSync(rootReadmePath)) {
      const readmeContent = readFileSync(rootReadmePath, 'utf-8');
      readmeHtml = await marked.parse(readmeContent, { gfm: true, breaks: true });
    }
  } catch (err) {
    app.log.warn({ err }, 'Error parsing root README.md');
    readmeHtml = '<div class="alert alert-warning">Unable to parse root README.md</div>';
  }

  const diff = process.hrtime(startTime);
  const executionTimeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

  return {
    service: {
      name: 'RockSoul Fastify API Gateway',
      tagline: 'High-Performance Modular Application Communication Runtime',
      version: '1.0.0',
      environment: env.NODE_ENV,
      status: 'OPERATIONAL',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptimeSec),
        human: formatUptime(uptimeSec),
      },
      telemetryGenerationTime: `${executionTimeMs}ms`,
    },
    system: {
      runtime: `Node.js ${process.version}`,
      platform: process.platform,
      architecture: process.arch,
      processId: process.pid,
      memory: memStats,
      cpu: {
        userMicros: cpu.user,
        systemMicros: cpu.system,
      },
    },
    database: dbStats,
    connectedServices: [
      {
        name: 'Fastify API Core',
        endpoint: `http://${env.HOST}:${env.PORT}`,
        status: 'OPERATIONAL',
        details: `Fastify 5.x, Node ${process.version}, ${routes.length} registered routes`,
      },
      {
        name: 'SQLite Primary Store',
        endpoint: env.DATABASE_URL,
        status: dbStats.status,
        details: `${dbStats.totalTables} tables discovered, ${dbStats.totalRecords.toLocaleString()} rows, latency: ${dbStats.pingLatency}`,
      },
      {
        name: 'AEP WebSocket Bridge',
        endpoint: '/aep',
        status: 'OPERATIONAL',
        details: 'Realtime binary AEP frame loopback & protocol serialization',
      },
      {
        name: 'Autonomous AI Engine',
        endpoint: '/api/v1/ai',
        status: aiAgents.length > 0 ? 'OPERATIONAL' : 'STANDBY',
        details: `${aiAgents.length} agents registered, ${aiTools.length} tools mounted in registry`,
      },
      {
        name: 'Web Application Frontend',
        endpoint: 'http://localhost:5173 / :80',
        status: 'CONFIGURED',
        details: 'Vite 7, React 19, TailwindCSS 4, shadcn/ui monorepo web client',
      },
      {
        name: 'Go WebTransport Gateway',
        endpoint: 'https://localhost:6121/webtransport',
        status: 'CONFIGURED',
        details: 'HTTP/3 QUIC WebTransport endpoint for low-latency AEP datagram streaming',
      },
    ],
    modules: workspacePackages,
    aiEngine: {
      agents: aiAgents,
      tools: aiTools,
    },
    plugins: decoratorChecks,
    users: usersList,
    apiKeys: apiKeysList,
    recentLogs,
    logStats,
    routes,
    assets: rocksoulAssets.getSnapshot(),
    readmeHtml,
  };
}

export async function statsRoutes(app: FastifyInstance): Promise<void> {
  // ==========================================
  // 1. Root Gateway Dashboard & Telemetry Endpoint
  // ==========================================
  app.get(
    '/',
    {
      schema: {
        description: 'Protected Live Interactive Web Dashboard & Programmatic API Telemetry',
        tags: ['System'],
      },
    },
    async (request: FastifyRequest<{ Querystring: { format?: string; key?: string } }>, reply: FastifyReply) => {
      const startTime = process.hrtime();
      const authorized = isDashboardAuthorized(request);
      const isHtmlRequest = request.headers.accept?.includes('text/html') && request.query.format !== 'json';

      // If client is not authorized:
      if (!authorized) {
        if (isHtmlRequest) {
          // Render elegant glassmorphism login view with canonical brand
          return reply.code(401).view('login.ejs', { assets: rocksoulAssets.getSnapshot() });
        }
        return reply.code(401).send(
          errorResponse(
            { code: 'UNAUTHORIZED', statusCode: 401 },
            'Dashboard authentication required. Provide DASHBOARD_PASSWORD via session cookie, header x-dashboard-key, or ?key='
          )
        );
      }

      // Build full programmatic telemetry
      const statsData = await buildFullTelemetryData(app, startTime);

      const wantsJson =
        request.query.format === 'json' ||
        (!request.headers.accept?.includes('text/html') && request.query.format !== 'html');

      if (wantsJson) {
        return reply.code(200).send(successResponse(statsData, 'RockSoul API Programmatic Telemetry'));
      }

      // Render clean, modular EJS dashboard
      return reply.view('dashboard.ejs', { data: statsData });
    }
  );

  // ==========================================
  // 2. Dashboard Auth Actions
  // ==========================================
  app.post<{ Body: { password?: string } }>(
    '/api/dashboard/login',
    {
      schema: {
        description: 'Authenticate session for Gateway Dashboard',
        tags: ['System'],
      },
    },
    async (request, reply) => {
      const { password } = request.body || {};
      if (!password || password !== env.DASHBOARD_PASSWORD) {
        return reply.code(401).send(
          errorResponse({ code: 'INVALID_CREDENTIALS', statusCode: 401 }, 'Incorrect dashboard password')
        );
      }

      const token = getDashboardSessionToken();
      reply.setCookie(DASHBOARD_SESSION_COOKIE, token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return reply.send({ success: true, message: 'Authentication successful' });
    }
  );

  app.post(
    '/api/dashboard/logout',
    {
      schema: {
        description: 'Logout and clear Gateway Dashboard session',
        tags: ['System'],
      },
    },
    async (_request, reply) => {
      reply.clearCookie(DASHBOARD_SESSION_COOKIE, { path: '/' });
      return reply.send({ success: true, message: 'Session terminated' });
    }
  );

  app.get(
    '/logout',
    async (_request, reply) => {
      reply.clearCookie(DASHBOARD_SESSION_COOKIE, { path: '/' });
      return reply.redirect('/');
    }
  );

  // ==========================================
  // 3. Live Stats Feed for Auto-refresh
  // ==========================================
  app.get(
    '/api/dashboard/stats',
    {
      schema: {
        description: 'Live telemetry JSON feed for dynamic dashboard updates',
        tags: ['System'],
      },
    },
    async (request, reply) => {
      if (!isDashboardAuthorized(request)) {
        return reply.code(401).send(errorResponse({ code: 'UNAUTHORIZED', statusCode: 401 }, 'Unauthorized'));
      }
      const startTime = process.hrtime();
      const statsData = await buildFullTelemetryData(app, startTime);
      return reply.send(successResponse(statsData, 'Live Telemetry'));
    }
  );

  // ==========================================
  // 4. User Management Endpoints (CRUD)
  // ==========================================
  app.post<{ Body: { name: string; email: string; password?: string; role?: string } }>(
    '/api/dashboard/users',
    {
      schema: {
        description: 'Create user account from Dashboard User Management',
        tags: ['System'],
      },
    },
    async (request, reply) => {
      if (!isDashboardAuthorized(request)) {
        return reply.code(401).send(errorResponse({ code: 'UNAUTHORIZED', statusCode: 401 }, 'Unauthorized'));
      }

      const { name, email, password, role } = request.body || {};
      if (!name || !email || !password) {
        return reply.code(400).send(errorResponse({ code: 'VALIDATION_ERROR', statusCode: 400 }, 'Name, email, and password are required'));
      }

      const existing = await app.db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        return reply.code(409).send(errorResponse({ code: 'EMAIL_EXISTS', statusCode: 409 }, 'A user with this email already exists'));
      }

      const id = `usr_${randomUUID().replace(/-/g, '').substring(0, 12)}`;
      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();

      await app.db.insert(users).values({
        id,
        name,
        email,
        passwordHash,
        role: role === 'admin' ? 'admin' : 'user',
        status: 'Active',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return reply.code(201).send(successResponse({ id, name, email, role }, 'User created successfully'));
    }
  );

  app.patch<{ Params: { id: string } }>(
    '/api/dashboard/users/:id/toggle',
    {
      schema: {
        description: 'Toggle active status of a user',
        tags: ['System'],
      },
    },
    async (request, reply) => {
      if (!isDashboardAuthorized(request)) {
        return reply.code(401).send(errorResponse({ code: 'UNAUTHORIZED', statusCode: 401 }, 'Unauthorized'));
      }

      const { id } = request.params;
      const [existing] = await app.db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!existing) {
        return reply.code(404).send(errorResponse({ code: 'NOT_FOUND', statusCode: 404 }, 'User not found'));
      }

      const newStatus = !existing.isActive;
      await app.db
        .update(users)
        .set({
          isActive: newStatus,
          status: newStatus ? 'Active' : 'Inactive',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, id));

      return reply.send(successResponse({ id, isActive: newStatus }, `User status changed to ${newStatus ? 'Active' : 'Inactive'}`));
    }
  );

  // ==========================================
  // 5. Auth & API Key Management Endpoints
  // ==========================================
  app.post<{ Body: { name?: string; scopes?: string[]; userId?: string } }>(
    '/api/dashboard/api-keys',
    {
      schema: {
        description: 'Generate new scoped API key from Dashboard Auth Management',
        tags: ['System'],
      },
    },
    async (request, reply) => {
      if (!isDashboardAuthorized(request)) {
        return reply.code(401).send(errorResponse({ code: 'UNAUTHORIZED', statusCode: 401 }, 'Unauthorized'));
      }

      const { name, scopes, userId } = request.body || {};
      const { rawKey, keyHash, keyPrefix } = generateApiKey();
      const id = `key_${randomUUID().replace(/-/g, '').substring(0, 12)}`;
      const now = new Date().toISOString();

      await app.db.insert(apiKeys).values({
        id,
        name: name || 'Dashboard Generated Token',
        keyHash,
        keyPrefix,
        userId: userId || null,
        scopes: JSON.stringify(scopes && scopes.length ? scopes : ['*']),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return reply.code(201).send(
        successResponse(
          {
            id,
            name: name || 'Dashboard Generated Token',
            rawKey,
            keyPrefix,
            scopes: scopes || ['*'],
          },
          'API key generated successfully'
        )
      );
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/api/dashboard/api-keys/:id',
    {
      schema: {
        description: 'Revoke an API key from Dashboard Auth Management',
        tags: ['System'],
      },
    },
    async (request, reply) => {
      if (!isDashboardAuthorized(request)) {
        return reply.code(401).send(errorResponse({ code: 'UNAUTHORIZED', statusCode: 401 }, 'Unauthorized'));
      }

      const { id } = request.params;
      await app.db
        .update(apiKeys)
        .set({
          isActive: false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(apiKeys.id, id));

      return reply.send(successResponse({ id, isActive: false }, 'API key revoked successfully'));
    }
  );

  // ==========================================
  // 6. Programmatic Assets API
  // ==========================================
  app.get(
    '/api/v1/assets',
    {
      schema: {
        description: 'Get programmatic catalog of canonical MoonWitness and Rocksoul assets',
        tags: ['System'],
      },
    },
    async (_request, reply) => {
      const snapshot = rocksoulAssets.getSnapshot();
      return reply.send(
        successResponse(
          {
            baseUrl: snapshot.baseUrl,
            brand: snapshot.brand,
            surfaces: snapshot.surfaces,
            packs: snapshot.packs,
            catalog: rocksoulAssets.getAllAssetsCatalog(),
          },
          'Canonical Rocksoul & MoonWitness Assets Catalog'
        )
      );
    }
  );
}
