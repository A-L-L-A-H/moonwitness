import { randomUUID } from 'node:crypto';
import { CronExpressionParser } from 'cron-parser';
import type { Job } from '../types.js';
import * as db from '../db.js';
import { dispatcher } from '../dispatcher.js';
import { PlainjobEngine } from '../plainjob-engine.js';

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, controller: AbortController): Promise<T> { let timer: NodeJS.Timeout | undefined; try { return await Promise.race([promise, new Promise<T>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Execution timed out')); }, timeoutMs); })]); } finally { if (timer) clearTimeout(timer); } }

export class SchedulerService {
  private timers = new Map<string, NodeJS.Timeout>();
  private pending = new Set<string>();
  private activeJobs = new Set<string>();
  private running = 0;
  private executors = dispatcher();
  private engine = new PlainjobEngine();
  private owner = randomUUID();
  constructor(private database: db.Db, private concurrency = 5, private defaultTimezone = 'Asia/Jakarta', private databaseFilename = (process.env.SCHEDULER_DATABASE_URL || 'file:./data/scheduler.db').replace(/^file:/, ''), private logger?: { info: (obj: unknown, msg?: string) => void; error?: (obj: unknown, msg?: string) => void }) {}
  async sync() {
    try { await this.engine.start(this.databaseFilename, id => this.execute(id)); } catch (error) { this.logger?.error?.({ error }, 'scheduler queue engine failed to start; using direct execution'); }
    for (const run of await db.listRuns(this.database)) if (run.status === 'running') await db.updateRun(this.database, run.id, { status: 'failed', finishedAt: new Date().toISOString(), error: 'Recovered after scheduler restart' });
    for (const job of await db.listJobs(this.database)) if (job.enabled && job.status === 'active') this.register(job);
  }
  register(job: Job) {
    this.unregister(job.id);
    if (!job.enabled || job.status !== 'active' || job.scheduleType === 'manual') return;
    let nextRunAt: string | null = null;
    if (job.scheduleType === 'once' && job.runAt) {
      nextRunAt = job.runAt;
      this.timers.set(job.id, setTimeout(() => void this.run(job.id), Math.max(0, new Date(job.runAt!).getTime() - Date.now())));
    } else if (job.scheduleType === 'cron' && job.cronExpression) {
      const tick = () => { try { const next = CronExpressionParser.parse(job.cronExpression!, { currentDate: new Date(), tz: job.timezone || this.defaultTimezone }).next().getTime(); nextRunAt = new Date(next).toISOString(); void db.updateJob(this.database, job.id, { nextRunAt }); this.timers.set(job.id, setTimeout(() => { void this.run(job.id); tick(); }, Math.max(100, next - Date.now()))); } catch (error) { this.logger?.error?.({ error, jobId: job.id }, 'scheduler cron registration failed'); } };
      tick();
    }
    if (nextRunAt) void db.updateJob(this.database, job.id, { nextRunAt });
  }
  unregister(id: string) { const timer = this.timers.get(id); if (timer) clearTimeout(timer); this.timers.delete(id); }
  async run(id: string) { if (!this.engine.enqueue(id)) await this.execute(id); }
  private async execute(id: string) {
    const job = await db.getJob(this.database, id); if (!job || !job.enabled || job.status !== 'active') return;
    if (this.running >= this.concurrency || (!job.allowOverlap && this.activeJobs.has(id))) { this.pending.add(id); return; }
    if (!(await db.claimJob(this.database, id, this.owner))) return;
    this.pending.delete(id); this.running++; this.activeJobs.add(id);
    try {
      for (let attempt = 1; attempt <= job.maxRetries + 1; attempt++) {
        const run: any = { id: randomUUID(), jobId: id, status: 'running', attempt, startedAt: new Date().toISOString(), finishedAt: null, durationMs: null, input: job.payload, output: null, error: null };
        await db.addRun(this.database, run); const controller = new AbortController(); const started = Date.now();
        try { run.output = await withTimeout(this.executors.get(job.executor)!(job, controller.signal), job.timeoutMs, controller); run.status = 'success'; }
        catch (error) { run.status = controller.signal.aborted ? 'timeout' : 'failed'; run.error = error instanceof Error ? error.message : String(error); }
        finally { run.finishedAt = new Date().toISOString(); run.durationMs = Date.now() - started; await db.updateRun(this.database, run.id, run); this.logger?.info({ jobId: id, runId: run.id, executor: job.executor, status: run.status, durationMs: run.durationMs, attempt }, 'scheduler job execution completed'); }
        if (run.status === 'success') break; if (attempt <= job.maxRetries) await sleep(Math.min(30000, 250 * 2 ** (attempt - 1)));
      }
    } finally { await db.updateJob(this.database, id, { lastRunAt: new Date().toISOString() }); await db.releaseJob(this.database, id, this.owner); this.running--; this.activeJobs.delete(id); if (job.scheduleType === 'once') this.unregister(id); const next = this.pending.values().next().value; if (next) void this.run(next); }
  }
  async close() { for (const id of this.timers.keys()) this.unregister(id); await this.engine.close(); }
}
