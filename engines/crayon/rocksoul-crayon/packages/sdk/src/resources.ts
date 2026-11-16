/**
 * Public application resource contracts. These mirror the repository's
 * authoritative ORM fields without importing the ORM into the browser SDK.
 * Server responses may still carry additional optional metadata.
 */
export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | (string & {});
export type TaskStatus = 'todo' | 'in progress' | 'completed' | 'pending' | 'canceled' | 'backlog' | (string & {});
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical' | 'important' | (string & {});

export interface Project {
  readonly id: string;
  readonly orgId?: string | null;
  readonly name: string;
  readonly code: string;
  readonly description?: string | null;
  readonly status: ProjectStatus;
  readonly ownerId?: string | null;
  readonly budget?: number | null;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly [key: string]: unknown;
}

export type ProjectInput = Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>> & Pick<Project, 'name' | 'code'>;

export interface Task {
  readonly id: string;
  readonly projectId?: string | null;
  readonly title: string;
  readonly status: TaskStatus;
  readonly category: string;
  readonly priority: TaskPriority;
  readonly assigneeId?: string | null;
  readonly dueDate?: string | null;
  readonly description?: string | null;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly [key: string]: unknown;
}

export type ResourceStatus = 'idle' | 'loading' | 'ready' | 'refreshing' | 'stale' | 'offline' | 'error' | 'forbidden' | 'notFound';

export type ResourceState<T> = {
  readonly data?: T;
  readonly status: ResourceStatus;
  readonly version: number;
  readonly updatedAt?: number;
  readonly error?: unknown;
  readonly freshness: 'fresh' | 'stale' | 'unknown';
};

export type ResourceListener<T> = (state: ResourceState<T>) => void;

/** Small bounded normalized cache. Server responses remain authoritative. */
export class ResourceCache<T> {
  private readonly entries = new Map<string, { state: ResourceState<T>; listeners: Set<ResourceListener<T>>; touchedAt: number }>();
  constructor(private readonly maxEntries = 500) {}

  get(key: string): ResourceState<T> {
    return this.entries.get(key)?.state ?? { status: 'idle', version: 0, freshness: 'unknown' };
  }

  set(key: string, state: ResourceState<T>): void {
    const current = this.entries.get(key);
    const entry = { state, listeners: current?.listeners ?? new Set<ResourceListener<T>>(), touchedAt: Date.now() };
    this.entries.set(key, entry);
    while (this.entries.size > this.maxEntries) {
      const oldest = [...this.entries.entries()].filter(([, value]) => value.listeners.size === 0).sort((a, b) => a[1].touchedAt - b[1].touchedAt)[0];
      if (!oldest) break;
      this.entries.delete(oldest[0]);
    }
    entry.listeners.forEach(listener => listener(state));
  }

  subscribe(key: string, listener: ResourceListener<T>): () => void {
    const current = this.entries.get(key) ?? { state: this.get(key), listeners: new Set<ResourceListener<T>>(), touchedAt: Date.now() };
    current.listeners.add(listener);
    current.touchedAt = Date.now();
    this.entries.set(key, current);
    listener(current.state);
    return () => { current.listeners.delete(listener); current.touchedAt = Date.now(); };
  }

  evict(key: string): void { if (!(this.entries.get(key)?.listeners.size)) this.entries.delete(key); }
  clear(): void { for (const [key, entry] of this.entries) if (!entry.listeners.size) this.entries.delete(key); }
}

export type TaskInput = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> & Pick<Task, 'title'>;
