import { randomUUID } from 'node:crypto';
import type { AgentDefinition, AgentRunOptions, IAgent, ModelMessage, RunResult } from '@rocksoul/ai-core';
import type { IMemoryProvider } from '@rocksoul/ai-core';
import type { ModelRegistry } from '@rocksoul/ai-models';
import type { ToolRegistry } from '@rocksoul/ai-tools';

export abstract class ModelAgent implements IAgent {
  abstract readonly definition: AgentDefinition;
  constructor(protected readonly models: ModelRegistry, private readonly memory?: IMemoryProvider, private readonly tools?: ToolRegistry) {}
  async generate(options: AgentRunOptions): Promise<RunResult> {
    const agentRunId = randomUUID();
    const createdAt = new Date().toISOString();
    const threadId = options.threadId ?? (this.memory ? await this.memory.createThread({ ownerUserId: options.context.userId ?? null }) : agentRunId);
    const history = this.memory ? await this.memory.getMessages(threadId) : [];
    const userMessage: ModelMessage = { id: randomUUID(), role: 'user', content: options.prompt, createdAt };
    const allowedTools = this.tools ? this.tools.list().map(tool => ({ ...tool, context: options.context })) : [];
    const result = await this.models.resolve(options.model ?? this.definition.model).generate({ model: options.model ?? this.definition.model, instructions: this.definition.instructions, messages: [...history, userMessage], temperature: options.temperature, maxOutputTokens: Number(process.env.AI_DEFAULT_MAX_OUTPUT_TOKENS || 2048), maxSteps: Math.min(options.maxSteps ?? Number(process.env.AI_MAX_STEPS || 8), 16), abortSignal: options.context.abortSignal, metadata: { executionId: options.context.executionId, requestId: options.context.requestId }, tools: allowedTools });
    const assistantMessage: ModelMessage = { id: randomUUID(), role: 'assistant', content: result.text, createdAt: new Date().toISOString() };
    if (this.memory) await this.memory.saveMessages(threadId, [userMessage, assistantMessage]);
    return { agentRunId, runId: agentRunId, agentId: this.definition.id, status: 'completed', output: result.text, messages: [...history, userMessage, assistantMessage], createdAt, completedAt: new Date().toISOString(), metadata: { threadId, executionId: options.context.executionId, requestId: options.context.requestId, provider: result.provider, model: result.model, usage: result.usage } };
  }
  async *stream(options: AgentRunOptions): AsyncIterable<string> {
    const threadId = options.threadId ?? (this.memory ? await this.memory.createThread({ ownerUserId: options.context.userId ?? null }) : undefined);
    const history = threadId && this.memory ? await this.memory.getMessages(threadId) : [];
    const userMessage: ModelMessage = { id: randomUUID(), role: 'user', content: options.prompt, createdAt: new Date().toISOString() };
    const chunks: string[] = [];
    const allowedTools = this.tools ? this.tools.list().map(tool => ({ ...tool, context: options.context })) : [];
    for await (const chunk of this.models.resolve(options.model ?? this.definition.model).stream({ model: options.model ?? this.definition.model, instructions: this.definition.instructions, messages: [...history, userMessage], temperature: options.temperature, maxOutputTokens: Number(process.env.AI_DEFAULT_MAX_OUTPUT_TOKENS || 2048), abortSignal: options.context.abortSignal, tools: allowedTools })) {
      chunks.push(chunk);
      yield chunk;
    }
    if (threadId && this.memory) await this.memory.saveMessages(threadId, [userMessage, { id: randomUUID(), role: 'assistant', content: chunks.join(''), createdAt: new Date().toISOString() }]);
  }
}
