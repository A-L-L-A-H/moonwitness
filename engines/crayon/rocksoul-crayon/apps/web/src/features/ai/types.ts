export type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'markdown'; content: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'tool_call'; tool: string; input: unknown; status: 'running' | 'success' | 'failed'; output?: unknown }
  | { type: 'artifact'; artifactId: string; title: string; kind: 'code' | 'diff' | 'report' | 'file'; content: string }
  | { type: 'approval'; tool: string; reason: string; status: 'pending' | 'approved' | 'rejected' }
  | { type: 'status'; text: string };

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  parts?: MessagePart[];
  createdAt: string;
  agentId?: string;
}

export interface AiAgent {
  id: string;
  name: string;
  description: string;
  status: 'FOUNDATION' | 'IMPLEMENTED' | 'INTEGRATED' | 'VERIFIED' | 'PRODUCTION-READY';
  capabilities: string[];
}

export interface AiRun {
  runId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  output?: string;
  error?: string;
  messages: AiMessage[];
  steps?: Array<{
    id?: string;
    type?: string;
    status?: string;
    input?: unknown;
    output?: unknown;
    createdAt?: string;
    toolCalls?: Array<{ tool: string; input: unknown; output?: unknown; status?: 'running' | 'success' | 'failed' }>;
  }>;
  createdAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}
