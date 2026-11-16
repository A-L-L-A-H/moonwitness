/** Transport-independent session continuity contracts. No persistence or crypto is implied. */
export type Brand<T, Name extends string> = T & { readonly __brand: Name };
export type SessionId = Brand<string, 'SessionId'>;
export type ConnectionId = Brand<string, 'ConnectionId'>;
export type ExecutionId = Brand<string, 'ExecutionId'>;
export type StreamId = Brand<string, 'StreamId'>;
export type ResumeToken = Brand<string, 'ResumeToken'>;
export type SessionGeneration = Brand<number, 'SessionGeneration'>;

const branded = <T, N extends string>(value: T, name: N): Brand<T, N> => {
  if (typeof value === 'string' && value.length === 0) throw new Error(`${name} must not be empty`);
  if (typeof value === 'number' && (!Number.isInteger(value) || value < 0)) throw new Error(`${name} must be a non-negative integer`);
  return value as Brand<T, N>;
};
export const sessionId = (v: string) => branded(v, 'SessionId');
export const connectionId = (v: string) => branded(v, 'ConnectionId');
export const executionId = (v: string) => branded(v, 'ExecutionId');
export const streamId = (v: string) => branded(v, 'StreamId');
export const resumeToken = (v: string) => branded(v, 'ResumeToken');
export const sessionGeneration = (v: number) => branded(v, 'SessionGeneration');

export type SessionState = 'NEW' | 'NEGOTIATING' | 'ACTIVE' | 'SUSPENDED' | 'RESUMING' | 'CLOSING' | 'CLOSED' | 'EXPIRED' | 'REVOKED';
export type ConnectionState = 'NEW' | 'OPEN' | 'CLOSING' | 'CLOSED';
export type StreamResumability = 'RESUMABLE' | 'NON_RESUMABLE' | 'TERMINAL';
export type ResumeResult =
  | { readonly status: 'RESUMED'; readonly sessionId: SessionId; readonly generation: SessionGeneration; readonly connectionId: ConnectionId; readonly lastAcknowledgedSequence: number }
  | { readonly status: 'REJECTED' | 'EXPIRED' | 'REVOKED' | 'NOT_FOUND' | 'CONFLICT'; readonly reason: string };

export interface SessionPolicy { readonly resumeWindowMs: number }
export interface SessionRecord {
  readonly sessionId: SessionId; readonly state: SessionState; readonly generation: SessionGeneration;
  readonly principalId: string; readonly resumeToken: ResumeToken; readonly attachedConnectionId?: ConnectionId;
  readonly suspendedAtServerMs?: number; readonly resumeDeadlineServerMs?: number; readonly lastAcknowledgedSequence: number;
}
export interface SessionResumeRequest { readonly sessionId: SessionId; readonly resumeToken: ResumeToken; readonly generation: SessionGeneration; readonly connectionId: ConnectionId; readonly lastAcknowledgedSequence: number }
export interface StreamContinuity { readonly streamId: StreamId; readonly executionId?: ExecutionId; readonly resumability: StreamResumability; readonly lastAcknowledgedSequence: number }

export const executionSurvivalMatrix = Object.freeze({
  CREATED: 'SURVIVES_SESSION_AND_CONNECTION_LOSS', ACCEPTED: 'SURVIVES_SESSION_AND_CONNECTION_LOSS',
  RUNNING: 'SURVIVES_SESSION_AND_CONNECTION_LOSS', WAITING: 'SURVIVES_SESSION_AND_CONNECTION_LOSS',
  PAUSED: 'SURVIVES_SESSION_AND_CONNECTION_LOSS', SUCCEEDED: 'REMAINS_TERMINAL', FAILED: 'REMAINS_TERMINAL',
  CANCELLED: 'REMAINS_TERMINAL', EXPIRED: 'REMAINS_TERMINAL',
} as const);

/** Deterministic in-memory contract fixture; production authority remains the future durable ledger. */
export class SessionContinuity {
  private readonly records = new Map<SessionId, SessionRecord>();
  constructor(private readonly policy: SessionPolicy) {
    if (!Number.isFinite(policy.resumeWindowMs) || policy.resumeWindowMs < 0) throw new Error('resumeWindowMs must be non-negative');
  }
  create(id: SessionId, token: ResumeToken, principalId: string, nowServerMs: number): SessionRecord {
    if (this.records.has(id)) throw new Error('session already exists');
    const record = { sessionId: id, state: 'NEW' as const, generation: sessionGeneration(0), principalId, resumeToken: token, lastAcknowledgedSequence: 0 };
    this.records.set(id, record); return record;
  }
  attach(id: SessionId, connection: ConnectionId, nowServerMs: number): SessionRecord {
    const r = this.require(id); if (r.state === 'EXPIRED' || r.state === 'REVOKED') throw new Error('session is not attachable');
    const next = { ...r, state: 'ACTIVE' as const, attachedConnectionId: connection, generation: sessionGeneration(r.generation + 1), suspendedAtServerMs: undefined, resumeDeadlineServerMs: undefined };
    this.records.set(id, next); return next;
  }
  suspend(id: SessionId, connection: ConnectionId, nowServerMs: number): SessionRecord {
    const r = this.require(id); if (r.attachedConnectionId !== connection) return r;
    const next = { ...r, state: 'SUSPENDED' as const, attachedConnectionId: undefined, suspendedAtServerMs: nowServerMs, resumeDeadlineServerMs: nowServerMs + this.policy.resumeWindowMs };
    this.records.set(id, next); return next;
  }
  resume(request: SessionResumeRequest, principalId: string, nowServerMs: number): ResumeResult {
    const r = this.records.get(request.sessionId); if (!r) return { status: 'NOT_FOUND', reason: 'session does not exist' };
    if (r.state === 'REVOKED') return { status: 'REVOKED', reason: 'session revoked' };
    if (r.state === 'EXPIRED' || (r.resumeDeadlineServerMs !== undefined && nowServerMs > r.resumeDeadlineServerMs)) { this.expire(r.sessionId); return { status: 'EXPIRED', reason: 'resume window elapsed' }; }
    if (r.principalId !== principalId || r.resumeToken !== request.resumeToken) return { status: 'REJECTED', reason: 'resume authorization failed' };
    if (r.attachedConnectionId || request.generation !== r.generation) return { status: 'CONFLICT', reason: 'session attachment generation is stale or occupied' };
    const next = { ...r, state: 'ACTIVE' as const, attachedConnectionId: request.connectionId, generation: sessionGeneration(r.generation + 1), suspendedAtServerMs: undefined, resumeDeadlineServerMs: undefined, lastAcknowledgedSequence: request.lastAcknowledgedSequence };
    this.records.set(r.sessionId, next);
    return { status: 'RESUMED', sessionId: r.sessionId, connectionId: request.connectionId, generation: next.generation, lastAcknowledgedSequence: next.lastAcknowledgedSequence };
  }
  expire(id: SessionId) { const r = this.require(id); const next = { ...r, state: 'EXPIRED' as const, attachedConnectionId: undefined }; this.records.set(id, next); return next; }
  revoke(id: SessionId) { const r = this.require(id); const next = { ...r, state: 'REVOKED' as const, attachedConnectionId: undefined }; this.records.set(id, next); return next; }
  canMutate(id: SessionId, connection: ConnectionId, generation: SessionGeneration) { const r = this.records.get(id); return !!r && r.state === 'ACTIVE' && r.attachedConnectionId === connection && r.generation === generation; }
  get(id: SessionId) { return this.records.get(id); }
  private require(id: SessionId) { const r = this.records.get(id); if (!r) throw new Error('session not found'); return r; }
}
