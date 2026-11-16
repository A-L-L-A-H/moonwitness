export type CapabilityId = `${string}.${string}`;

export interface Principal {
  readonly id: string;
  readonly type?: string;
}

export interface CapabilityAuthContext {
  readonly principal: Principal;
  readonly tenantId?: string;
  readonly scopes: ReadonlySet<string>;
  readonly roles: ReadonlySet<string>;
}

export interface CapabilityContext {
  readonly auth: CapabilityAuthContext;
  readonly environment?: string;
  readonly correlationId?: string;
  readonly executionId?: string;
}

export type CapabilityValidation<T> = (input: unknown) => input is T;

export interface CapabilityDescriptor<TInput = unknown, TOutput = unknown> {
  readonly id: CapabilityId;
  readonly version: string;
  readonly description?: string;
  readonly inputValidator?: CapabilityValidation<TInput>;
  readonly sideEffects: 'none' | 'read' | 'write';
  readonly requiredScopes: readonly string[];
  readonly executionMode: 'sync' | 'async' | 'streaming';
  readonly supportsCancellation: boolean;
  readonly supportsIdempotency: boolean;
  readonly isSupported: (context: CapabilityContext) => boolean;
  readonly isAvailable: (context: CapabilityContext) => boolean;
  readonly isAuthorized: (context: CapabilityContext) => boolean;
  readonly output?: (value: unknown) => value is TOutput;
}

export type CapabilityResolution<TInput = unknown, TOutput = unknown> =
  | { readonly status: 'EXECUTABLE'; readonly descriptor: CapabilityDescriptor<TInput, TOutput> }
  | { readonly status: 'UNSUPPORTED'; readonly descriptor: CapabilityDescriptor<TInput, TOutput> }
  | { readonly status: 'UNAVAILABLE'; readonly descriptor: CapabilityDescriptor<TInput, TOutput> }
  | { readonly status: 'UNAUTHORIZED'; readonly descriptor: CapabilityDescriptor<TInput, TOutput> }
  | { readonly status: 'INVALID_INPUT'; readonly descriptor: CapabilityDescriptor<TInput, TOutput> }
  | { readonly status: 'NOT_FOUND'; readonly capabilityId: CapabilityId };

export type CapabilityErrorCode =
  | 'CAPABILITY_NOT_FOUND'
  | 'CAPABILITY_UNSUPPORTED'
  | 'CAPABILITY_UNAVAILABLE'
  | 'CAPABILITY_UNAUTHORIZED'
  | 'CAPABILITY_INVALID_INPUT'
  | 'CAPABILITY_NOT_EXECUTABLE'
  | 'CAPABILITY_DUPLICATE_VERSION';

export class CapabilityError extends Error {
  constructor(readonly code: CapabilityErrorCode, message: string) {
    super(message);
    this.name = 'CapabilityError';
  }
}

export interface CapabilityInvocation<TInput = unknown> {
  readonly capabilityId: CapabilityId;
  readonly version: string;
  readonly input: TInput;
  readonly context: CapabilityContext;
  readonly executionId: string;
  readonly requestId: string;
  readonly idempotencyKey?: string;
}

export interface CapabilityExecutor<TInput = unknown, TOutput = unknown> {
  execute(invocation: CapabilityInvocation<TInput>): Promise<TOutput>;
}

export interface CapabilityResolver {
  resolve(capabilityId: CapabilityId, input: unknown, context: CapabilityContext, version?: string): CapabilityResolution;
}

export class CapabilityRegistry implements CapabilityResolver {
  private readonly descriptors = new Map<string, CapabilityDescriptor>();

  register<TInput, TOutput>(descriptor: CapabilityDescriptor<TInput, TOutput>): void {
    const key = `${descriptor.id}@${descriptor.version}`;
    if (this.descriptors.has(key)) throw new CapabilityError('CAPABILITY_DUPLICATE_VERSION', `capability already registered: ${key}`);
    this.descriptors.set(key, descriptor);
  }

  get(capabilityId: CapabilityId, version?: string): CapabilityDescriptor | undefined {
    if (version) return this.descriptors.get(`${capabilityId}@${version}`);
    const matches = [...this.descriptors.values()].filter(descriptor => descriptor.id === capabilityId);
    return matches.length === 1 ? matches[0] : undefined;
  }

  has(capabilityId: CapabilityId, version?: string): boolean { return this.get(capabilityId, version) !== undefined; }
  list(): readonly CapabilityDescriptor[] { return [...this.descriptors.values()]; }

  resolve(capabilityId: CapabilityId, input: unknown, context: CapabilityContext, version?: string): CapabilityResolution {
    const descriptor = this.get(capabilityId, version);
    if (!descriptor) return { status: 'NOT_FOUND', capabilityId };
    if (!descriptor.isSupported(context)) return { status: 'UNSUPPORTED', descriptor };
    if (!descriptor.isAvailable(context)) return { status: 'UNAVAILABLE', descriptor };
    if (!descriptor.isAuthorized(context)) return { status: 'UNAUTHORIZED', descriptor };
    if (descriptor.inputValidator && !descriptor.inputValidator(input)) return { status: 'INVALID_INPUT', descriptor };
    return { status: 'EXECUTABLE', descriptor };
  }
}
