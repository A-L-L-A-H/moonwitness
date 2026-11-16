import type { ModelMessage } from '@rocksoul/ai-core';
import type { ToolDefinition, ExecutionContext } from '@rocksoul/ai-core';

export type ModelProviderId = 'google' | 'local' | string;
export interface ModelGenerateInput {
  model?: string;
  instructions?: string;
  messages: ModelMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  maxSteps?: number;
  abortSignal?: AbortSignal;
  metadata?: Record<string, unknown>;
  tools?: Array<ToolDefinition & { context: ExecutionContext }>;
}
export interface ModelUsage { inputTokens?: number; outputTokens?: number; totalTokens?: number; }
export interface ModelGenerateResult {
  text: string;
  usage?: ModelUsage;
  finishReason?: string;
  provider: string;
  model: string;
  responseId?: string;
  warnings?: string[];
}
export interface ModelRuntime {
  generate(input: ModelGenerateInput): Promise<ModelGenerateResult>;
  stream(input: ModelGenerateInput): AsyncIterable<string>;
}
