# MoonWitness ID OAuth 2.1 Resource & Audience Policy

This document defines the canonical OAuth 2.1 / OIDC resource-server and audience (`aud`) contract for MoonWitness ID (`https://id.moonwitness.biz.id`).

Signature, issuer (`iss`), expiry (`exp`), and `token_use` checks prove who minted a token and what type it is, but **audience validation (`aud`)** is what prevents confused-deputy token replay across first-party applications that share the same identity provider.

---

## 1. First-Party OIDC Clients (`apps/mid/src/db.ts`)

All first-party clients are registered in `FIRST_PARTY_CLIENTS` as `public` OAuth 2.1 PKCE (`S256`) clients with allowed scopes `openid profile email offline_access`.

| Client ID            | Product / App                           | Registered Redirect URIs                                                                                                          | Default Minted `aud`   | Permitted RFC 8707 `resource` / `audience` Targets                            |
| -------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| `moonwitness-web`    | MoonWitness Web Console (`apps/web`)    | `https://moonwitness.biz.id/auth/callback`, `https://www.moonwitness.biz.id/auth/callback`, `http://localhost:3000/auth/callback` | `"moonwitness-web"`    | `moonwitness-web`, `moonwitness-api` (`https://api.moonwitness.biz.id`)       |
| `allah-sanctuary`    | ALLAH Sanctuary (`apps/a-l-l-a-h`)      | `https://a-l-l-a-h.com/auth/callback`, `http://localhost:3003/auth/callback`                                                      | `"allah-sanctuary"`    | `allah-sanctuary`, `moonwitness-api` (`https://api.moonwitness.biz.id`)       |
| `igate-console`      | MoonWitness IGate NOC (`apps/igate`)    | `https://igate.moonwitness.biz.id/auth/callback`                                                                                  | `"igate-console"`      | `igate-console`, `rocksoul-igate-worker` (`https://igate.moonwitness.biz.id`) |
| `moonwitness-cli`    | MoonWitness Desktop & CLI (`apps/cli`)  | `http://127.0.0.1/callback`, `http://127.0.0.1:8765/callback`                                                                     | `"moonwitness-cli"`    | `moonwitness-cli`, `moonwitness-api` (`https://api.moonwitness.biz.id`)       |
| `rocksoul-dx`        | ROCKSOUL - DX (`apps/rocksoul`)         | `http://127.0.0.1/callback`, `http://localhost:1420/auth/callback`                                                                | `"rocksoul-dx"`        | `rocksoul-dx`, `moonwitness-api` (`https://api.moonwitness.biz.id`)           |
| `moonwitness-memory` | MoonWitness Memory Deck (`apps/memory`) | `https://memory-edge.moonwitness.biz.id/auth/callback`, `http://localhost:3005/auth/callback`                                     | `"moonwitness-memory"` | `moonwitness-memory` (`https://memory-edge.moonwitness.biz.id`)               |

Custom third-party/partner clients registered via `/api/clients` may request only their own `client_id` as audience. Cross-boundary requests (for example `moonwitness-web` requesting `igate-console` or `moonwitness-memory`) are rejected with `invalid_target`.

---

## 2. Resource Server Audience Matrix

| Resource Server                         | Implementation                                             | Accepted `aud` Policy                                                                                                                    | Configuration Override                                                                              | Rejected Tokens (`401` / `active: false`)                                                                                                                       |
| --------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `moonwitness-api`                       | `apps/api/src/middleware/mid-jwt.ts` (`@moonwitness/core`) | Reviewed interactive API client allowlist: `["moonwitness-web", "moonwitness-cli", "rocksoul-dx", "allah-sanctuary", "moonwitness-api"]` | `MID_ALLOWED_AUDIENCES` (comma-separated; empty fails closed)                                       | `igate-console`, `moonwitness-memory`, unknown clients, missing/empty `aud`, `token_use !== "access"`                                                           |
| `rocksoul-igate-worker`                 | `apps/igate/src/app.ts` (`@moonwitness/core`)              | Dedicated NOC client audience `"igate-console"`                                                                                          | `IGATE_CLIENT_ID` (defaults to `"igate-console"`)                                                   | `moonwitness-web`, `allah-sanctuary`, `moonwitness-cli`, `rocksoul-dx`, `moonwitness-memory`, missing/empty `aud`, `token_use !== "access"`                     |
| `moonwitness-memory`                    | `apps/memory/backend/app/auth.py` & `config.py`            | Dedicated Memory audience `"moonwitness-memory"`                                                                                         | `MID_AUDIENCE` (default `"moonwitness-memory"`), optional `MID_ALLOWED_AUDIENCES` (comma-separated) | `moonwitness-web`, `igate-console`, `rocksoul-dx`, `allah-sanctuary`, `moonwitness-cli`, missing/empty/malformed `aud`, `token_use !== "access"`                |
| MID UserInfo (`/oauth/userinfo`)        | `apps/mid/src/app.ts`                                      | Any valid MID-issued access token with `openid` scope                                                                                    | —                                                                                                   | ID tokens (`token_use !== "access"`), expired/invalid tokens                                                                                                    |
| MID Introspection (`/oauth/introspect`) | `apps/mid/src/app.ts`                                      | Caller-bound access-token verification (see Section 4)                                                                                   | `MID_ALLOWED_AUDIENCES` (for `moonwitness-api` caller)                                              | Unauthenticated or public callers (`401`), wrong-audience access tokens (`active: false`), ID tokens (`active: false`), expired/forged tokens (`active: false`) |

### Dedicated API Audience vs Allowlist Mode for `moonwitness-api`

`moonwitness-api` uses a **reviewed interactive client allowlist** (`moonwitness-web`, `moonwitness-cli`, `rocksoul-dx`, `allah-sanctuary`, `moonwitness-api`) by default so existing browser/CLI PKCE flows continue without breaking while still isolating high-privilege NOC tokens (`igate-console`), local Memory Deck tokens (`moonwitness-memory`), and arbitrary unknown client tokens.

When all API callers migrate to sending `resource=moonwitness-api`, operators can switch `moonwitness-api` to strict dedicated-audience mode without code changes by setting:

```sh
MID_ALLOWED_AUDIENCES=moonwitness-api
```

---

## 3. Single & Multi-Audience Semantics (`string | string[]`)

Per RFC 7519 Section 4.1.3, the JWT `aud` claim may be either:

- A single non-empty string (for example `"igate-console"`), or
- A non-empty JSON array of non-empty strings (for example `["moonwitness-web", "moonwitness-api"]`).

All verifiers (`verifyEs256Jwt` in `packages/core/src/oidc.ts`, `apps/mid/src/crypto.ts`, and `verify_es256_jwt` in `apps/memory/backend/app/auth.py`) enforce:

1. **Intersection semantics**: At least one valid audience string in `claims.aud` must appear in `expectedAudience` (`string | readonly string[]`).
2. **Fail-closed empty config**: Passing an empty string `""` or empty array `[]` (or whitespace-only entries) as `expectedAudience` always rejects (`null` / `TokenVerificationError`).
3. **Malformed claim rejection**: Missing `aud`, empty string `""`, empty array `[]`, non-string scalars, or arrays containing non-string / blank elements are always rejected.
4. **Authorized Party (`azp`)**: When `apps/mid` mints a multi-audience access token (e.g. `["moonwitness-web", "moonwitness-api"]`), it sets `azp` to the requesting `client_id` (`"moonwitness-web"`).

---

## 4. ID-Token vs Access-Token Isolation (`token_use`)

Every JWT signed by MoonWitness ID includes an explicit `token_use` claim:

- **Access tokens (`token_use: "access"`)**:
  - Short-lived (`ACCESS_TOKEN_TTL_SEC`, default `900` seconds).
  - `aud` is the client ID or `[client_id, approved_resource]` when an approved RFC 8707 `resource` / `audience` is requested.
  - Accepted by resource servers (`moonwitness-api`, `rocksoul-igate-worker`, `moonwitness-memory`), `/oauth/userinfo`, and `/oauth/introspect`.
- **ID tokens (`token_use: "id"`)**:
  - Issued solely for Relying Party identity assertion (`ID_TOKEN_TTL_SEC`, default `3600` seconds).
  - `aud` is **strictly pinned** to the Relying Party `client_id` (never expanded to resource servers) and carries `nonce` when supplied.
  - **Rejected by every resource server** (`401`), `/oauth/userinfo` (`401`), and `/oauth/introspect` (`{ "active": false }`).

---

## 5. Introspection Caller Binding (`/oauth/introspect`)

Per RFC 7662, `/oauth/introspect` MUST NOT act as an unauthenticated token oracle or allow one client to probe tokens issued for another security domain:

1. **Caller authentication required**: Only `confidential` clients authenticated via HTTP Basic (`client_id:client_secret`) or POST body (`client_id` + `client_secret`) may call `/oauth/introspect`. Missing credentials, bad secrets, or `public` clients receive `401 invalid_client`.
2. **Access-token isolation**: Only `token_use === "access"` tokens can be active. ID tokens return HTTP `200` with `{ "active": false }`.
3. **Caller audience binding**:
   - `moonwitness-api` may introspect tokens whose `aud` intersects `MID_ALLOWED_AUDIENCES` (default `["moonwitness-web", "moonwitness-cli", "rocksoul-dx", "allah-sanctuary", "moonwitness-api"]`).
   - `rocksoul-igate-worker` may introspect tokens whose `aud` intersects `["igate-console", "rocksoul-igate-worker"]`.
   - `moonwitness-memory` may introspect tokens whose `aud` contains `"moonwitness-memory"`.
   - Any other confidential client `<client_id>` may introspect **only** tokens whose `aud` contains `<client_id>`.
4. **Optional `resource` / `audience` narrowing**: If the caller supplies `resource` or `audience` in the introspection POST body, it must belong to the caller's authorized audience set above; otherwise `/oauth/introspect` returns `{ "active": false }`. It can narrow the check, never widen it.

---

## 6. RFC 8707 `resource` / `audience` Flow

Clients may optionally include `resource` (or `audience`) on `GET/POST /authorize` and `POST /oauth/token`:

- Known resource indicator URIs map deterministically to canonical logical audiences:
  - `https://api.moonwitness.biz.id` → `moonwitness-api`
  - `https://igate.moonwitness.biz.id` → `rocksoul-igate-worker`
  - `https://memory-edge.moonwitness.biz.id` → `moonwitness-memory`
- Target validation runs at `/authorize` and `/oauth/token`:
  - Unapproved or unknown targets fail with `invalid_target`.
  - Authorization codes and refresh-token families persist their bound `resource`; subsequent token exchange or refresh requests cannot escalate to a different resource not approved in the original grant.

---

## 7. Key Rotation & Fail-Closed Verifiers

All resource servers verify ES256 (`P-256`) signatures, normalized issuer (`iss`), expiration (`exp`), not-before (`nbf` when present), subject (`sub`), `token_use`, and `aud`:

- JWKS endpoints (`/.well-known/jwks.json`) are cached with a bounded TTL (`300s`).
- Encountering an unseen `kid` triggers an immediate JWKS refresh so zero-downtime key rotation works without waiting for TTL expiry, while repeated unknown `kid` lookups within the same cache epoch are suppressed to avoid upstream amplification.
- JWKS fetch failures, malformed JWKs, missing `kid`s, and empty audience allowlists always fail closed (`401`).
