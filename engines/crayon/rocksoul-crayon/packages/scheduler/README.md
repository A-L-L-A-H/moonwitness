# @rocksoul/scheduler

Rocksoul's standalone master scheduler. Fastify exposes the REST API, `SchedulerService` owns the scheduling contract, Plainjob provides the durable SQLite queue/worker, and the dispatcher selects an executor. The scheduler database is independent from API, WhatsApp, and AI context storage.

## Local development

```bash
pnpm --filter @rocksoul/scheduler dev
pnpm --filter @rocksoul/scheduler build
pnpm --filter @rocksoul/scheduler test
```

Copy `.env.example` to `.env`. Defaults are `0.0.0.0:3002`, `file:./data/scheduler.db`, five workers, and timezone `Asia/Jakarta`. Run migrations with `pnpm --filter @rocksoul/scheduler db:migrate`; generate Drizzle migrations with `db:generate`.

## Docker

The package has a standalone compose file and is included in the root Compose files. `scheduler_data` persists `/app/data/scheduler.db`. The image uses the root pnpm workspace and builds the native SQLite dependency in the builder stage.

## API

```bash
curl -X POST http://localhost:3002/jobs -H 'content-type: application/json' -d '{"name":"Self test","executor":"internal","target":"self-test","scheduleType":"manual","payload":{}}'
curl -X POST http://localhost:3002/jobs/<id>/run
curl http://localhost:3002/jobs/<id>/runs
```

Supported endpoints are `GET/POST/PATCH/DELETE /jobs`, `POST /jobs/:id/run`, `POST /jobs/:id/pause`, `POST /jobs/:id/resume`, `GET /jobs/:id/runs`, `GET /runs`, `GET /runs/:id`, `GET /stats`, and `GET /health`. Set `SCHEDULER_API_KEY` to require `Authorization: Bearer <key>` on writes.

Use `scheduleType: "cron"` with a validated cron expression and IANA timezone, `scheduleType: "once"` with ISO `runAt`, or `scheduleType: "manual"`. `maxRetries`, `timeoutMs`, and `allowOverlap` control execution.

Executors are `internal`, `http`, `whatsapp`, and `rocksoul_api`. AI work is invoked through an AEP/API capability rather than a scheduler-specific AI executor. HTTP jobs specify `payload.url`, `method`, `headers`, and `body`; configure `SCHEDULER_HTTP_ALLOWED_HOSTS` for private/local test hosts.

Legacy AI executor rows are never deleted automatically. Startup records a migration outcome and pauses each unmapped legacy job, requiring an explicit operator mapping to an AEP/API capability before it can run.

Pause disables future automatic execution without deleting history; resume re-registers the persisted schedule. Delete is a soft delete so existing run history remains auditable.

To add an executor, implement the `Executor` contract in `src/dispatcher.ts`, register it by name, add the name to `src/types.ts`, and add boundary tests. No route or database redesign is required.
