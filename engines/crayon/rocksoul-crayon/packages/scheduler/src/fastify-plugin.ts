import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { CronExpressionParser } from 'cron-parser';
import { config } from './config.js';
import { getJob, getRun, initDb, listJobs, listRuns, putJob, updateJob } from './db.js';
import { SchedulerService } from './services/scheduler-service.js';
import { executors, scheduleTypes } from './types.js';

declare module 'fastify' { interface FastifyInstance { scheduler: SchedulerService } }

const createSchema = z.object({
  id: z.string().min(1).max(128).optional(),
  name: z.string().min(1).max(200), description: z.string().max(2000).optional(),
  executor: z.enum(executors), target: z.string().min(1).max(200), scheduleType: z.enum(scheduleTypes),
  cronExpression: z.string().optional(), runAt: z.string().datetime().optional(),
  timezone: z.string().default(config.timezone), payload: z.unknown().default({}),
  enabled: z.boolean().default(true), maxRetries: z.number().int().min(0).max(20).default(0),
  timeoutMs: z.number().int().min(100).max(300000).default(30000), allowOverlap: z.boolean().default(false),
}).superRefine((v, c) => {
  if (v.scheduleType === 'cron' && !v.cronExpression) c.addIssue({ code: 'custom', path: ['cronExpression'], message: 'Required for cron' });
  if (v.scheduleType === 'once' && !v.runAt) c.addIssue({ code: 'custom', path: ['runAt'], message: 'Required for once' });
  if (v.cronExpression) { try { CronExpressionParser.parse(v.cronExpression, { tz: v.timezone }); } catch { c.addIssue({ code: 'custom', path: ['cronExpression'], message: 'Invalid cron expression or timezone' }); } }
});

export const schedulerPlugin: FastifyPluginAsync<{ databaseUrl?: string }> = fp(async (app, opts) => {
  const database = await initDb((opts as any).databaseUrl || config.databaseUrl);
  const service = new SchedulerService(database, config.concurrency, config.timezone, ((opts as any).databaseUrl || config.databaseUrl).replace(/^file:/, ''), app.log);
  app.decorate('scheduler', service);
  app.addHook('onRequest', async (request, reply) => { if (!config.apiKey || ['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return; if (request.headers.authorization !== `Bearer ${config.apiKey}`) return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Scheduler API authentication required' } }); });
  const error = (reply: any, code: string, message: string, status = 400) => reply.code(status).send({ success: false, error: { code, message } });
  app.get('/health', async () => ({ status: 'ok', service: 'rocksoul-scheduler', database: 'ok', schedulerEngine: 'plainjob', worker: 'ok', uptime: process.uptime() }));
  app.get('/jobs', async () => ({ success: true, data: await listJobs(database) }));
  app.post('/jobs', async (req, reply) => { const parsed = createSchema.safeParse(req.body); if (!parsed.success) return error(reply, 'VALIDATION_ERROR', parsed.error.issues[0].message); let job; const requestedId = typeof parsed.data.id === 'string' ? parsed.data.id : undefined; try { job = await putJob(database, parsed.data, requestedId as any); } catch (e) { if (requestedId && String(e).includes('UNIQUE')) job = await getJob(database, requestedId); else throw e; } if (job) service.register(job); return reply.code(201).send({ success: true, data: job }); });
  app.get<{ Params: { id: string } }>('/jobs/:id', async (req, reply) => { const job = await getJob(database, req.params.id); return job ? { success: true, data: job } : error(reply, 'JOB_NOT_FOUND', 'Scheduler job was not found', 404); });
  app.patch<{ Params: { id: string } }>('/jobs/:id', async (req, reply) => { const parsed = (createSchema as any)._def.schema.partial().safeParse(req.body); if (!parsed.success) return error(reply, 'VALIDATION_ERROR', parsed.error.issues[0].message); const job = await updateJob(database, req.params.id, parsed.data); if (!job) return error(reply, 'JOB_NOT_FOUND', 'Scheduler job was not found', 404); service.register(job); return { success: true, data: job }; });
  app.delete<{ Params: { id: string } }>('/jobs/:id', async (req, reply) => { service.unregister(req.params.id); const existing = await getJob(database, req.params.id); if (!existing) return error(reply, 'JOB_NOT_FOUND', 'Scheduler job was not found', 404); await updateJob(database, req.params.id, { status: 'deleted', enabled: false }); return { success: true, data: { ...existing, status: 'deleted', enabled: false } }; });
  for (const action of ['pause', 'resume'] as const) app.post<{ Params: { id: string } }>(`/jobs/:id/${action}`, async (req, reply) => { const job = await updateJob(database, req.params.id, { enabled: action === 'resume', status: action === 'resume' ? 'active' : 'paused' }); if (!job) return error(reply, 'JOB_NOT_FOUND', 'Scheduler job was not found', 404); if (action === 'resume') service.register(job); else service.unregister(job.id); return { success: true, data: job }; });
  app.post<{ Params: { id: string } }>('/jobs/:id/run', async (req, reply) => { if (!await getJob(database, req.params.id)) return error(reply, 'JOB_NOT_FOUND', 'Scheduler job was not found', 404); void service.run(req.params.id); return reply.code(202).send({ success: true, data: { queued: true } }); });
  app.get<{ Params: { id: string } }>('/jobs/:id/runs', async req => ({ success: true, data: await listRuns(database, req.params.id) }));
  app.get('/runs', async () => ({ success: true, data: await listRuns(database) }));
  app.get('/stats', async () => { const jobs = await listJobs(database); const runs = await listRuns(database); return { success: true, data: { totalJobs: jobs.length, enabledJobs: jobs.filter(j => j.enabled).length, pausedJobs: jobs.filter(j => j.status === 'paused').length, runningJobs: runs.filter((r: any) => r.status === 'running').length, failedRuns: runs.filter((r: any) => r.status === 'failed' || r.status === 'timeout').length, successRuns: runs.filter((r: any) => r.status === 'success').length, nextExecution: jobs.map(j => j.nextRunAt).filter(Boolean).sort()[0] || null } }; });
  app.get<{ Params: { id: string } }>('/runs/:id', async (req, reply) => { const run = await getRun(database, req.params.id); return run ? { success: true, data: run } : error(reply, 'RUN_NOT_FOUND', 'Scheduler run was not found', 404); });
  app.addHook('onReady', () => service.sync());
  app.addHook('onClose', async () => { await service.close(); database.close(); });
});
