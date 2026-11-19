# @moonwitness/ui

Shared MoonWitness Design DNA skin engine, tokens, primitives, composites, artwork wrappers, icons, and accessibility/architecture DX checks (`@moonwitness/ui`).

## Architecture & Exports (`package.json`)

- **Core Entry (`.`):** `./src/index.ts` — primitives (`ZineButton`, `Sticker`, `Tape`, `ZineCard`, `WitnessAvatar`, `RansomText`, `ComicPanel`, etc.), composites (`EventCard`, `EventDetail`, `ConsoleShell`, `WorldMap`, `ScenePage`, etc.), and `cn` utility.
- **DNA & Skins (`./dna`, `./skin`, `./imperium`, `./tokens`, `./imperium-icons`):** Multi-world `[data-dna]` scoping, tokens, and presets plus shared stylesheets (`./theme.css`, `./base.css`, `./skins/dna-base.css`, `./skins/imperium.css`).
- **Layout, Artwork & Icons (`./layout`, `./artwork`, `./icons`):** Grid/stack/container primitives, generative/vector artwork scenes, and shared icon mappings.
- **DX & Quality Tooling (`./docs-cli`, `src/dx/`):** Automated contrast checks (`contrast.test.ts` -> `pnpm ui:contrast`) and package architecture boundary tests (`architecture.test.ts`).


## Canonical token and skin runtime

Use the canonical resolver and skin boundary for new consumer code. The package keeps separate public entry points because token resolution is server-safe while the React skin runtime is client-side.

| Public entry point       | Canonical responsibility                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@moonwitness/ui/tokens` | Base Imperium Lumen brand/semantic token definitions and server-safe base CSS variable map (`IMPERIUM_LUMEN_TOKENS`, `imperiumLumenCssVariables`). |
| `@moonwitness/ui/dna`    | Server-safe DNA/skin/mode/density resolution (`resolveCanonicalTokens`, `canonicalTokensToCssVariables`) and canonical token types.                |
| `@moonwitness/ui/skin`   | Client-side visual scope and state APIs: `SkinRoot`, `SkinScope`, `SkinProvider`, `useSkin`, `useThemeMode`, and presets.                          |

Use `SkinRoot` once at an application's visual root. Use `SkinScope` for a deliberately different DNA/skin presentation inside a route or subtree. Add `SkinProvider` when the application needs the interactive React context, persistence, or `useSkin` controls; it is a state provider, not a replacement for the app's visual identity boundary.

```tsx
import type { ReactNode } from "react";
import { SkinRoot } from "@moonwitness/ui/skin";

export function AppRoot({ children }: { children: ReactNode }) {
  return (
    <SkinRoot
      dnaId="05-riot-anarchy"
      skin="riot"
      mode="dark"
      density="comfortable"
    >
      {children}
    </SkinRoot>
  );
}
```

For server-side token calculation or explicit CSS-variable output, use the pure resolver rather than reading from the browser or reaching into package source files:

```ts
import {
  canonicalTokensToCssVariables,
  resolveCanonicalTokens,
} from "@moonwitness/ui/dna";

const resolved = resolveCanonicalTokens({
  dnaId: "05-riot-anarchy",
  skin: "riot",
  mode: "dark",
  density: "comfortable",
});

const cssVariables = canonicalTokensToCssVariables(resolved);
```

Import from these package entry points (or the equivalent public root exports); do not import from `packages/ui/src/**` in consuming applications.

## Legacy DNA registry compatibility

The `@moonwitness/ui/dna` and root `@moonwitness/ui` entry points still export the earlier `DNATokens` registry API:

- `getToken` / `resolveToken` read paths from a legacy `DNATokens` theme object.
- `createTheme`, `defaultTheme`, `themeRegistry`, `getTheme`, and `listThemes` manage the legacy theme set.
- `generateCSSVariables` builds the legacy `--mw-*` and shadcn-compatible variable block.
- `applyTheme` injects that generated block into a document-level style element; it is not a scoped replacement for `SkinRoot` or `SkinScope`.

These exports are retained for compatibility; this documentation does not remove or formally deprecate them. Do not introduce new application callers for the legacy global theme-injection path. Use the canonical resolver and scoped skin runtime for new work. Existing consumers should migrate in a separately scoped change so their behavior and CSS ownership can be verified.

Known repository usage at the time of this review:
- `apps/web/src/components/theme-bootstrap.tsx` still calls `applyTheme(defaultTheme)`.
- The package's DX token inspector and documentation generator still use `generateCSSVariables` to display legacy-theme output.
- The canonical resolver is implemented by `packages/ui/src/dna/canonical` and is consumed by the skin runtime; keep its public usage through `@moonwitness/ui/dna`.

## Dependencies

- Workspace: `@moonwitness/assets`, `@moonwitness/avatars`, `@moonwitness/contracts`
- External: `20` `@radix-ui/react-*` primitive packages, `class-variance-authority`, `clsx`, `tailwind-merge`

## Scripts

```sh
pnpm --filter @moonwitness/ui lint         # eslint src
pnpm --filter @moonwitness/ui typecheck    # tsc --noEmit
pnpm --filter @moonwitness/ui test         # vitest run
pnpm --filter @moonwitness/ui ui:contrast  # vitest run src/dx/contrast.test.ts
```

## Ownership & References

- **Owner:** UI & Design System Platform (`packages/ui`)
- **Contracts:** [docs/dna/00-ENGINE-CONTRACT.md](../../docs/dna/00-ENGINE-CONTRACT.md), [docs/dna/README.md](../../docs/dna/README.md), [docs/dna/09-UI-ARCHITECTURE-STATUS.md](../../docs/dna/09-UI-ARCHITECTURE-STATUS.md)
