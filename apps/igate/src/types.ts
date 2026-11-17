export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean }>;
}

export interface D1DatabaseLike {
  prepare(sql: string): D1PreparedStatementLike;
  batch?(statements: D1PreparedStatementLike[]): Promise<unknown[]>;
}

export interface IgateEnv {
  readonly DB?: D1DatabaseLike;
  readonly MID_ISSUER_URL?: string;
  readonly MID_JWKS_URL?: string;
  readonly IGATE_CLIENT_ID?: string;
  readonly CORS_ORIGINS?: string;
}

export interface IgateNodeRecord {
  readonly id: string;
  readonly name: string;
  readonly targetUrl: string;
  readonly category: string;
  readonly enabled: boolean;
  readonly createdAt: string;
}

export interface IgateProbeEventRecord {
  readonly id: string;
  readonly nodeId: string;
  readonly statusCode: number;
  readonly ok: boolean;
  readonly latencyMs: number;
  readonly actorSub: string;
  readonly checkedAt: string;
}
