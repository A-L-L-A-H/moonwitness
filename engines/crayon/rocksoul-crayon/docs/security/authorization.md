# Server Authorization Boundary

## Authority and semantics

Authentication establishes an identity; `apps/api/src/security/authorization.ts` independently authorizes every generic model operation. The policy is server-owned and fail-closed: unknown roles, models, actions, malformed API-key scopes, and missing principals are denied. `401` means no valid credential; `403` means an authenticated identity lacks permission.

Canonical security roles are exact lowercase `admin` and `user`. Historical display labels such as `Admin`, `Editor`, and `Subscriber` are not security roles and are denied until migrated through a trusted provisioning path.

Public registration always creates the safe `user` role. A supplied `role` field is ignored for compatibility and never changes the stored role.

## Initial policy matrix

| Resource class | Models | user | admin |
| --- | --- | --- | --- |
| Business | `projects`, `tasks` | read, create, update; no delete | manage |
| Security | `users` | self read/update only; protected fields cannot change | manage |
| Security | `api_keys`, `user_sessions` | no generic access | no generic access; dedicated auth routes only |
| System | `system_logs` | no access | read only |
| Configuration | organizations, settings, marketing, pricing | no access | manage |
| Other registered business models | calendars, chat, mail, project tasks | no access until a record-scope policy exists | manage |

`manage` is the policy-level administrative capability; generic CRUD routes evaluate concrete `read`, `create`, `update`, and `delete` actions. Registry presence and UI metadata do not grant access. Discovery and AutoMenu expose only resources with collection-level read access.

## API keys

API keys are bound to an active user principal. Requested scopes use `resource:action`, are validated against the known server resource policy, must be nonempty and unique, and must be a subset of the issuing principal's effective permissions. Wildcard scopes are not issuable through the endpoint. At request time both role policy and API-key scope must allow the action.

Raw key material remains a one-time response and is never logged. Generic CRUD does not expose API-key or session records.

## Security inventory

| Surface | Authentication | Authorization | Owner |
| --- | --- | --- | --- |
| Registration | public | fixed `user` role | auth route |
| Login/session | bearer session | active normalized role | auth plugin |
| Models/menu/metadata | bearer or API key | discovery/read policy | model route + kernel |
| Generic CRUD | bearer or API key | resource/action/record scope policy | model route + kernel |
| User management | bearer or API key | self scope or admin | kernel |
| API-key issuance | authenticated principal | requested-scope intersection | auth route + kernel |

Record scopes currently support `all`, `self`, and `none`; organization and owner scopes are reserved until their data ownership contracts are explicit.
