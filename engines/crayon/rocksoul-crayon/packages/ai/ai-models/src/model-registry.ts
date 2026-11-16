import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { AiSdkModelRuntime } from './model-runtime.js';
import { ModelConfigurationError, ModelResolutionError } from './errors.js';
import type { ModelRuntime } from './types.js';

export class ModelRegistry {
  private readonly runtimes = new Map<string, ModelRuntime>();
  register(model: string, runtime: ModelRuntime): void { this.runtimes.set(model, runtime); }
  resolve(model?: string): ModelRuntime {
    const requested = model || process.env.AI_DEFAULT_MODEL;
    if (!requested) throw new ModelConfigurationError();
    const runtime = this.runtimes.get(requested);
    if (!runtime) throw new ModelResolutionError(requested);
    return runtime;
  }
  static fromEnvironment(): ModelRegistry {
    const registry = new ModelRegistry();
    const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (googleKey) {
      const google = createGoogleGenerativeAI({ apiKey: googleKey });
      for (const model of [process.env.AI_DEFAULT_MODEL, process.env.AI_FAST_MODEL, process.env.AI_REASONING_MODEL, process.env.AI_CODING_MODEL].filter((value): value is string => value?.startsWith('google:') ?? false)) registry.register(model, new AiSdkModelRuntime('google', model.slice(7), google(model.slice(7))));
    }
    const baseURL = process.env.AI_LOCAL_BASE_URL;
    if (baseURL) {
      const local = createOpenAICompatible({ name: 'rocksoul-local', baseURL, apiKey: process.env.AI_LOCAL_API_KEY });
      for (const model of [process.env.AI_DEFAULT_MODEL, process.env.AI_LOCAL_MODEL].filter((value): value is string => value?.startsWith('local:') ?? false)) registry.register(model, new AiSdkModelRuntime('local', model.slice(6), local.chatModel(model.slice(6))));
    }
    return registry;
  }
}
