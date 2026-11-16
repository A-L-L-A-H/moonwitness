import type { ModelMessage } from './message.js';

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface RunStep {
  stepId: string;
  agentId: string;
  content?: string;
  toolCalls?: {
    tool: string;
    input: unknown;
    output?: unknown;
    status: 'success' | 'failed';
  }[];
  timestamp: string;
}

export interface RunResult {
  /** Internal agent-attempt correlation; never replaces AEP executionId. */
  agentRunId: string;
  /** @deprecated Use agentRunId. Kept for API compatibility. */
  runId: string;
  agentId: string;
  status: RunStatus;
  output?: string;
  messages: ModelMessage[];
  steps?: RunStep[];
  error?: string;
  createdAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}
