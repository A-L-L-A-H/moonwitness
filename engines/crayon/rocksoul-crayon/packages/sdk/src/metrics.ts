export type RuntimeMetricsSnapshot = Readonly<Record<string, number>>;

/** In-process diagnostic counters; never contains credentials or payloads. */
export class RuntimeMetrics {
  private readonly counters = new Map<string, number>();
  increment(name: string, amount = 1) {
    if (!name.trim() || !Number.isFinite(amount)) return;
    this.counters.set(name, (this.counters.get(name) ?? 0) + amount);
  }
  set(name: string, value: number) {
    if (name.trim() && Number.isFinite(value)) this.counters.set(name, value);
  }
  snapshot(): RuntimeMetricsSnapshot { return Object.fromEntries(this.counters); }
  reset() { this.counters.clear(); }
}
