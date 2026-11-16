import type { ExecutionContext, RunResult, RunStep } from '@rocksoul/ai-core';
import type { ILogger } from './logger.js';
import { DefaultLogger } from './logger.js';

export interface TelemetryEvent {
  type: 'agent_start' | 'agent_step' | 'agent_complete' | 'agent_error' | 'tool_call' | 'tool_result';
  runId: string;
  agentId: string;
  context: ExecutionContext;
  data: Record<string, unknown>;
  timestamp: string;
}

export class TelemetryCollector {
  private events: TelemetryEvent[] = [];
  private logger: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger || new DefaultLogger('[Telemetry]');
  }

  emit(event: Omit<TelemetryEvent, 'timestamp'>): void {
    const fullEvent: TelemetryEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    this.events.push(fullEvent);
    this.logger.debug(`Telemetry [${fullEvent.type}]: run=${fullEvent.runId} agent=${fullEvent.agentId}`);
  }

  getEventsForRun(runId: string): TelemetryEvent[] {
    return this.events.filter((e) => e.runId === runId);
  }

  recordAgentStart(runId: string, agentId: string, context: ExecutionContext, prompt: string): void {
    this.emit({
      type: 'agent_start',
      runId,
      agentId,
      context,
      data: { prompt },
    });
  }

  recordStep(runId: string, agentId: string, context: ExecutionContext, step: RunStep): void {
    this.emit({
      type: 'agent_step',
      runId,
      agentId,
      context,
      data: { step },
    });
  }

  recordAgentComplete(runId: string, agentId: string, context: ExecutionContext, result: RunResult): void {
    this.emit({
      type: 'agent_complete',
      runId,
      agentId,
      context,
      data: { status: result.status, outputLength: result.output?.length ?? 0 },
    });
  }

  recordAgentError(runId: string, agentId: string, context: ExecutionContext, error: Error | string): void {
    this.emit({
      type: 'agent_error',
      runId,
      agentId,
      context,
      data: { error: typeof error === 'string' ? error : error.message },
    });
    this.logger.error(`Agent error in run ${runId}:`, error);
  }
}
