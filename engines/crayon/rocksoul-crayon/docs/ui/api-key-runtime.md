# API key runtime

API key management uses the existing `/api/v1/auth/api-keys` boundary. The list endpoint returns only non-secret metadata for the authenticated owner; creation returns the raw secret once; revoke is server-scoped to the authenticated owner and marks the key inactive. Scope authorization is enforced by the backend authorization kernel, so the UI does not grant or infer authority.
