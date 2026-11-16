export interface ExecutionContext {
  requestId: string;
  /** Canonical AEP execution identity when the request is executed through AEP. */
  executionId?: string;
  userId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
  repositoryId?: string | null;
  workspaceId?: string | null;
  permissions?: string[];
  idempotencyKey?: string;
  abortSignal?: AbortSignal;
  metadata?: Record<string, unknown>;
}

export function createExecutionContext(params: Partial<ExecutionContext> & { requestId: string }): ExecutionContext {
  return {
    requestId: params.requestId,
    executionId: params.executionId,
    userId: params.userId ?? null,
    organizationId: params.organizationId ?? null,
    projectId: params.projectId ?? null,
    repositoryId: params.repositoryId ?? null,
    workspaceId: params.workspaceId ?? null,
    permissions: params.permissions ?? [],
    idempotencyKey: params.idempotencyKey,
    abortSignal: params.abortSignal,
    metadata: params.metadata ?? {},
  };
}
