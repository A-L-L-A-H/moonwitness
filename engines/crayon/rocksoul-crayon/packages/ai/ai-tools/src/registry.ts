import type { IToolRegistry, ToolDefinition, ExecutionContext, ToolPolicy } from '@rocksoul/ai-core';

export class ToolRegistry implements IToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private defaultPolicies: Map<string, ToolPolicy> = new Map();
  private readonly completedEffects = new Map<string, unknown>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool);
    if (tool.policy) {
      this.defaultPolicies.set(tool.id, tool.policy);
    }
  }

  get(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  has(id: string): boolean {
    return this.tools.has(id);
  }

  setPolicy(toolId: string, policy: ToolPolicy): void {
    this.defaultPolicies.set(toolId, policy);
  }

  async execute(id: string, input: any, context: ExecutionContext): Promise<any> {
    const tool = this.tools.get(id);
    if (!tool) {
      throw new Error(`Tool "${id}" is not registered in ToolRegistry.`);
    }

    const effectivePolicy = this.defaultPolicies.get(id) || tool.policy || 'ALLOW';

    if (effectivePolicy === 'DENY') {
      throw new Error(`Security Policy Violation: Execution of tool "${id}" is DENIED by policy.`);
    }

    if (effectivePolicy === 'ASK_USER') {
      const approvedList = Array.isArray(context.metadata?.userApprovedTools)
        ? (context.metadata?.userApprovedTools as string[])
        : [];
      const isApproved = approvedList.includes(id);
      if (!isApproved) {
        throw new Error(`Approval Required: Tool "${id}" requires explicit user confirmation before running.`);
      }
    }

    this.validateInput(tool, input);
    const effectId = context.executionId && context.idempotencyKey
      ? `${context.executionId}:${context.idempotencyKey}:${id}` : undefined;
    if (effectId && this.completedEffects.has(effectId)) return this.completedEffects.get(effectId);
    const timeoutMs = Math.min(Math.max(Number(context.metadata?.toolTimeoutMs ?? 30_000), 100), 300_000);
    const controller = new AbortController();
    context.abortSignal?.addEventListener('abort', () => controller.abort(), { once: true });
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const result = await Promise.race([
        tool.execute(input, { ...context, abortSignal: controller.signal }),
        new Promise<never>((_, reject) => controller.signal.addEventListener('abort', () => reject(new Error(`Tool "${id}" timed out or was cancelled`)), { once: true })),
      ]);
      const safe = this.sanitize(result);
      if (effectId) this.completedEffects.set(effectId, safe);
      return safe;
    } finally { clearTimeout(timeout); }
  }

  private validateInput(tool: ToolDefinition, input: unknown): void {
    const schema = tool.schema;
    if (!schema) return;
    if (schema.type === 'object' && (!input || typeof input !== 'object' || Array.isArray(input))) throw new Error(`Invalid arguments for tool "${tool.id}"`);
    const record = input as Record<string, unknown>;
    for (const key of (Array.isArray(schema.required) ? schema.required : [])) if (!(key in record)) throw new Error(`Invalid arguments for tool "${tool.id}": ${String(key)} is required`);
    const properties = schema.properties as Record<string, { type?: string; enum?: unknown[] }> | undefined;
    for (const [key, value] of Object.entries(record)) {
      const property = properties?.[key]; if (!property) continue;
      if (property.type && typeof value !== property.type) throw new Error(`Invalid arguments for tool "${tool.id}": ${key}`);
      if (property.enum && !property.enum.includes(value)) throw new Error(`Invalid arguments for tool "${tool.id}": ${key}`);
    }
  }
  private sanitize(value: unknown): unknown {
    if (typeof value === 'string') return value.slice(0, 100_000);
    if (!value || typeof value !== 'object') return value;
    return JSON.parse(JSON.stringify(value, (key, current) => /api.?key|secret|token|password/i.test(key) ? '[REDACTED]' : current));
  }
}
