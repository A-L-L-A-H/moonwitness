export type AepApplicationEvent<T = unknown> = {
  readonly eventId: string;
  readonly eventType: string;
  readonly resource: string;
  readonly recordId?: string;
  readonly timestamp: number;
  readonly cursor?: string;
  readonly principalId?: string;
  readonly payload: T;
};

export type AepEventFilter = {
  readonly resource?: string;
  readonly recordId?: string;
  readonly eventType?: string;
  readonly principalId?: string;
};

type EventStoreClient = { execute(request: string | { sql: string; args: unknown[] }): Promise<{ rows: Array<Record<string, unknown>> }> };

type Listener = (event: AepApplicationEvent) => void;
const MAX_SUBSCRIBERS = 10_000;
const MAX_HISTORY = 1_024;

/** Process-local event authority; durable state remains in canonical domain tables. */
class AepEventHub {
  private readonly listeners = new Map<number, { filter: AepEventFilter; listener: Listener }>();
  private readonly history: AepApplicationEvent[] = [];
  private nextId = 1;
  private nextCursor = 1;
  private store?: EventStoreClient;
  private persistedSequence = 0;
  private pollTimer?: ReturnType<typeof setInterval>;

  async initialize(client: EventStoreClient): Promise<void> {
    this.store = client;
    const result = await client.execute('SELECT sequence, event_id, event_type, resource, record_id, principal_id, payload_json, created_at FROM aep_event_log ORDER BY sequence DESC LIMIT 1024');
    const rows = [...result.rows].reverse();
    this.history.length = 0;
    for (const row of rows) this.history.push({
      eventId: String(row.event_id), eventType: String(row.event_type), resource: String(row.resource),
      recordId: row.record_id == null ? undefined : String(row.record_id),
      principalId: row.principal_id == null ? undefined : String(row.principal_id),
      timestamp: Date.parse(String(row.created_at)), cursor: `evt-${Number(row.sequence)}`,
      payload: JSON.parse(String(row.payload_json)),
    });
    const latest = Number(result.rows[0]?.sequence ?? 0);
    this.nextCursor = Number.isFinite(latest) ? latest + 1 : 1;
    this.persistedSequence = Number.isFinite(latest) ? latest : 0;
    if (!this.pollTimer) {
      this.pollTimer = setInterval(() => { void this.pollPersisted(); }, 500);
      this.pollTimer.unref?.();
    }
  }

  private async pollPersisted(): Promise<void> {
    if (!this.store) return;
    try {
      const result = await this.store.execute({
        sql: 'SELECT sequence, event_id, event_type, resource, record_id, principal_id, payload_json, created_at FROM aep_event_log WHERE sequence > ? ORDER BY sequence LIMIT 256',
        args: [this.persistedSequence],
      });
      for (const row of result.rows) {
        const sequence = Number(row.sequence);
        this.persistedSequence = Math.max(this.persistedSequence, sequence);
        if (this.history.some(event => event.eventId === String(row.event_id))) continue;
        this.deliver({
          eventId: String(row.event_id), eventType: String(row.event_type), resource: String(row.resource),
          recordId: row.record_id == null ? undefined : String(row.record_id), timestamp: Date.parse(String(row.created_at)),
          principalId: row.principal_id == null ? undefined : String(row.principal_id),
          cursor: `evt-${sequence}`, payload: JSON.parse(String(row.payload_json)),
        });
        this.nextCursor = Math.max(this.nextCursor, sequence + 1);
      }
    } catch { /* transient database failures are retried on the next poll */ }
  }

  publish<T>(event: AepApplicationEvent<T>): void {
    const recorded = { ...event, cursor: event.cursor || `evt-${this.nextCursor++}` };
    if (this.store) void this.store.execute({
      sql: `INSERT OR IGNORE INTO aep_event_log (event_id, event_type, resource, record_id, principal_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [recorded.eventId, recorded.eventType, recorded.resource, recorded.recordId ?? null, recorded.principalId ?? null, JSON.stringify(recorded.payload), new Date(recorded.timestamp).toISOString()],
    }).catch(() => undefined);
    this.deliver(recorded);
  }

  private deliver(recorded: AepApplicationEvent): void {
    this.history.push(recorded);
    if (this.history.length > MAX_HISTORY) this.history.shift();
    for (const { filter, listener } of this.listeners.values()) {
      if (filter.resource && filter.resource !== recorded.resource) continue;
      if (filter.recordId && filter.recordId !== recorded.recordId) continue;
      if (filter.eventType && filter.eventType !== recorded.eventType) continue;
      if (filter.principalId && recorded.principalId && filter.principalId !== recorded.principalId) continue;
      listener(recorded);
    }
  }

  subscribe(filter: AepEventFilter, listener: Listener, afterCursor?: string): () => void {
    if (this.listeners.size >= MAX_SUBSCRIBERS) throw new Error('event subscriber capacity exceeded');
    const id = this.nextId++;
    this.listeners.set(id, { filter, listener });
    if (afterCursor) {
      for (const event of this.since(afterCursor, filter)) listener(event);
    }
    return () => this.listeners.delete(id);
  }

  since(cursor?: string, filter: AepEventFilter = {}): readonly AepApplicationEvent[] {
    const position = cursor ? Number(cursor.replace(/^evt-/, '')) : 0;
    return this.history.filter((event) => {
      const current = Number((event.cursor ?? '').replace(/^evt-/, ''));
      return current > position && (!filter.resource || filter.resource === event.resource) && (!filter.recordId || filter.recordId === event.recordId) && (!filter.eventType || filter.eventType === event.eventType) && (!filter.principalId || !event.principalId || filter.principalId === event.principalId);
    });
  }

  replay(cursor: string | undefined, filter: AepEventFilter = {}): { readonly events: readonly AepApplicationEvent[]; readonly gap: boolean } {
    if (!cursor || this.history.length === 0) return { events: this.since(cursor, filter), gap: false };
    const requested = Number(cursor.replace(/^evt-/, ''));
    const oldest = Number((this.history[0].cursor ?? '').replace(/^evt-/, ''));
    return { events: this.since(cursor, filter), gap: Number.isFinite(requested) && requested < oldest - 1 };
  }

  get subscriberCount() { return this.listeners.size; }
}

export const aepEventHub = new AepEventHub();
