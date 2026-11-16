# Structured Error Model Specification
**Application Execution Protocol (AEP)**
*Specification Version: 1.1.0-normative*

---

## 1. Unified Error Envelope

Errors in AEP are modeled as first-class structured envelopes transmitted via `DATA` or `CLOSE` frames with `flags.ERROR_PAYLOAD` (`0x0020`):

```typescript
export interface AppError {
  /** Machine-readable error code (e.g. "CAPABILITY_NOT_FOUND") */
  readonly code: string;

  /** Standardized high-level error classification */
  readonly category: ErrorCategory;

  /** Safe, human-readable description for UI presentation */
  readonly message: string;

  /** Whether the operation can be safely retried with same idempotencyKey */
  readonly retryable: boolean;

  /** Whether the error condition is expected to resolve shortly */
  readonly temporary: boolean;

  /** Correlation request ID */
  readonly requestId: string;

  /** Target execution identifier if failure occurred within an execution */
  readonly executionId?: string;

  /** Structured validation errors or context details */
  readonly details?: Record<string, unknown>;

  /** Causation trace ID for debugging */
  readonly causeId?: string;
}
```

---

## 2. The 12 Canonical Error Categories

| Category | Typical Scenarios | Retryable? |
|---|---|---|
| **`VALIDATION`** | Malformed input schema, type mismatch, invalid field values. | ❌ No |
| **`AUTHENTICATION`** | Expired session token, revoked API key, invalid signature. | ❌ No (Re-auth first) |
| **`AUTHORIZATION`** | Insufficient capability permissions, cross-tenant resource access. | ❌ No |
| **`NOT_FOUND`** | Unknown `capabilityId`, deleted task ID, missing project. | ❌ No |
| **`CONFLICT`** | Version optimistic lock failure, idempotency payload divergence. | ❌ No |
| **`RATE_LIMIT`** | Stream frame burst exceeded, execution quota exhausted. | ✅ Yes (Back off) |
| **`TIMEOUT`** | Execution deadline exceeded, upstream AI response timeout. | ✅ Yes |
| **`TRANSPORT`** | Physical socket drop, TLS handshake error, packet corruption. | ✅ Yes (Auto-resume) |
| **`PROTOCOL`** | Magic byte mismatch, invalid sequence number, illegal state transition. | ❌ No (Fatal) |
| **`EXECUTION`** | Domain business logic threw handled exception in executor. | Context-dependent |
| **`DEPENDENCY`** | External tool, SQLite lock, or provider/runtime service unavailable. | ✅ Yes (Exponential backoff) |
| **`INTERNAL`** | Unhandled server panic, memory allocation failure. | ❌ No (Inspect logs) |

---

## 3. Production Sanitization & Security Bounds

> [!CAUTION]
> **Information Leakage Prevention**:
> In production environments (`NODE_ENV === 'production'`), error envelopes **MUST NEVER** expose:
> - Raw V8 stack traces.
> - Physical server filesystem paths (e.g. `X:\REPO\...`).
> - Raw SQL query strings or internal LibSQL driver errors.
> 
> Detailed diagnostics are captured exclusively on the backend `TelemetryCollector` / Pino logger, correlated via `requestId` and `causeId`.
