# 05 — Shared Component and UX System

## System rule

A shared component is a stable contract, not just a file in `components/`. It should have clear semantics, typed props, accessible behavior, composable slots, predictable variants, and real use in at least one application screen. Reuse it across screens where the pattern is genuinely the same.

Before introducing a component, search the current codebase and existing package exports. Extend or compose an existing pattern before creating a second version.

## API design principles

- Prefer semantic props (`tone`, `size`, `density`, `variant`, `status`, `orientation`) over arbitrary booleans.
- Avoid prop explosions and deeply nested conditional class logic.
- Use slots/children for composition when layout should remain controlled by the consumer.
- Use CVA or the existing variant utility for a small finite set of styles.
- Expose `className` only as an intentional escape hatch; shared semantic variants remain the default.
- Separate behavior from decoration. The theme preset controls tokens; the component controls its semantics and supported variants.
- Reuse accessible Base UI primitives already installed where suitable. Add wrappers and R!OT styling rather than reimplementing focus, popover, dialog, menu, and keyboard logic.

## Page composition family

### `PageHeader`

Purpose: consistent page title area with optional eyebrow, description, breadcrumbs, status, actions, and art treatment.

Suggested contract:

```ts
type PageHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  accessory?: React.ReactNode;
  treatment?: 'plain' | 'editorial' | 'poster' | 'industrial';
  density?: 'compact' | 'comfortable';
};
```

Do not require every page to use a poster header. Keep a compact variant for dense operational screens.

### `PageContainer`, `PageSection`, `PageToolbar`, `PageActions`

Own page width, vertical rhythm, section heading, toolbar placement, responsive action layout, and consistent spacing. Avoid repeating the same outer wrappers and hard-coded margins in every route.

## Metric and insight family

- `MetricCard`: label, value, optional trend/comparison, icon/art slot, semantic tone, and optional chart/sparkline.
- `MetricGrid`: responsive layout with explicit column or density presets.
- `MetricTrend`: direction, delta, context period, and accessible text.
- `MetricComparison`: prior-period or target comparison.
- `StatOverview`: composition of a group of related metrics.

The value remains the strongest data element. Artwork and decorative overlays must not reduce scan speed. Do not treat `0` as missing data. Format numeric values through a shared formatter or explicit caller formatting.

## Panel family

- `Panel`: semantic surface, header/body/footer slots, optional title and actions.
- `PanelHeader`: title, description, metadata, actions, optional graphic label.
- `PanelBody`: content wrapper with predictable padding and responsive behavior.
- `PanelFooter`: summary or action region.
- `PanelToolbar`: filters and view actions.

Use a typed `treatment`: `default | outlined | offset | xerox | industrial | poster`. Do not let the treatment change semantics.

## Data-display family

- `DataTable`: accessible table or existing mature data-grid abstraction.
- `DataTableToolbar`: search, filters, saved views, density and column controls as implemented.
- `DataTableEmpty`, `DataTablePagination`, `DataTableColumnVisibility`.
- `RecordRow`: reusable compact record layout with identity, metadata, status and action slots.
- `ActivityFeed` and `Timeline`: chronological activity patterns.
- `StatusBadge` and `PriorityBadge`: shared semantic status mapping.

Data tables need clear column headings, responsive behavior, sorting labels, empty/loading/error states, keyboard interaction, and horizontal overflow handling on smaller viewports. Do not pretend a visual table has sorting/filtering when no behavior exists.

## Navigation and application shell

- `AppShell`: composes sidebar, topbar, content frame, mobile navigation and optional utility rail.
- `Sidebar`: supports expanded, collapsed, mobile drawer, nested groups, active state, badges, and accessible labels.
- `Topbar`: global search/command, breadcrumbs or context, notifications, theme/settings, and account menu.
- `BreadcrumbNavigation`: derived from typed route metadata where possible.
- `CommandMenu`: searchable actions and navigation, with keyboard shortcut guidance.
- `ThemeSettingsPanel`: theme preset, light/dark/system, chaos intensity, density, sidebar mode, motion, and RTL if supported.

Navigation data belongs in a typed schema. Do not duplicate menu arrays in each console. Route-to-nav mapping should be tested or type-checked where possible.

## Feedback and state components

Required patterns:

- `EmptyState` with title, explanation, optional original illustration, and one clear action.
- `LoadingState` and `Skeleton` consistent with reduced-motion settings.
- `ErrorState` with human-readable context, retry only when retry is real, and optional diagnostic details in a disclosure.
- `ConfirmDialog` for destructive or consequential actions.
- `Toast`/notification with sensible duration and accessible announcement.
- `InlineAlert`, `Progress`, `Tooltip`, `Popover`, `Dialog`, `Drawer`, and `DropdownMenu` where needed.

## Theme and style variants

A component should consume semantic tokens and a limited set of variants. Example:

```ts
type RiotTreatment = 'clean' | 'brutal' | 'xerox' | 'industrial' | 'poster';
type RiotDensity = 'compact' | 'comfortable';
type RiotTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
```

Use these types only where they make sense. Do not add every variant to every component. Keep component semantics independent from the active theme preset.

## Styling constraints

- Use tokens for color, border, spacing, typography, radius, elevation, texture, and motion.
- Avoid arbitrary color literals in feature modules.
- Avoid one-off selectors targeting other components or route names.
- Prefer component-scoped styles/utilities over global selectors.
- Use CSS custom properties for theme values and data attributes for preset/intensity/mode.
- Make decoration a separate layer (`aria-hidden="true"`, non-interactive, pointer-events none).
- Provide a texture-free/low-intensity presentation for data-heavy pages and reduced-motion users.

## Shared component acceptance checklist

- [ ] Has a clear purpose and API.
- [ ] Uses semantic HTML and accessible interaction primitives.
- [ ] Uses design tokens, not hard-coded feature colors.
- [ ] Has finite, documented visual variants.
- [ ] Behaves correctly in all supported themes and light/dark modes.
- [ ] Works on narrow and wide viewports.
- [ ] Supports keyboard/focus and reduced motion when relevant.
- [ ] Has loading/empty/error state support when relevant.
- [ ] Has at least one real consumer in the demo app.
- [ ] Has a showcase example or documentation entry.
