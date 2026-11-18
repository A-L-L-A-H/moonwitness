# MOONWITNESS — ATOMIC UI DESIGN SYSTEM & SKIN ENGINE GUIDE

Canonical documentation for `@moonwitness/ui` (`packages/ui`).

## 1. Architecture Overview

Every visual surface flows through one deterministic pipeline:

```text
Master DNA Identity (7 Worlds: 01..09)
  → Theme Mode (dark | light | system)
    → Skin Preset (default | riot | editorial | technical | archive | transmission)
      → Semantic & Component Tokens (canonical.ts)
        → Browser-Valid CSS Custom Properties (--dna-*, --background..--ring, --mw-*, --radius)
          → Component Rendering (forwardRef, ARIA, Skin-Aware)
```

### Separation of Concerns

- **DNA Identity (`SkinRoot` / `SkinScope`)**: World identity & palette (`01-imperium-lumen`, `02-lunar-chronicles`, `03-rocksoul`, `04-nexus-paradox`, `05-riot-anarchy`, `06-mycelium`, `09-simpul-nusantara`).
- **Skin Preset (`SkinProvider` / `useSkin`)**: Structural treatment (`default`, `riot`, `editorial`, `technical`, `archive`, `transmission`) controlling radii, border widths, typography register, and shadows.
- **Theme Mode (`useThemeMode`)**: `dark`, `light`, or SSR-safe `system` with live OS `prefers-color-scheme` change listener.
- **Component Variant (`variant`, `size`)**: Functional hierarchy (`default`, `secondary`, `outline`, `ghost`, `destructive`, `link`, `dna`, `imperiumPrimary`, `imperiumSecondary`).

---

## 2. Installation & Package Exports

```ts
// Core, P0, P1, Primitives & Composites
import {
  Button,
  Input,
  Card,
  Badge,
  Dialog,
  AlertDialog,
  Select,
  Tabs,
  Checkbox,
  Table,
  DataTable,
  Breadcrumb,
  Toaster,
  toast,
  SkinProvider,
  SkinRoot,
} from "@moonwitness/ui";

// Server-safe pure token modules (zero React / zero "use client")
import { IMPERIUM_LUMEN_TOKENS, imperiumLumenCssVariables } from "@moonwitness/ui/tokens";

import {
  resolveCanonicalTokens,
  canonicalTokensToCssVariables,
  BRAND_TOKENS,
} from "@moonwitness/ui/dna";
```

### CSS Entrypoints

```css
/* Apps consuming zine + multi-skin shadcn components (e.g. apps/web) */
@import "@moonwitness/ui/theme.css";
@import "@moonwitness/ui/base.css";

/* Imperium Lumen / A-L-L-A-H scoped storefront experience */
@import "@moonwitness/ui/skins/imperium.css";
```

`base.css` scopes global `html`/`body`/scrollbar styles cleanly away from `[data-dna="01-imperium-lumen"]`.

---

## 3. Component Catalog

- **Core**: `Button`, `Input`, `Textarea`, `Label`, `Checkbox`, `Switch`, `RadioGroup`, `Select`, `Slider`, `Toggle`, `ToggleGroup`, `Badge`, `Avatar`, `Card`, `Separator`, `Skeleton`, `Alert`, `Progress`, `Table`
- **Overlay**: `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `Popover`, `HoverCard`, `Tooltip`, `DropdownMenu`, `ContextMenu`
- **Navigation**: `Tabs`, `Accordion`, `Collapsible`, `Breadcrumb`, `Pagination`, `NavigationMenu`, `Menubar`
- **Advanced & Composed**: `Command` (+ `CommandDialog`), `Combobox`, `Calendar`, `DatePicker`, `Carousel`, `InputOTP`, `Resizable`, `AspectRatio`, `Toast` / `Toaster`, `Form`, `Field`, `DataTable`, `Empty`, `Kbd`, `Chart` (`ChartContainer`, `BarChart`), `Typography`, `Prose`

---

## 4. Skin, DNA & Theme Composition Example

```tsx
import {
  SkinRoot,
  SkinProvider,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@moonwitness/ui";

export function WorldActionPanel() {
  return (
    <SkinRoot dnaId="01-imperium-lumen" mode="dark">
      <SkinProvider defaultSkin="riot" scope="local" persist={false}>
        <Card>
          <CardHeader>
            <CardTitle>Imperium Telemetry</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="default">Inspect World</Button>
          </CardContent>
        </Card>
      </SkinProvider>
    </SkinRoot>
  );
}
```

---

## 5. Accessibility & Motion Guarantees

- **WCAG 2.1/2.2 AA Contrast**: Verified automatically in `pnpm ui:contrast` (`dx/contrast.test.ts`) for **all 7 DNAs in both dark and light modes**.
- **Touch Targets**: Interactive primitives (`Button`, `Input`, `SelectTrigger`, `TabsList`, `PaginationPrevious`, `PaginationNext`, `PaginationLink`) enforce `>= 44px` (`min-h-11`).
- **Accessible Labeling & Keyboard**: All close controls carry `aria-label="Close"` / `sr-only`; `Accordion`, `Command`, `Carousel`, `ResizableHandle`, `SideRail`, and Radix overlays implement full arrow/Escape/Enter keyboard contracts.
- **Reduced Motion**: `imperium.css`, `dna-base.css`, `base.css`, and `Carousel`/`Skeleton`/`MotionReveal` honor `@media (prefers-reduced-motion: reduce)`.

---

## 6. Server Component Compatibility

- Safe in React Server Components (`app/**/page.tsx`, metadata, API/SSR):
  - `@moonwitness/ui/tokens`
  - `@moonwitness/ui/dna`
  - `layout/*`, `artwork/*`
- Client Components (`"use client"`):
  - `SkinProvider`, `SkinRoot`, `SkinScope`, `useSkin`, `useThemeMode`, `Skinned.*`, and all interactive components under `components/ui/*`.
- `resolveThemeMode("system")` and `applyTheme()` guard `window`/`document`/`matchMedia` for Node SSR without throwing `ReferenceError`.

---

## 7. Migration & Extension Guidance

1. **Zero Local Duplicates**: Never re-declare `Button`, `Input`, `Textarea`, `Select`, `Card`, `Badge`, or local `:root` palette colors inside consumer apps — import from `@moonwitness/ui`.
2. **Adding a Component**: Consume `useComponentSkin(skin)`, forward refs with `React.forwardRef`, spread `data-skin` & `data-dna`, avoid hex literals (use `var(--...)`), export from `packages/ui/src/index.ts`, and add contract + keyboard + multi-skin Vitest coverage.
