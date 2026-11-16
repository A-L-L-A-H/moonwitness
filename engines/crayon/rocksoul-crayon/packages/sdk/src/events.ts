export type ApplicationCursor = string & { readonly __applicationCursor: unique symbol };

export type AppEvent<T = unknown> = {
  readonly eventId: string;
  readonly eventType: string;
  readonly sessionId: string;
  readonly requestId: string;
  readonly executionId?: string;
  readonly sequence: number;
  readonly cursor?: ApplicationCursor;
  readonly timestamp: number;
  readonly priority: number;
  readonly payload: T;
};

export type SubscriptionState = 'CREATED' | 'ACTIVE' | 'PAUSED' | 'RESUMING' | 'CLOSED' | 'FAILED';

export type Subscription<T = unknown> = {
  readonly id: string;
  readonly state: SubscriptionState;
  close(): Promise<void>;
  resume(cursor?: ApplicationCursor): Promise<void>;
  onEvent(listener: (event: AppEvent<T>) => void): () => void;
  onError(listener: (error: unknown) => void): () => void;
};

export const applicationCursor = (value: string): ApplicationCursor => {
  if (!value.trim()) throw new Error('application cursor must not be empty');
  return value as ApplicationCursor;
};

/** Deduplicates immutable server facts without conflating application cursors with wire sequences. */
export class EventDeduplicator<T = unknown> {
  private readonly seen = new Set<string>();
  accept(event: AppEvent<T>): boolean {
    if (!event.eventId || this.seen.has(event.eventId)) return false;
    this.seen.add(event.eventId);
    return true;
  }
  get size() { return this.seen.size; }
}
