import { generateText, streamText, jsonSchema, isStepCount } from 'ai';
import type { LanguageModel } from 'ai';
import type { ModelGenerateInput, ModelGenerateResult, ModelRuntime } from './types.js';

export class AiSdkModelRuntime implements ModelRuntime {
  constructor(private readonly provider: string, private readonly modelId: string, private readonly model: LanguageModel) {}
  async generate(input: ModelGenerateInput): Promise<ModelGenerateResult> {
    // Rocksoul's message contract is intentionally narrower than AI SDK's rich
    // tool-message union. Tool execution is adapted at the runtime boundary.
    const messages = input.messages.map(message => ({ role: message.role, content: message.content })) as any;
    const tools = Object.fromEntries((input.tools ?? []).map(candidate => [candidate.id, { description: candidate.description, inputSchema: jsonSchema(candidate.schema ?? { type: 'object' }), execute: (args: unknown) => candidate.execute(args, candidate.context) }]));
    const result = await generateText({ model: this.model, instructions: input.instructions, messages, tools: Object.keys(tools).length ? tools : undefined, temperature: input.temperature, maxOutputTokens: input.maxOutputTokens, abortSignal: input.abortSignal, maxRetries: 0, stopWhen: input.tools?.length ? isStepCount(input.maxSteps ?? 8) : undefined } as any);
    return { text: result.text, provider: this.provider, model: this.modelId, responseId: result.response?.id, finishReason: result.finishReason, usage: { inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens, totalTokens: result.usage.totalTokens }, warnings: result.warnings?.map(warning => JSON.stringify(warning)) };
  }
  async *stream(input: ModelGenerateInput): AsyncIterable<string> {
    const messages = input.messages.map(message => ({ role: message.role, content: message.content })) as any;
    const tools = Object.fromEntries((input.tools ?? []).map(candidate => [candidate.id, { description: candidate.description, inputSchema: jsonSchema(candidate.schema ?? { type: 'object' }), execute: (args: unknown) => candidate.execute(args, candidate.context) }]));
    const result = streamText({ model: this.model, instructions: input.instructions, messages, tools: Object.keys(tools).length ? tools : undefined, temperature: input.temperature, maxOutputTokens: input.maxOutputTokens, abortSignal: input.abortSignal, maxRetries: 0 } as any);
    for await (const delta of result.textStream) yield delta;
  }
}

/** Deterministic test-only runtime. It is never selected by environment configuration. */
export class TestModelRuntime implements ModelRuntime {
  constructor(private readonly response: string) {}
  async generate(): Promise<ModelGenerateResult> { return { text: this.response, provider: 'test', model: 'deterministic' }; }
  async *stream(): AsyncIterable<string> { yield this.response; }
}
