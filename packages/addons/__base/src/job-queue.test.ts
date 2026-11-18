import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, createActorContext, initDb, modelRegistry } from "@moonwitness/orm";
import {
  claimNextJob,
  completeJob,
  enqueueJob,
  ensureJobQueueSchema,
  failJob,
  opsJobModel,
  processNextJob,
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
});
