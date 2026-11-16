# Metadata-Driven UI Runtime

## Authority map

| Concern | Authority | Browser role |
| --- | --- | --- |
| Resource menu | ORM model registry `getMenu()` | Normalize, cache, render safely |
| Model/table/form/relation metadata | ORM model registry `/:model/metadata` | Validate and interpret |
| Static/system routes | React route configuration | Implementation mapping |
| Specialized pages | Explicit specialized registry | Implementation mapping, not resource menu authority |
| CRUD transport | `@rocksoul/sdk` `ModelClient` facade | Inject existing HTTP adapter temporarily |
| Capability authorization/execution | Server/runtime | Display-only availability; never client authority |

## Runtime flow

`AutoMenu → modelClient → MetadataRuntimeProvider → normalized NavigationGroup → AppSidebar`.

`route/model → ModelClient.metadata + ModelClient.list → MetadataNormalizer → ResourceResolver → ResourcePage → MetadataTable / MetadataForm`.

The first generic proofs are `/projects` and `/users`, including user-friendly
detail URLs (`/projects/:id`, `/users/:id`). `ResourcePage` uses the generic
SDK client for server-side pagination, search, sortable metadata columns,
create, update, delete with confirmation, and metadata-defined detail/form
presentation. AI, Chat, Calendar, and system routes stay specialized; Tasks
remains a legacy Kanban/table migration surface. Route classification is
`RESOURCE_ROUTE`, `SPECIALIZED_ROUTE`, `SYSTEM_ROUTE`, or `STATIC_ROUTE`.

Resource tables and metadata forms use a 40px mobile control baseline; native
checkboxes and radios receive a larger visual target on coarse-pointer devices.
Column visibility/order and saved views remain local preferences, while server
list responses are sequence-guarded so stale searches or pagination loads cannot
overwrite newer results.

Visible resource rows can be exported as an escaped CSV using the current
column visibility/order; when rows are selected, only those rows are exported.
Relation fields with `relationModel` use a debounced, server-backed search
window (20 results) and announce loading or lookup failures without treating
the browser as an authorization boundary.

## Safety and fallbacks

Metadata is data. Zod validation rejects malformed menu/model structures, an
unknown icon resolves to `Box`, and unknown table renderer values render as safe
text. A malformed resource reports local page failure without crashing sidebar
or shell. No metadata permits imports, HTML, JavaScript, or React components.

The metadata cache is provider-local and fetched once per application mount;
it is an optimization only and never authorization truth. Menu, metadata, and
resource data each expose loading/ready/error state. Browser credentials must
be supplied by the existing authenticated application configuration; no default
No development master key is bundled. The transitional `model-client.ts` adapter
is the only compatibility HTTP boundary and is never imported by feature pages.

## Migration status

`apps/web/src/lib/api-client.ts` remains temporarily for auth and legacy AI/
feature calls. Projects and Users now consume generic metadata through the SDK
facade. Tasks, Mail, Chat, Calendar, and AI workspaces remain legacy or
specialized until each can migrate without losing product-specific UX.
