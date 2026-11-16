import type {
  IAgent,
  ExecutionContext,
  RunResult,
  AgentRunOptions,
} from '@rocksoul/ai-core';
import { randomUUID } from 'node:crypto';

export class Orchestrator {
  private agents: Map<string, IAgent> = new Map();
  private runs: Map<string, RunResult> = new Map();

  registerAgent(agent: IAgent): void {
    this.agents.set(agent.definition.id, agent);
  }

  getAgent(id: string): IAgent | undefined {
    return this.agents.get(id);
  }

  listAgents(): IAgent[] {
    return Array.from(this.agents.values());
  }

  classifyIntent(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('code') || lower.includes('function') || lower.includes('patch') || lower.includes('refactor') || lower.includes('typescript')) {
      return 'coder';
    }
    if (lower.includes('research') || lower.includes('doc') || lower.includes('explain architecture') || lower.includes('paper')) {
      return 'researcher';
    }
    if (lower.includes('browse') || lower.includes('website') || lower.includes('scrape') || lower.includes('url')) {
      return 'browser';
    }
    return 'assistant';
  }

  async routeAndExecute(options: AgentRunOptions & { targetAgentId?: string }): Promise<RunResult> {
    const targetId = options.targetAgentId || this.classifyIntent(options.prompt);
    const agent = this.agents.get(targetId) || this.agents.get('assistant');

    if (!agent) {
      throw new Error(`No suitable agent available to process request for target: "${targetId}".`);
    }

    const run = await agent.generate(options);
    this.runs.set(run.runId, run);
    return run;
  }

  startAndExecute(options: AgentRunOptions & { targetAgentId?: string }): RunResult {
    const targetId = options.targetAgentId || this.classifyIntent(options.prompt);
    const agent = this.agents.get(targetId) || this.agents.get('assistant');
    if (!agent) throw new Error(`No suitable agent available to process request for target: "${targetId}".`);
    const runId = randomUUID();
    const pending: RunResult = { agentRunId: runId, runId, agentId: agent.definition.id, status: 'pending', messages: [], createdAt: new Date().toISOString() };
    this.runs.set(runId, pending);
    void agent.generate(options).then((completed) => {
      const current = this.runs.get(runId);
      if (!current || current.status === 'cancelled') return;
      this.runs.set(runId, { ...completed, runId });
    }).catch(() => {
      const current = this.runs.get(runId);
      if (!current || current.status === 'cancelled') return;
      this.runs.set(runId, { ...current, status: 'failed', error: 'AI execution failed', completedAt: new Date().toISOString() });
    });
    return pending;
  }

  getRun(runId: string): RunResult | undefined {
    return this.runs.get(runId);
  }

  cancelRun(runId: string): boolean {
    const run = this.runs.get(runId);
    if (!run) return false;

    if (run.status === 'running' || run.status === 'pending') {
      run.status = 'cancelled';
      run.completedAt = new Date().toISOString();
      return true;
    }
    return false;
  }
}
