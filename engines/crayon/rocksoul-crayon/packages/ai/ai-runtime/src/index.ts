import type { AgentRunOptions, IAgent, RunResult } from '@rocksoul/ai-core';

/** AI composition boundary. AEP remains authoritative for application execution. */
export class RocksoulAiRuntime {
  constructor(private readonly agents: ReadonlyMap<string, IAgent>) {}
  async execute(agentId: string, options: AgentRunOptions): Promise<RunResult> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`AI_AGENT_NOT_FOUND: ${agentId}`);
    return agent.generate(options);
  }
}
