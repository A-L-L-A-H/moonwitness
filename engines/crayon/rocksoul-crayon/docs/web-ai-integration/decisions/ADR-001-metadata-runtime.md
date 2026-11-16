# ADR-001: Metadata-Driven UI Runtime Architecture

## Status
ACCEPTED — superseded in part by the backend-authoritative normalization boundary below.

## Context
The application needs to render diverse domain views (Projects, Tasks, Users, Mail, Chat, and AI Workspaces) while avoiding bespoke, monolithic, and duplicate page implementations. We also need standard components (Tables, Kanban boards, Detail cards, Forms) to be configurable via strongly typed declarative definitions.

## Decision
We implemented a dynamic UI Runtime in `apps/web/src/ui-runtime/`:
1. **Metadata Contracts**: Defined using Zod schemas for `ResourceDefinition`, `FieldDefinition`, `ViewDefinition`, and `ActionDefinition`.
2. **Registry Pattern**:
   - `ResourceRegistry`: Single source of truth for resource specifications.
   - `RendererRegistry`: Composable mapping between view/field types and React component renderers.
3. **Generic Renderers**: `TableRenderer`, `KanbanRenderer`, `FieldRenderer` consuming normalized metadata.

## Consequences
- **Positive**: Adding a new domain resource or view requires writing a declarative schema rather than scaffolding new pages, components, and hooks from scratch.
- **Positive**: Consistent UX across all entity types, automatic search, sorting, and AI quick actions.
- **Negative**: Dynamic field rendering requires schema typing to be kept aligned with backend model definitions.

## Phase 6 amendment: backend metadata is navigation/resource authority

The backend model registry and AutoMenu are authoritative for model-backed
navigation, table, form, and relation metadata. The browser normalizes and
validates that data before rendering; it does not execute metadata, dynamically
import components, or recreate model definitions. Specialized and system pages
remain explicit implementation registries, not a competing model menu source.

The legacy `ui-runtime` resource registry remains a migration artifact. New
generic resource pages use `metadata-runtime` and `@rocksoul/sdk`'s injected
model-client facade. The HTTP adapter is temporary until the application
runtime exposes the same resource capabilities through AEP.
