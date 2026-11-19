import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, createActorContext, getDb, initDb, modelRegistry } from "@moonwitness/orm";
import {
  claimNextJob,
  completeJob,
  dispatchOutboxBatch,
  enqueueJob,
  enqueueOutboxEvent,
  ensureJobQueueSchema,
  ensureOutboxSchema,
  failJob,
  opsJobModel,
  OutboxDispatcher,
  processNextJob,
  recoverExpiredOutboxLeases,
} from "./job-queue.js";

describe("durable ORM job queue (ops.job)", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    const dir = mkdtempSync(join(tmpdir(), "mw-job-queue-"));
    dirs.push(dir);
    await initDb(join(dir, "jobs.db"));
    await ensureJobQueueSchema();
  });

  afterEach(() => {
    closeDb();
  });

  afterAll(() => {
    for (const dir of dirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // Ignore transient Windows SQLite lock on temp directory cleanup.
      }
    }
  });

  it("enqueues, atomically claims, completes, and isolates tenants", async () => {
    const tenantA = createActorContext("worker-a", "api", "req-1", "tenant-a");
    const tenantB = createActorContext("worker-b", "api", "req-2", "tenant-b");

    const now = new Date("2026-11-18T12:00:00.000Z");
    const jobA = await enqueueJob(
      { queue: "sync", jobType: "probe.run", payload: { target: "node-1" }, runAfter: now },
      tenantA,
    );
    expect(jobA.tenant_id).toBe("tenant-a");
    expect(jobA.job_state).toBe("pending");

    // Tenant B cannot see or claim Tenant A's job
    const wrongTenantClaim = await claimNextJob(
      { queue: "sync", workerId: "w-b", tenantId: "tenant-b", now },
      tenantB,
    );
    expect(wrongTenantClaim).toBeNull();

    // Concurrent claims in Tenant A: exactly one worker wins via optimistic locking
    const [claim1, claim2] = await Promise.all([
      claimNextJob({ queue: "sync", workerId: "w-a1", tenantId: "tenant-a", now }, tenantA),
      claimNextJob({ queue: "sync", workerId: "w-a2", tenantId: "tenant-a", now }, tenantA),
    ]);
    const winners = [claim1, claim2].filter((c) => c !== null);
    expect(winners).toHaveLength(1);
    const claimed = winners[0]!;
    expect(claimed.job_state).toBe("running");
    expect(claimed.attempts).toBe(1);

    // Wrong worker cannot complete another worker's lease
    const wrongComplete = await completeJob(claimed.id, "other-worker", { ok: true }, tenantA);
    expect(wrongComplete).toBeNull();

    const completed = await completeJob(claimed.id, claimed.locked_by!, { ok: true }, tenantA);
    expect(completed?.job_state).toBe("completed");
    expect(completed?.result_json).toBe('{"ok":true}');
  });

  it("retries with backoff on failure, dead-letters after max_attempts, and recovers expired locks", async () => {
    const t0 = new Date("2026-11-18T12:00:00.000Z");
    const job = await enqueueJob({
      queue: "mail",
      jobType: "send.notice",
      payload: { to: "ops@example.com" },
      maxAttempts: 2,
      runAfter: t0,
    });

    const firstTick = await processNextJob(
      {
        "send.notice": () => {
          throw new Error("SMTP timeout");
        },
      },
      { queue: "mail", workerId: "w1", now: t0 },
    );
    expect(firstTick.processed).toBe(true);
    if (firstTick.processed) {
      expect(firstTick.job.job_state).toBe("pending");
      expect(firstTick.job.attempts).toBe(1);
      expect(firstTick.job.last_error).toContain("SMTP timeout");
    }

    // Immediate claim right at t0+500ms respects run_after backoff
    const tooEarly = await claimNextJob({
      queue: "mail",
      workerId: "w1",
      now: new Date(t0.getTime() + 500),
    });
    expect(tooEarly).toBeNull();

    // After backoff expires, worker claims attempt #2 and fails permanently into dead-letter
    const tRetry = new Date(t0.getTime() + 60_000);
    const secondClaim = await claimNextJob({ queue: "mail", workerId: "w1", now: tRetry });
    expect(secondClaim?.attempts).toBe(2);

    const dead = await failJob(job.id, "w1", new Error("Hard bounce"), { now: tRetry });
    expect(dead?.job_state).toBe("dead");

    // Stale running lock recovery test
    const stuck = await enqueueJob({
      queue: "recovery",
      jobType: "sync.index",
      maxAttempts: 3,
      runAfter: t0,
    });
    await opsJobModel.repository.update(stuck.id, {
      version: stuck.version,
      job_state: "running",
      locked_by: "crashed-worker",
      locked_at: new Date("2026-11-18T11:50:00.000Z").toISOString(),
      attempts: 1,
    });
    const recovered = await claimNextJob({
      queue: "recovery",
      workerId: "healthy-worker",
      lockTtlMs: 30_000,
      now: t0,
    });
    expect(recovered?.id).toBe(stuck.id);
    expect(recovered?.locked_by).toBe("healthy-worker");
    expect(recovered?.attempts).toBe(2);
    expect(modelRegistry.get("ops.job")).toBeDefined();
  });

  it("dispatches transactional outbox events with per-subscriber isolation, backoff, dead-lettering, and lease recovery (#502)", async () => {
    await ensureOutboxSchema();
    const t0 = new Date("2026-11-18T12:00:00.000Z");

    const dispatcher = new OutboxDispatcher({
      workerId: "outbox-w1",
      maxAttempts: 3,
      baseBackoffMs: 1_000,
      leaseTtlMs: 30_000,
    });

    const auditCalls: string[] = [];
    const webhookCalls: string[] = [];
    let failWebhook = true;

    dispatcher.subscribe({
      name: "audit",
      pattern: "*",
      handler: ({ event }) => {
        auditCalls.push(`${event.id}:${event.action}`);
      },
    });
    dispatcher.subscribe({
      name: "webhook",
      pattern: "crm.*",
      handler: ({ event }) => {
        webhookCalls.push(`${event.id}:${event.action}`);
        if (failWebhook) {
          throw new Error("downstream 503");
        }
      },
    });

    const ev = await enqueueOutboxEvent({
      model: "crm.lead",
      entityId: "lead-1",
      action: "CREATE",
      tenantId: "tenant-a",
      actorId: "u-1",
      requestId: "req-100",
      payload: { name: "Acme" },
      nextAttemptAt: t0,
    });

    // Tick 1: audit succeeds, webhook fails -> audit stays delivered, webhook enters backoff
    const b1 = await dispatcher.dispatchBatch({ now: t0 });
    expect(b1.delivered).toBe(1);
    expect(b1.retried).toBe(1);
    expect(auditCalls).toHaveLength(1);
    expect(webhookCalls).toHaveLength(1);

    const midEvent = await dispatcher.getEvent(ev.id);
    expect(midEvent?.status).toBe("pending");
    expect(midEvent?.last_error).toContain("downstream 503");

    // Before backoff expires (t0 + 500ms): neither subscriber runs
    const bEarly = await dispatcher.dispatchBatch({ now: new Date(t0.getTime() + 500) });
    expect(bEarly.processed).toBe(0);

    // Tick 2 at t0 + 1500ms: webhook succeeds; audit MUST NOT be re-invoked!
    failWebhook = false;
    const b2 = await dispatcher.dispatchBatch({ now: new Date(t0.getTime() + 1_500) });
    expect(b2.delivered).toBe(1);
    expect(auditCalls).toHaveLength(1);
    expect(webhookCalls).toHaveLength(2);

    const doneEvent = await dispatcher.getEvent(ev.id);
    expect(doneEvent?.status).toBe("delivered");
    expect(doneEvent?.last_error).toBeNull();

    // Dead-lettering after maxAttempts=2
    const failEvent = await enqueueOutboxEvent({
      model: "crm.lead",
      entityId: "lead-2",
      action: "UPDATE",
      payload: { stage: "won" },
      nextAttemptAt: t0,
    });
    const deadDispatcher = new OutboxDispatcher({
      workerId: "dead-w",
      maxAttempts: 2,
      baseBackoffMs: 1_000,
    });
    deadDispatcher.subscribe({
      name: "always-fail",
      pattern: "crm.*",
      handler: () => {
        throw new Error("permanent error");
      },
    });
    const d1 = await deadDispatcher.dispatchBatch({ now: t0 });
    expect(d1.retried).toBe(1);
    const d2 = await deadDispatcher.dispatchBatch({ now: new Date(t0.getTime() + 2_000) });
    expect(d2.deadLettered).toBe(1);
    expect((await deadDispatcher.getEvent(failEvent.id))?.status).toBe("dead_letter");

    // Crash/restart lease recovery test + concurrent claim isolation
    const crashEvent = await enqueueOutboxEvent({
      model: "ops.ticket",
      entityId: "tk-1",
      action: "CREATE",
      payload: { title: "Alert" },
      nextAttemptAt: t0,
    });
    const staleCreated = new Date(t0.getTime() - 120_000).toISOString();
    const staleExpires = new Date(t0.getTime() - 60_000).toISOString();
    await getDb().run(
      `INSERT INTO _orm_outbox_deliveries (
        event_id, subscriber, status, attempts, next_attempt_at,
        lease_owner, lease_expires_at, last_error, delivered_at, created_at, updated_at
      ) VALUES (?, ?, 'processing', 1, ?, 'crashed-worker', ?, NULL, NULL, ?, ?)`,
      [crashEvent.id, "ops-sub", staleCreated, staleExpires, staleCreated, staleCreated],
    );

    const recovered = await recoverExpiredOutboxLeases({ now: t0, leaseTtlMs: 30_000 });
    expect(recovered.recoveredDeliveries).toBe(1);

    const deliveredBy: string[] = [];
    const sub = {
      name: "ops-sub",
      pattern: "ops.*",
      handler: async ({ event }: { event: { id: string } }) => {
        deliveredBy.push(event.id);
      },
    };
    const [w1, w2] = await Promise.all([
      dispatchOutboxBatch([sub], { workerId: "w-1", now: t0 }),
      dispatchOutboxBatch([sub], { workerId: "w-2", now: t0 }),
    ]);
    expect(w1.delivered + w2.delivered).toBe(1);
    expect(deliveredBy).toEqual([crashEvent.id]);
  });
});
