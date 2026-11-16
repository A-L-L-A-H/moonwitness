import {
  FrameDecoder,
  FrameType,
  Priority,
  encodeFrame,
  sequenceNext,
  validateSequence,
  validateAcknowledgement,
  validatePayload,
} from "@rocksoul/protocol";
import { RuntimeMetrics } from "./metrics.js";
export * from "./capabilities.js";
export * from "./session.js";
export * from "./models.js";
export * from "./application.js";
export * from "./events.js";
export * from "./graph.js";
export * from "./retry.js";
export * from "./metrics.js";
export * from "./schema.js";
export * from "./resources.js";
export * from "./transport/websocket.js";

export type IdProvider = (kind: string) => string;
export type Clock = {
  now(): number;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
};
const systemClock: Clock = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
};
const randomId: IdProvider = (kind) => `${kind}-${crypto.randomUUID()}`;
export type RuntimeErrorKind =
  | "protocol"
  | "transport"
  | "session"
  | "execution"
  | "validation"
  | "cancellation"
  | "timeout";
export class RuntimeError extends Error {
  constructor(
    readonly kind: RuntimeErrorKind,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message, { cause });
    this.name = "RuntimeError";
  }
}
const normalize = (e: unknown, kind: RuntimeErrorKind = "transport") =>
  e instanceof RuntimeError
    ? e
    : new RuntimeError(kind, e instanceof Error ? e.message : String(e), e);
export type SessionState =
  | "DISCONNECTED"
  | "CONNECTING"
  | "NEGOTIATING"
  | "AUTHENTICATING"
  | "READY"
  | "SUSPENDED"
  | "RESUMING"
  | "CLOSING"
  | "CLOSED"
  | "FAILED";
const sessionTransitions: Record<SessionState, readonly SessionState[]> = {
  DISCONNECTED: ["CONNECTING"],
  CONNECTING: ["NEGOTIATING", "FAILED", "DISCONNECTED"],
  NEGOTIATING: ["AUTHENTICATING", "READY", "FAILED"],
  AUTHENTICATING: ["READY", "FAILED"],
  READY: ["SUSPENDED", "CLOSING", "FAILED"],
  SUSPENDED: ["RESUMING", "CLOSING", "CLOSED"],
  RESUMING: ["READY", "FAILED", "SUSPENDED"],
  CLOSING: ["CLOSED", "FAILED"],
  CLOSED: ["CONNECTING"],
  FAILED: ["CONNECTING", "CLOSED"],
};
const transition = (
  table: Record<string, readonly string[]>,
  from: string,
  to: string,
  kind: RuntimeErrorKind = "session",
) => {
  if (!table[from]?.includes(to))
    throw new RuntimeError(kind, `invalid transition ${from} -> ${to}`);
};
export type ExecutionState =
  | "CREATED"
  | "ACCEPTED"
  | "RUNNING"
  | "WAITING"
  | "PAUSED"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";
const terminal = new Set<ExecutionState>([
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
]);
const executionTransitions: Record<ExecutionState, readonly ExecutionState[]> =
  {
    CREATED: ["ACCEPTED", "FAILED", "CANCELLED"],
    ACCEPTED: ["RUNNING", "FAILED", "CANCELLED", "EXPIRED"],
    RUNNING: [
      "WAITING",
      "PAUSED",
      "SUCCEEDED",
      "FAILED",
      "CANCELLED",
      "EXPIRED",
    ],
    WAITING: ["RUNNING", "FAILED", "CANCELLED", "EXPIRED"],
    PAUSED: ["RUNNING", "FAILED", "CANCELLED", "EXPIRED"],
    SUCCEEDED: [],
    FAILED: [],
    CANCELLED: [],
    EXPIRED: [],
  };
export interface Transport {
  connect(): Promise<void> | void;
  disconnect(): Promise<void> | void;
  send(frame: Uint8Array): Promise<void> | void;
  onFrame(cb: (bytes: Uint8Array) => void): () => void;
  onClose(cb: (reason?: unknown) => void): () => void;
  onError(cb: (error: unknown) => void): () => void;
}
export class MemoryTransport implements Transport {
  private connected = false;
  private frames: Array<(b: Uint8Array) => void> = [];
  private closes: Array<(r?: unknown) => void> = [];
  private errors: Array<(e: unknown) => void> = [];
  public sent: Uint8Array[] = [];
  public onSend?: (frame: Uint8Array) => void;
  async connect() {
    this.connected = true;
  }
  async disconnect() {
    this.connected = false;
    this.closes.forEach((f) => f());
  }
  async send(frame: Uint8Array) {
    if (!this.connected) throw new Error("transport disconnected");
    const copy = new Uint8Array(frame);
    this.sent.push(copy);
    this.onSend?.(new Uint8Array(copy));
  }
  onFrame(cb: (b: Uint8Array) => void) {
    this.frames.push(cb);
    return () => {
      this.frames = this.frames.filter((x) => x !== cb);
    };
  }
  onClose(cb: (r?: unknown) => void) {
    this.closes.push(cb);
    return () => {
      this.closes = this.closes.filter((x) => x !== cb);
    };
  }
  onError(cb: (e: unknown) => void) {
    this.errors.push(cb);
    return () => {
      this.errors = this.errors.filter((x) => x !== cb);
    };
  }
  receive(frame: Uint8Array) {
    this.frames.forEach((f) => f(new Uint8Array(frame)));
  }
  fail(e: unknown) {
    this.errors.forEach((f) => f(e));
  }
}
type RuntimeCapability = {
  readonly id: string;
  readonly supported?: boolean;
  readonly validateInput?: (input: unknown) => boolean;
  readonly mutation?: boolean;
};
class RuntimeCapabilityRegistry {
  private readonly map = new Map<string, RuntimeCapability>();
  register(capability: RuntimeCapability) {
    this.map.set(capability.id, capability);
  }
  get(id: string) {
    return this.map.get(id);
  }
  list() {
    return [...this.map.values()];
  }
  isSupported(id: string) {
    return this.map.get(id)?.supported !== false && this.map.has(id);
  }
}
type Listener<T> = (value: T) => void;
class Emitter<T> {
  private readonly listeners = new Set<Listener<T>>();
  on(fn: Listener<T>) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit(v: T) {
    for (const fn of [...this.listeners]) fn(v);
  }
  clear() {
    this.listeners.clear();
  }
}
export interface ExecutionEvent<T = unknown> {
  readonly type: string;
  readonly executionId: string;
  readonly data?: T;
}
export interface Execution<T = unknown> {
  readonly id: string;
  readonly requestId: string;
  readonly idempotencyKey?: string;
  readonly capability: string;
  readonly state: ExecutionState;
  watch(listener?: Listener<ExecutionEvent>): () => void;
  result(): Promise<T>;
  cancel(): Promise<void>;
  stream(): AsyncIterable<ExecutionEvent<T>>;
}
class ExecutionImpl<T> implements Execution<T> {
  private current: ExecutionState = "CREATED";
  private readonly events = new Emitter<ExecutionEvent>();
  private readonly resultPromise: Promise<T>;
  private resolve!: (v: T) => void;
  private reject!: (e: unknown) => void;
  private timer?: unknown;
  constructor(
    private readonly runtime: ApplicationRuntime,
    readonly id: string,
    readonly requestId: string,
    readonly capability: string,
    readonly idempotencyKey?: string,
  ) {
    this.resultPromise = new Promise<T>((a, b) => {
      this.resolve = a;
      this.reject = b;
    });
  }
  get state() {
    return this.current;
  }
  watch(listener?: Listener<ExecutionEvent>) {
    return listener ? this.events.on(listener) : () => {};
  }
  result() {
    return this.resultPromise;
  }
  cancel() {
    return this.runtime.cancel(this.id);
  }
  async *stream() {
    const queue: ExecutionEvent<T>[] = [];
    let wake: (() => void) | undefined;
    let done = false;
    const off = this.watch(event => { queue.push(event as ExecutionEvent<T>); wake?.(); });
    try {
      while (!done || queue.length) {
        if (!queue.length) await new Promise<void>(resolve => { wake = resolve; });
        while (queue.length) {
          const event = queue.shift()!;
          yield event;
          done = terminal.has(this.current);
        }
      }
    } finally { off(); }
  }
  transition(next: ExecutionState, data?: unknown) {
    if (this.current === next || terminal.has(this.current)) return;
    transition(executionTransitions, this.current, next, "execution");
    this.current = next;
    this.events.emit({ type: next, executionId: this.id, data });
    if (terminal.has(next)) {
      if (next === "SUCCEEDED") this.resolve(data as T);
      else
        this.reject(
          new RuntimeError(
            next === "CANCELLED" ? "cancellation" : "execution",
            `execution ${next.toLowerCase()}`,
            data,
          ),
        );
      if (this.timer) this.runtime.clock.clearTimeout(this.timer);
      this.events.clear();
    }
  }
  expire() {
    this.transition(this.current === "CREATED" ? "FAILED" : "EXPIRED");
  }
  setTimer(id: unknown) {
    this.timer = id;
  }
  emit(e: ExecutionEvent) {
    if (!terminal.has(this.current)) this.events.emit(e);
  }
}
export interface RuntimeOptions {
  transport: Transport;
  ids?: IdProvider;
  clock?: Clock;
  capabilities?: readonly RuntimeCapability[];
  executionTimeoutMs?: number;
  reconnect?: { readonly enabled?: boolean; readonly maxAttempts?: number; readonly baseDelayMs?: number; readonly maxDelayMs?: number };
}
export type RuntimeInspection = {
  readonly session: { readonly state: SessionState; readonly sessionId?: string; readonly lastAcknowledgedSequence: number };
  readonly transport: { readonly state?: string; readonly bufferedBytes?: number; readonly pendingFrames?: number };
  readonly capabilities: number;
  readonly activeExecutions: number;
  readonly metrics: Readonly<Record<string, number>>;
};
export class ApplicationRuntime {
  readonly clock: Clock;
  readonly transport: Transport;
  readonly metrics = new RuntimeMetrics();
  readonly capabilities = new RuntimeCapabilityRegistry();
  private sessionState: SessionState = "DISCONNECTED";
  private readonly executions = new Map<string, ExecutionImpl<unknown>>();
  private readonly events = new Emitter<{ type: string; data?: unknown }>();
  private readonly decoder = new FrameDecoder();
  private readonly ids: IdProvider;
  private readonly executionTimeoutMs: number;
  private readonly outgoingSequences = new Map<number, number>();
  private readonly incomingSequences = new Map<number, number>();
  private streamAck = 0;
  private readonly streamIds = { next: 1 };
  private sessionId?: string;
  private resumeToken?: string;
  private pendingWelcome?: {
    promise: Promise<void>;
    resolve: () => void;
    reject: (error: unknown) => void;
  };
  private readonly reconnectPolicy: Required<NonNullable<RuntimeOptions['reconnect']>>;
  private reconnectAttempt = 0;
  private reconnectTimer?: unknown;
  private intentionalClose = false;
  constructor(options: RuntimeOptions) {
    this.clock = options.clock ?? systemClock;
    this.transport = options.transport;
    this.ids = options.ids ?? randomId;
    this.executionTimeoutMs = options.executionTimeoutMs ?? 0;
    this.reconnectPolicy = { enabled: false, maxAttempts: 8, baseDelayMs: 250, maxDelayMs: 10_000, ...options.reconnect };
    for (const c of options.capabilities ?? []) this.capabilities.register(c);
    this.transport.onClose(() => { this.suspend(); this.scheduleReconnect(); });
    this.transport.onError((e) =>
      this.events.emit({ type: "error", data: normalize(e) }),
    );
    this.transport.onFrame((bytes) => this.ingestBytes(bytes));
  }
  inspect(): RuntimeInspection {
    const transport = this.transport as Transport & { connectionState?: string; bufferedBytes?: number; pendingFrames?: number };
    return {
      session: { state: this.sessionState, sessionId: this.sessionId, lastAcknowledgedSequence: this.streamAck },
      transport: { state: transport.connectionState, bufferedBytes: transport.bufferedBytes, pendingFrames: transport.pendingFrames },
      capabilities: this.capabilities.list().length,
      activeExecutions: [...this.executions.values()].filter(execution => !terminal.has(execution.state)).length,
      metrics: this.metrics.snapshot(),
    };
  }
  get session() {
    return {
      state: this.sessionState,
      sessionId: this.sessionId,
      resumeToken: this.resumeToken,
      lastAcknowledgedSequence: this.streamAck,
    };
  }
  onEvent(listener: Listener<{ type: string; data?: unknown }>) {
    return this.events.on(listener);
  }
  async connect() {
    this.intentionalClose = false;
    if (this.reconnectTimer !== undefined) { this.clock.clearTimeout(this.reconnectTimer); this.reconnectTimer = undefined; }
    this.metrics.increment('connection.attempts');
    const resuming = this.sessionState === "SUSPENDED";
    if (resuming) transition(sessionTransitions, this.sessionState, "RESUMING");
    else transition(sessionTransitions, this.sessionState, "CONNECTING");
    this.sessionState = resuming ? "RESUMING" : "CONNECTING";
    try {
      await this.transport.connect();
      this.metrics.increment(resuming ? 'session.resume.count' : 'session.initial.count');
      if (!resuming) {
        transition(sessionTransitions, this.sessionState, "NEGOTIATING");
        this.sessionState = "NEGOTIATING";
      }
      const welcome = this.createPendingWelcome();
      await this.send(
        FrameType.HELLO,
        0,
        resuming
          ? {
              helloKind: "REQUEST",
              mode: "RESUME",
              serializers: ["msgpack"],
              sessionId: this.sessionId,
              resumeToken: this.resumeToken,
              lastAckSeq: this.streamAck,
            }
          : { helloKind: "REQUEST", mode: "INITIAL", serializers: ["msgpack"] },
        Priority.CRITICAL,
        resuming ? 4 : 0,
      );
      await welcome;
      this.reconnectAttempt = 0;
    } catch (error) {
      this.pendingWelcome = undefined;
      this.sessionState = "FAILED";
      throw normalize(error, "session");
    }
  }
  async disconnect() {
    if (this.sessionState === "DISCONNECTED" || this.sessionState === "CLOSED")
      return;
    this.intentionalClose = true;
    if (this.reconnectTimer !== undefined) { this.clock.clearTimeout(this.reconnectTimer); this.reconnectTimer = undefined; }
    if (this.sessionState === "READY" || this.sessionState === "SUSPENDED")
      this.sessionState = "CLOSING";
    await this.transport.disconnect();
    this.metrics.increment('connection.disconnect.count');
    this.sessionState = "CLOSED";
    this.events.emit({ type: "closed" });
  }
  private scheduleReconnect() {
    if (!this.reconnectPolicy.enabled || this.intentionalClose || this.sessionState !== 'SUSPENDED') return;
    if (this.reconnectAttempt >= this.reconnectPolicy.maxAttempts) {
      this.events.emit({ type: 'reconnect-exhausted' });
      return;
    }
    const delay = Math.min(this.reconnectPolicy.maxDelayMs, this.reconnectPolicy.baseDelayMs * (2 ** this.reconnectAttempt));
    this.reconnectAttempt += 1;
    this.metrics.increment('connection.reconnect.scheduled');
    this.reconnectTimer = this.clock.setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.connect().catch(error => { this.events.emit({ type: 'reconnect-failed', data: normalize(error, 'session') }); this.scheduleReconnect(); });
    }, delay);
  }
  async run<T = unknown>(
    capability: string,
    input: unknown,
    options: { idempotencyKey?: string; timeoutMs?: number } = {},
  ): Promise<Execution<T>> {
    const c = this.capabilities.get(capability);
    if (!c || !this.capabilities.isSupported(capability))
      throw new RuntimeError(
        "validation",
        `unsupported capability ${capability}`,
      );
    if (c.validateInput && !c.validateInput(input))
      throw new RuntimeError("validation", `invalid input for ${capability}`);
    if (this.sessionState !== "READY")
      throw new RuntimeError("session", "runtime is not ready");
    const id = this.ids("execution"),
      requestId = this.ids("request"),
      key =
        options.idempotencyKey ??
        (c.mutation ? this.ids("idempotency") : undefined);
    const e = new ExecutionImpl<T>(this, id, requestId, capability, key);
    this.metrics.increment('execution.started');
    this.executions.set(id, e as ExecutionImpl<unknown>);
    const streamId = this.streamIds.next;
    this.streamIds.next += 2;
    await this.send(
      FrameType.RUN,
      streamId,
      {
        capabilityId: capability,
        input,
        executionId: id,
        requestId,
        idempotencyKey: key,
      },
      Priority.HIGH,
    );
    const timeout = options.timeoutMs ?? this.executionTimeoutMs;
    if (timeout) e.setTimer(this.clock.setTimeout(() => e.expire(), timeout));
    return e;
  }
  watch(id: string, listener: Listener<ExecutionEvent>) {
    const e = this.executions.get(id);
    if (!e) throw new RuntimeError("execution", "unknown execution");
    return e.watch(listener);
  }
  async cancel(id: string) {
    const e = this.executions.get(id);
    if (!e || terminal.has(e.state)) return;
    await this.send(
      FrameType.SIGNAL,
      0,
      { signal: "CANCEL", executionId: id },
      Priority.CRITICAL,
    );
    e.transition("CANCELLED");
  }
  async send(
    type: FrameType,
    streamId: number,
    payload: unknown,
    priority: Priority,
    flags = 0,
  ) {
    await this.transport.send(
      encodeFrame({
        header: {
          magic: 0x41455031,
          protocolVersion: 1,
          frameType: type,
          flags,
          streamId,
          sequence: this.nextOutgoing(streamId),
          acknowledgement: this.incomingSequences.get(streamId) ?? 0,
          timestamp: BigInt(this.clock.now()),
          priority,
          payloadLength: 0,
        },
        payload,
      }),
    );
  }
  private nextOutgoing(streamId: number) {
    const n = this.outgoingSequences.get(streamId) ?? 0;
    this.outgoingSequences.set(streamId, sequenceNext(n));
    return n;
  }
  ingestBytes(bytes: Uint8Array) {
    if (bytes.byteLength === 0) return;
    try {
      for (const frame of this.decoder.push(bytes)) this.ingestFrame(frame);
    } catch (error) {
      const normalized = normalize(error, "protocol");
      this.pendingWelcome?.reject(normalized);
      this.events.emit({ type: "error", data: normalized });
    }
  }
  private ingestFrame(frame: {
    header: {
      sequence: number;
      acknowledgement: number;
      frameType: FrameType;
      flags: number;
      streamId: number;
    };
    payload: unknown;
  }) {
    validatePayload(frame.header.frameType, frame.payload, frame.header);
    const expected = this.incomingSequences.get(frame.header.streamId) ?? 0;
    const check = validateSequence(expected, frame.header.sequence);
    if (check === "duplicate") return;
    this.incomingSequences.set(frame.header.streamId, frame.header.sequence);
    this.streamAck = Math.max(this.streamAck, frame.header.sequence);
    validateAcknowledgement(
      Math.max(0, (this.outgoingSequences.get(frame.header.streamId) ?? 0) - 1),
      frame.header.acknowledgement,
    );
    if (frame.header.frameType === FrameType.HELLO) {
      const hello = frame.payload as {
        helloKind: string;
        sessionId: string;
        resumeToken?: string;
        negotiatedSerializer: string;
        resume?: { status: string; delivery: string };
      };
      if (hello.helloKind !== "WELCOME")
        throw new RuntimeError("protocol", "client received HELLO request");
      if (
        this.sessionState !== "NEGOTIATING" &&
        this.sessionState !== "RESUMING"
      )
        throw new RuntimeError(
          "session",
          "HELLO welcome received outside negotiation",
        );
      if (hello.resume?.status === "REJECTED")
        throw new RuntimeError(
          "session",
          `resume rejected: ${hello.resume.delivery}`,
        );
      this.sessionId = hello.sessionId;
      this.resumeToken = hello.resumeToken ?? this.resumeToken;
      this.sessionState = "READY";
      this.pendingWelcome?.resolve();
      this.pendingWelcome = undefined;
      this.events.emit({
        type: "ready",
        data: {
          sessionId: this.sessionId,
          serializer: hello.negotiatedSerializer,
          resumed: hello.resume?.status === "ACCEPTED",
        },
      });
      return;
    }
    const p = frame.payload as Record<string, any>;
    const e = p.executionId ? this.executions.get(p.executionId) : undefined;
    if (frame.header.frameType === FrameType.ACK && e) e.transition("ACCEPTED");
    if (frame.header.frameType === FrameType.DATA && e) {
      if (p.state) e.transition(p.state, p.data);
      e.emit({
        type: p.eventType ?? "data",
        executionId: p.executionId,
        data: p.data,
      });
    }
    if (
      frame.header.frameType === FrameType.SIGNAL &&
      p.signal === "CANCELLED" &&
      e
    )
      e.transition("CANCELLED");
    if (frame.header.frameType === FrameType.CLOSE && e) e.transition("FAILED");
  }
  private createPendingWelcome() {
    let resolve!: () => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<void>((ok, fail) => {
      resolve = ok;
      reject = fail;
    });
    this.pendingWelcome = { promise, resolve, reject };
    return promise;
  }
  private suspend() {
    if (this.sessionState === "READY") {
      this.sessionState = "SUSPENDED";
      this.events.emit({ type: "suspended" });
    } else if (this.sessionState === "NEGOTIATING") {
      this.pendingWelcome?.reject(
        new RuntimeError("transport", "transport closed during negotiation"),
      );
    }
  }
}
export function createAppRuntime(options: RuntimeOptions) {
  const runtime = new ApplicationRuntime(options);
  return {
    connect: runtime.connect.bind(runtime),
    disconnect: runtime.disconnect.bind(runtime),
    run: runtime.run.bind(runtime),
    watch: runtime.watch.bind(runtime),
    cancel: runtime.cancel.bind(runtime),
    onEvent: runtime.onEvent.bind(runtime),
    get session() {
      return runtime.session;
    },
  };
}
