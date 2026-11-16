export type RetryClass = 'transport' | 'timeout' | 'execution' | 'authorization' | 'validation' | 'conflict';
export type RetryPolicy = {
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly classify?: (error: unknown) => RetryClass;
  readonly sleep?: (delayMs: number) => Promise<void>;
};

const defaultClassify = (error: unknown): RetryClass => {
  const code = String((error as { code?: unknown })?.code ?? '').toLowerCase();
  if (code.includes('auth') || code.includes('forbidden')) return 'authorization';
  if (code.includes('validation') || code.includes('invalid')) return 'validation';
  if (code.includes('conflict')) return 'conflict';
  if (code.includes('timeout')) return 'timeout';
  return 'transport';
};

/** Retries only explicitly retryable failure classes; mutation safety remains the caller's idempotency responsibility. */
export async function withRetry<T>(operation: (attempt: number) => Promise<T>, policy: RetryPolicy = {}): Promise<T> {
  const maxAttempts = Math.max(1, Math.floor(policy.maxAttempts ?? 3));
  const baseDelayMs = Math.max(0, policy.baseDelayMs ?? 50);
  const maxDelayMs = Math.max(baseDelayMs, policy.maxDelayMs ?? 2_000);
  const classify = policy.classify ?? defaultClassify;
  const sleep = policy.sleep ?? ((delayMs: number) => new Promise(resolve => setTimeout(resolve, delayMs)));
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try { return await operation(attempt); }
    catch (error) {
      const kind = classify(error);
      const retryable = kind === 'transport' || kind === 'timeout' || kind === 'execution';
      if (!retryable || attempt === maxAttempts) throw error;
      await sleep(Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1)));
    }
  }
  throw new Error('retry exhausted');
}
