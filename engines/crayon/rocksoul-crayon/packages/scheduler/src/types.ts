export const executors = ['internal','http','whatsapp','rocksoul_api'] as const;
export type ExecutorType = typeof executors[number];
export const scheduleTypes = ['cron','once','manual'] as const;
export type ScheduleType = typeof scheduleTypes[number];
export type Job = { id:string; name:string; description:string|null; executor:ExecutorType; target:string; scheduleType:ScheduleType; cronExpression:string|null; runAt:string|null; timezone:string; payload:unknown; enabled:boolean; status:'active'|'paused'|'deleted'; maxRetries:number; timeoutMs:number; allowOverlap:boolean; lastRunAt:string|null; nextRunAt:string|null; createdAt:string; updatedAt:string };
export type Run = { id:string; jobId:string; status:'queued'|'running'|'success'|'failed'|'timeout'|'cancelled'; attempt:number; startedAt:string|null; finishedAt:string|null; durationMs:number|null; input:unknown; output:unknown; error:string|null; createdAt:string };
