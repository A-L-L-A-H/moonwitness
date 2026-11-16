import type { FastifyPluginAsync } from 'fastify';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import dns from 'node:dns/promises';
import { errorResponse, successResponse } from '@rocksoul/common';

const root = path.resolve(process.env.ROCKSOUL_WORKSPACE_ROOT || process.cwd());
const blockedHosts = new Set(['localhost', '127.0.0.1', '::1']);

function isPrivateHost(hostname: string) {
  if (blockedHosts.has(hostname) || hostname.endsWith('.local')) return true;
  if (net.isIP(hostname) !== 4) return false;
  const octets = hostname.split('.').map(Number);
  return octets[0] === 10 || octets[0] === 127 || octets[0] === 0 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 169 && octets[1] === 254);
}

function workspacePath(relative: string) {
  const resolved = path.resolve(root, relative || '.');
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) throw new Error('Path is outside workspace');
  return resolved;
}

export const aiWorkspaceRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get('/coding/files', async (request, reply) => {
    const query = request.query as { path?: string };
    try {
      const directory = workspacePath(query.path || '.');
      const entries = await fs.readdir(directory, { withFileTypes: true });
      return reply.send(successResponse(entries.filter((entry) => !entry.name.startsWith('.') && entry.name !== 'node_modules').map((entry) => ({ name: entry.name, path: path.relative(root, path.join(directory, entry.name)).replaceAll('\\', '/'), kind: entry.isDirectory() ? 'directory' : 'file' })), 'Workspace files retrieved'));
    } catch (error) {
      return reply.status(404).send(errorResponse({ code: 'WORKSPACE_PATH_NOT_FOUND', statusCode: 404 }, error instanceof Error ? error.message : 'Workspace path not found'));
    }
  });

  app.get('/coding/file', async (request, reply) => {
    const query = request.query as { path?: string };
    try {
      const filePath = workspacePath(query.path || '');
      const stat = await fs.stat(filePath);
      if (!stat.isFile() || stat.size > 512_000) return reply.status(422).send(errorResponse({ code: 'FILE_NOT_READABLE', statusCode: 422 }, 'Only files up to 512 KB can be inspected'));
      return reply.send(successResponse({ path: query.path, content: await fs.readFile(filePath, 'utf8'), size: stat.size }, 'Workspace file retrieved'));
    } catch (error) {
      return reply.status(404).send(errorResponse({ code: 'WORKSPACE_FILE_NOT_FOUND', statusCode: 404 }, error instanceof Error ? error.message : 'Workspace file not found'));
    }
  });

  app.post('/browser/fetch', async (request, reply) => {
    const body = request.body as { url?: string };
    try {
      const target = new URL(body?.url || '');
      if (!['http:', 'https:'].includes(target.protocol) || isPrivateHost(target.hostname)) throw new Error('Only public HTTP(S) URLs are allowed');
      const resolvedHosts = await dns.lookup(target.hostname, { all: true });
      if (resolvedHosts.some((entry) => isPrivateHost(entry.address))) throw new Error('Only public HTTP(S) URLs are allowed');
      const response = await fetch(target, { signal: AbortSignal.timeout(10_000), redirect: 'error' });
      const text = (await response.text()).slice(0, 1_000_000);
      return reply.send(successResponse({ url: target.toString(), status: response.status, contentType: response.headers.get('content-type'), body: text }, 'Browser page fetched'));
    } catch (error) {
      return reply.status(422).send(errorResponse({ code: 'BROWSER_FETCH_FAILED', statusCode: 422 }, error instanceof Error ? error.message : 'Browser fetch failed'));
    }
  });
};
