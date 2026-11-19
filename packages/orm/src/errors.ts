export class ConflictError extends Error {
  readonly code = "CONFLICT_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export type PolicyErrorCode =
  | "TENANT_REQUIRED"
  | "TENANT_MISMATCH"
  | "RULE_FORBIDDEN"
  | "INVALID_RULE_DOMAIN"
  | "FIELD_WRITE_FORBIDDEN"
  | "FIELD_READ_FORBIDDEN";

export class PolicyError extends Error {
  readonly code: PolicyErrorCode;
  readonly statusCode: number;

  constructor(message: string, code: PolicyErrorCode, statusCode = 403) {
    super(message);
    this.name = "PolicyError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
