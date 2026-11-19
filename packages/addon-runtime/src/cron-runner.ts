import { BaseRepository, modelRegistry, SYSTEM_ACTOR } from "@moonwitness/orm";
import { irCronLogModel, irCronModel } from "./ir-models.js";

export interface CronExecutionResult {
  cronKey: string;
  success: boolean;
  durationMs: number;
  message: string;
  error?: string;
}

/**
 * Odoo / `moon-cron` background scheduler runner for `ir.cron` jobs.
 * Invokes registered model `actions` and records telemetry in `ir.cron.log`.
 */
export class CronRunner {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private readonly pollIntervalMs: number;

  constructor(pollIntervalMs = 30_000) {
    this.pollIntervalMs = pollIntervalMs;
  }

  async executeCron(cronKeyOrId: string): Promise<CronExecutionResult> {
    const byKey = await irCronModel.repository.find({ cron_key: cronKeyOrId }, { limit: 1 });
    const cron = byKey[0] ?? (await irCronModel.repository.findOne(cronKeyOrId));
    if (!cron) {
      return {
        cronKey: cronKeyOrId,
        success: false,
        durationMs: 0,
        message: `Cron '${cronKeyOrId}' not found`,
        error: `Cron '${cronKeyOrId}' not found`,
      };
    }

    const startedAt = Date.now();
    let status: "success" | "failed" = "success";
    let message = "Execution completed";
    let errorMsg: string | null = null;

    try {
      const desc = modelRegistry.get(cron.model_name);
      const actionDef = desc?.actions?.[cron.action_name];
      if (desc && actionDef) {
        const repo = new BaseRepository(
          desc.name,
          desc.table,
          desc.fullSchema,
          desc.softDelete,
          desc.fields,
        );
        const rawPayload = cron.payload_json ? (JSON.parse(cron.payload_json) as unknown) : {};
        const parsedInput = actionDef.input ? actionDef.input.parse(rawPayload) : rawPayload;
        await actionDef.handler({
          model: desc.name,
          record: null,
          input: parsedInput,
          actor: SYSTEM_ACTOR,
          repository: repo,
        });
      } else {
        message = `No-op: ${cron.model_name}.${cron.action_name} evaluated`;
      }
    } catch (err) {
      status = "failed";
      errorMsg = err instanceof Error ? err.message : String(err);
      message = `Failed: ${errorMsg}`;
    }

    const durationMs = Math.max(0, Date.now() - startedAt);
    const now = new Date();
    const nowIso = now.toISOString();
    const nextRunIso = new Date(
      now.getTime() + Math.max(1, cron.interval_sec) * 1000,
    ).toISOString();

    await irCronLogModel.repository.create(
      {
        cron_key: cron.cron_key,
        run_status: status,
        executed_at: nowIso,
        duration_ms: durationMs,
        message,
        error: errorMsg,
      },
      SYSTEM_ACTOR,
    );

    await irCronModel.repository.update(
      cron.id,
      {
        last_run_at: nowIso,
        next_run_at: nextRunIso,
      },
      SYSTEM_ACTOR,
    );

    return {
      cronKey: cron.cron_key,
      success: status === "success",
      durationMs,
      message,
      ...(errorMsg ? { error: errorMsg } : {}),
    };
  }

  async processDueCrons(now = new Date()): Promise<CronExecutionResult[]> {
    if (this.running) return [];
    this.running = true;
    try {
      const nowIso = now.toISOString();
      const dueCrons = await irCronModel.repository.find(
        {
          active: true,
          $or: [{ next_run_at: null }, { next_run_at: { $lte: nowIso } }],
        },
        { orderBy: "cron_key ASC", limit: 20 },
      );

      const results: CronExecutionResult[] = [];
      for (const cron of dueCrons) {
        results.push(await this.executeCron(cron.cron_key));
      }
      return results;
    } finally {
      this.running = false;
    }
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.processDueCrons();
    }, this.pollIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const globalCronRunner = new CronRunner();
