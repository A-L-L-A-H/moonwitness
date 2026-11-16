import type { ApplicationRuntime, Execution } from './index.js';
import type { ModelClient, ModelPage, ModelQuery, ModelRecord, ModelUpdateOptions, ModelWrite } from './models.js';
import { EventDeduplicator, type AppEvent, type ApplicationCursor, type Subscription, type SubscriptionState } from './events.js';
import { runExecutionGraph, type GraphNode, type GraphResult } from './graph.js';
import { ResourceCache, type Project, type ProjectInput, type ResourceListener, type ResourceState, type Task, type TaskInput } from './resources.js';

export type ResourceHandle<T> = {
  readonly key: string;
  readonly state: ResourceState<T>;
  subscribe(listener: (state: ResourceState<T>) => void): () => void;
  refresh(): Promise<T>;
  evict(): void;
};

export type AppResource<T extends ModelRecord = ModelRecord, TInput extends ModelWrite = ModelWrite> = {
  list(query?: ModelQuery): Promise<ModelPage<T>>;
  get(id: string): Promise<T>;
  create(input: TInput): Promise<T>;
  update(id: string, input: Partial<TInput>, options?: ModelUpdateOptions): Promise<T>;
  delete(id: string): Promise<{ id: string; deleted: boolean }>;
  metadata(): Promise<unknown>;
  watch(id: string, listener: (event: AppEvent<T>) => void): Subscription<T>;
  use(id: string): ResourceHandle<T>;
};

export type AepResourceAdapter = {
  list<T extends ModelRecord = ModelRecord>(query?: ModelQuery): Promise<ModelPage<T>>;
  get<T extends ModelRecord = ModelRecord>(id: string): Promise<T>;
  create<T extends ModelRecord = ModelRecord>(input: ModelWrite): Promise<T>;
  update<T extends ModelRecord = ModelRecord>(id: string, input: ModelWrite, options?: ModelUpdateOptions): Promise<T>;
  delete(id: string): Promise<{ id: string; deleted: boolean }>;
  watch<T extends ModelRecord = ModelRecord>(id: string, listener: (event: AppEvent<T>) => void): Subscription<T>;
  metadata?(): Promise<unknown>;
};

export type AppClient = {
  readonly runtime?: ApplicationRuntime;
  readonly session: { readonly state: string; readonly sessionId?: string; readonly lastAcknowledgedSequence: number };
  readonly events: { on(listener: (event: { type: string; data?: unknown }) => void): () => void };
  readonly executions: { watch(id: string, listener: (event: unknown) => void): () => void; cancel(id: string): Promise<void> };
  readonly resources: AppResourceFactory;
  readonly projects: AppResource<Project, ProjectInput>;
  readonly tasks: AppResource<Task, TaskInput>;
  readonly users: AppResource;
  readonly calendar: AppResource;
  readonly ai: {
    chat(input: unknown, options?: { idempotencyKey?: string; timeoutMs?: number }): Promise<Execution>;
  };
  readonly mail: {
    send(input: { to: string; subject?: string; text: string; draft?: boolean }, options?: { idempotencyKey?: string; timeoutMs?: number }): Promise<Execution>;
  };
  readonly chat: {
    send(input: { conversationId: string; content: string; type?: 'text' | 'image' | 'file' }, options?: { idempotencyKey?: string; timeoutMs?: number }): Promise<Execution>;
  };
  readonly flow: {
    list(): Promise<unknown>;
    get(id: string): Promise<unknown>;
    create(input: { name: string; description?: string; definition?: unknown }): Promise<unknown>;
    update(id: string, input: Record<string, unknown>): Promise<unknown>;
    delete(id: string): Promise<unknown>;
    validate(id: string): Promise<unknown>;
    publish(id: string): Promise<unknown>;
    run(id: string, options?: { idempotencyKey?: string }): Promise<Execution>;
    cancel(id: string, executionId: string): Promise<Execution>;
    executions(id: string): Promise<unknown>;
    nodes(): Promise<unknown>;
  };
  readonly capabilities: {
    list(): readonly unknown[];
    resolve(id: string): unknown | undefined;
  };
  execute<T = unknown>(capability: string, input: unknown, options?: { idempotencyKey?: string; timeoutMs?: number }): Promise<Execution<T>>;
  query<T extends ModelRecord = ModelRecord>(resource: string, query?: ModelQuery): Promise<ModelPage<T>>;
  mutate<T = unknown>(capability: string, input: unknown, options?: { idempotencyKey?: string }): Promise<Execution<T>>;
  batch<T extends Record<string, Promise<unknown>>>(operations: T, options?: { mode?: 'parallel' | 'sequential' }): Promise<{ [K in keyof T]: { status: 'success' | 'failed'; value?: Awaited<T[K]>; error?: unknown } }>;
  graph(graphId: string, nodes: readonly GraphNode[]): Promise<GraphResult>;
};

export type AppResourceFactory = {
  for<T extends ModelRecord = ModelRecord>(name: string): AppResource<T>;
  menu(): Promise<unknown>;
};

export type AppClientOptions = {
  readonly runtime?: ApplicationRuntime;
  readonly runtimeProvider?: () => ApplicationRuntime | undefined;
  readonly models?: ModelClient;
  readonly nativeResources?: Readonly<Record<string, AepResourceAdapter>>;
  readonly nativeResourcesProvider?: () => Readonly<Record<string, AepResourceAdapter>>;
};

const generatedIdempotencyKey = () => {
  const cryptoObject = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  return cryptoObject?.randomUUID ? cryptoObject.randomUUID() : `aep-idempotency-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/**
 * Semantic application facade. Transport and URL details remain behind the
 * supplied adapters; feature code depends on resources and capabilities.
 */
export function createAppClient(options: AppClientOptions): AppClient {
  const currentRuntime = () => options.runtimeProvider?.() ?? options.runtime;
  const caches = new Map<string, ResourceCache<ModelRecord>>();
  const inflight = new Map<string, Promise<ModelRecord>>();
  const cacheFor = (name: string) => {
    let cache = caches.get(name);
    if (!cache) { cache = new ResourceCache<ModelRecord>(); caches.set(name, cache); }
    return cache;
  };
  const run = async <T>(capability: string, input: unknown, executionOptions?: { idempotencyKey?: string; timeoutMs?: number }) => {
    const runtime = currentRuntime();
    if (!runtime) throw new Error('execution runtime is not configured');
    if (runtime.session?.state !== 'READY' && typeof runtime.connect === 'function') await runtime.connect();
    return runtime.run<T>(capability, input, executionOptions);
  };
  const flowResult = async (capability: string, input: unknown, mutation = false) => (await run(capability, input, mutation ? { idempotencyKey: generatedIdempotencyKey() } : undefined)).result();
  const nativeFor = (name: string) => {
    const provided = options.nativeResourcesProvider?.();
    return options.nativeResources?.[name] ?? provided?.[name];
  };
  const resource = <T extends ModelRecord = ModelRecord>(name: string): AppResource<T> => ({
    list: query => {
      const native = nativeFor(name);
      if (native) return native.list<T>(query);
      if (!options.models) throw new Error('resource adapter is not configured');
      return options.models.list<T>(name, query);
    },
    get: id => {
      const native = nativeFor(name);
      const key = `${name}:${id}`;
      if (!native && !options.models) throw new Error('resource adapter is not configured');
      const models = options.models;
      const existing = inflight.get(key);
      if (existing) return existing as Promise<T>;
      cacheFor(name).set(id, { ...cacheFor(name).get(id), status: cacheFor(name).get(id).data ? 'refreshing' : 'loading', error: undefined, freshness: cacheFor(name).get(id).data ? 'fresh' : 'unknown' });
      const request = (native ? native.get<T>(id) : models!.read<T>(name, id)).then(value => {
        const current = cacheFor(name).get(id);
        cacheFor(name).set(id, { data: value, status: 'ready', version: current.version + 1, updatedAt: Date.now(), freshness: 'fresh' });
        return value;
      }).catch(error => {
        const current = cacheFor(name).get(id);
        cacheFor(name).set(id, { ...current, status: 'error', error, freshness: current.data ? 'stale' : 'unknown' });
        throw error;
      }).finally(() => inflight.delete(key));
      inflight.set(key, request as Promise<ModelRecord>);
      return request;
    },
    create: input => {
      const native = nativeFor(name);
      if (native) return native.create<T>(input).then(value => { const id = String(value.id); cacheFor(name).set(id, { data: value, status: 'ready', version: cacheFor(name).get(id).version + 1, updatedAt: Date.now(), freshness: 'fresh' }); return value; });
      if (!options.models) throw new Error('resource adapter is not configured');
      return options.models.create<T>(name, input).then(value => { const id = String(value.id); cacheFor(name).set(id, { data: value, status: 'ready', version: cacheFor(name).get(id).version + 1, updatedAt: Date.now(), freshness: 'fresh' }); return value; });
    },
    update: (id, input, updateOptions) => {
      const native = nativeFor(name);
      if (native) return native.update<T>(id, updateOptions?.expectedVersion ? { ...input, expectedVersion: updateOptions.expectedVersion } : input).then(value => { cacheFor(name).set(id, { data: value, status: 'ready', version: cacheFor(name).get(id).version + 1, updatedAt: Date.now(), freshness: 'fresh' }); return value; });
      if (!options.models) throw new Error('resource adapter is not configured');
      return options.models.update<T>(name, id, input, updateOptions).then(value => { cacheFor(name).set(id, { data: value, status: 'ready', version: cacheFor(name).get(id).version + 1, updatedAt: Date.now(), freshness: 'fresh' }); return value; });
    },
    delete: id => {
      const native = nativeFor(name);
      if (native) return native.delete(id).then(value => { cacheFor(name).evict(id); return value; });
      if (!options.models) throw new Error('resource adapter is not configured');
      return (options.models.remove(name, id) as Promise<{ id: string; deleted: boolean }>).then(value => { cacheFor(name).evict(id); return value; });
    },
    metadata: () => {
      const native = nativeFor(name);
      if (native?.metadata) return native.metadata();
      if (!options.models) throw new Error('resource adapter is not configured');
      return options.models.metadata(name);
    },
    watch: (id, listener) => {
      const native = nativeFor(name);
      if (!native) throw new Error('live resource subscription is not available on the compatibility adapter');
      return native.watch(id, listener);
    },
    use: id => {
      const cache = cacheFor(name);
      const key = id;
      return {
        key,
        get state() { return cache.get(key) as ResourceState<T>; },
        subscribe: listener => cache.subscribe(key, listener as ResourceListener<ModelRecord>),
        refresh: async () => resource<T>(name).get(id),
        evict: () => cache.evict(key),
      };
    },
  });

  return {
    get runtime() {
      return currentRuntime();
    },
    get session() {
      return currentRuntime()?.session ?? { state: 'DISCONNECTED', lastAcknowledgedSequence: 0 };
    },
    events: {
      on: listener => {
        const runtime = currentRuntime();
        return runtime ? runtime.onEvent(listener) : () => {};
      },
    },
    executions: {
      watch: (id, listener) => {
        const runtime = currentRuntime();
        if (!runtime) throw new Error('execution runtime is not configured');
        return runtime.watch(id, listener as never);
      },
      cancel: async id => {
        const runtime = currentRuntime();
        if (!runtime) throw new Error('execution runtime is not configured');
        return runtime.cancel(id);
      },
    },
    resources: { for: resource, menu: () => options.models?.menu() ?? Promise.resolve([]) },
    projects: resource('projects'),
    tasks: resource('tasks'),
    users: resource('users'),
    calendar: resource('calendar_events'),
    ai: {
      chat: (input, executionOptions) => {
        if (!currentRuntime()) throw new Error('execution runtime is not configured');
        return run('ai.chat', input, executionOptions);
      },
    },
    mail: {
      send: (input, executionOptions) => {
        if (!currentRuntime()) throw new Error('execution runtime is not configured');
        return run('mail.send', input, { ...executionOptions, idempotencyKey: executionOptions?.idempotencyKey ?? generatedIdempotencyKey() });
      },
    },
    chat: {
      send: (input, executionOptions) => {
        if (!currentRuntime()) throw new Error('execution runtime is not configured');
        return run('chat.send', input, { ...executionOptions, idempotencyKey: executionOptions?.idempotencyKey ?? generatedIdempotencyKey() });
      },
    },
    flow: {
      list: () => flowResult('flow.list', {}), get: id => flowResult('flow.get', { id }),
      create: input => flowResult('flow.create', input, true), update: (id, input) => flowResult('flow.update', { id, ...input }, true),
      delete: id => flowResult('flow.delete', { id }, true), validate: id => flowResult('flow.validate', { id }), publish: id => flowResult('flow.publish', { id }, true),
      run: async (id, executionOptions) => run('flow.run', { id }, { idempotencyKey: executionOptions?.idempotencyKey ?? generatedIdempotencyKey() }),
      cancel: async (id, executionId) => run('flow.cancel', { id, executionId }, { idempotencyKey: generatedIdempotencyKey() }), executions: id => flowResult('flow.executions', { id }), nodes: () => flowResult('flow.nodes.list', {}),
    },
    capabilities: {
      list: () => currentRuntime()?.capabilities.list() ?? [],
      resolve: id => currentRuntime()?.capabilities.get(id),
    },
    execute: (capability, input, executionOptions) => {
      if (!currentRuntime()) throw new Error('execution runtime is not configured');
      return run(capability, input, executionOptions);
    },
    query: <T extends ModelRecord = ModelRecord>(name: string, query?: ModelQuery) => resource<T>(name).list(query),
    mutate: (capability, input, executionOptions) => {
      if (!currentRuntime()) throw new Error('execution runtime is not configured');
      return run(capability, input, { ...executionOptions, idempotencyKey: executionOptions?.idempotencyKey ?? generatedIdempotencyKey() });
    },
    batch: async (operations, batchOptions = {}) => {
      const result: Record<string, { status: 'success' | 'failed'; value?: unknown; error?: unknown }> = {};
      if (batchOptions.mode === 'sequential') {
        for (const [key, operation] of Object.entries(operations)) {
          try { result[key] = { status: 'success', value: await operation }; }
          catch (error) { result[key] = { status: 'failed', error }; }
        }
      } else {
        await Promise.all(Object.entries(operations).map(async ([key, operation]) => {
          try { result[key] = { status: 'success', value: await operation }; }
          catch (error) { result[key] = { status: 'failed', error }; }
        }));
      }
      return result as { [K in keyof typeof operations]: { status: 'success' | 'failed'; value?: Awaited<typeof operations[K]>; error?: unknown } };
    },
    graph: (graphId, nodes) => runExecutionGraph(graphId, nodes),
  };
}

/** Maps semantic resource operations to versioned AEP capabilities. */
export function createAepResourceAdapter(
  runtime: ApplicationRuntime,
  resourceName: string,
): AepResourceAdapter {
  if (!resourceName.trim()) throw new Error('resource name is required');
  const execute = async <T>(operation: string, input: unknown, mutation = false) =>
    (await runtime.run<T>(`${resourceName}.${operation}`, input, mutation ? { idempotencyKey: generatedIdempotencyKey() } : undefined)).result();
  return {
    list: <T extends ModelRecord = ModelRecord>(query?: ModelQuery) => execute<ModelPage<T>>('list', query ?? {}),
    get: id => execute('get', { id }),
    create: input => execute('create', input, true),
    update: (id, input, updateOptions) => execute('update', { id, ...input, ...(updateOptions?.expectedVersion ? { expectedVersion: updateOptions.expectedVersion } : {}) }, true),
    delete: id => execute('delete', { id }, true),
    watch: <T extends ModelRecord = ModelRecord>(id: string, listener: (event: AppEvent<T>) => void) => {
      let executionPromise = runtime.run<unknown>(`${resourceName}.watch`, { id });
      let current: SubscriptionState = 'CREATED';
      let unsubscribe = () => {};
      let closed = false;
      let lastCursor: ApplicationCursor | undefined;
      const deduplicator = new EventDeduplicator<T>();
      const eventListeners = new Set<(event: AppEvent<T>) => void>();
      const errorListeners = new Set<(error: unknown) => void>();
      eventListeners.add(listener);
      const subscription: Subscription<T> = {
        id: `subscription-${resourceName}-${id}`,
        get state() { return current; },
        close: async () => { closed = true; current = 'CLOSED'; const execution = await executionPromise; await execution.cancel(); unsubscribe(); },
        resume: async (cursor?: ApplicationCursor) => {
          if (closed) throw new Error('subscription is closed');
          current = 'RESUMING';
          unsubscribe();
          const previous = await executionPromise;
          await previous.cancel();
          executionPromise = runtime.run<unknown>(`${resourceName}.watch`, { id, cursor: cursor ?? lastCursor });
          await executionPromise.then(execution => {
            current = 'ACTIVE';
            unsubscribe = execution.watch(event => {
              if (event.type === 'DATA') {
                const value = event.data as AppEvent<T>;
                if (!deduplicator.accept(value)) return;
                lastCursor = value.cursor ?? lastCursor;
                eventListeners.forEach(callback => callback(value));
              }
              if (event.type === 'FAILED') { current = 'FAILED'; errorListeners.forEach(callback => callback(event.data)); }
            });
          });
        },
        onEvent: callback => { eventListeners.add(callback); return () => { eventListeners.delete(callback); }; },
        onError: callback => { errorListeners.add(callback); return () => { errorListeners.delete(callback); }; },
      };
      void executionPromise.then(execution => {
        current = 'ACTIVE';
        unsubscribe = execution.watch(event => {
          if (event.type === 'DATA') {
            const value = event.data as AppEvent<T>;
            if (!deduplicator.accept(value)) return;
            lastCursor = value.cursor ?? lastCursor;
            eventListeners.forEach(callback => callback(value));
          }
          if (event.type === 'FAILED') { current = 'FAILED'; errorListeners.forEach(callback => callback(event.data)); }
        });
      }).catch(error => { current = 'FAILED'; errorListeners.forEach(callback => callback(error)); });
      return subscription;
    },
  };
}
