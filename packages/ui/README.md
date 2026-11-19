# @moonwitness/ui

Shared MoonWitness Design DNA skin engine, tokens, primitives, composites, artwork wrappers, icons, and accessibility/architecture DX checks (`@moonwitness/ui`).

## Architecture & Exports (`package.json`)

- **Core Entry (`.`):** `./src/index.ts` — primitives (`ZineButton`, `Sticker`, `Tape`, `ZineCard`, `WitnessAvatar`, `RansomText`, `ComicPanel`, etc.), composites (`EventCard`, `EventDetail`, `ConsoleShell`, `WorldMap`, `ScenePage`, etc.), and `cn` utility.
- **DNA & Skins (`./dna`, `./skin`, `./imperium`, `./tokens`, `./imperium-icons`):** Multi-world `[data-dna]` scoping, tokens, and presets plus shared stylesheets (`./theme.css`, `./base.css`, `./skins/dna-base.css`, `./skins/imperium.css`).
- **Layout, Artwork & Icons (`./layout`, `./artwork`, `./icons`):** Grid/stack/container primitives, generative/vector artwork scenes, and shared icon mappings.
- **DX & Quality Tooling (`./docs-cli`, `src/dx/`):** Automated contrast checks (`contrast.test.ts` -> `pnpm ui:contrast`) and package architecture boundary tests (`architecture.test.ts`).


## Canonical token and skin runtime

Use the canonical resolver and skin boundary for new consumer code. Token resolution is server-safe; the React skin runtime is client-side.

Public package entry points:

- `@moonwitness/ui/tokens` provides base Imperium Lumen brand/semantic tokens and the server-safe base CSS variable map.
- `@moonwitness/ui/dna` provides server-safe DNA, skin, mode and density resolution through `resolveCanonicalTokens` and `canonicalTokensToCssVariables`.
- `@moonwitness/ui/skin` provides client-side visual scope and state APIs, including `SkinRoot`, `SkinScope`, `SkinProvider`, `useSkin` and `useThemeMode`.

Use `SkinRoot` once at an application's visual root. Use `SkinScope` for a deliberately different DNA/skin presentation inside a route or subtree. Add `SkinProvider` when the application needs interactive React context, persistence or `useSkin` controls. It is a state provider, not a replacement for the app's visual identity boundary.

For server-side token calculation or explicit CSS-variable output, import `resolveCanonicalTokens` and `canonicalTokensToCssVariables` from `@moonwitness/ui/dna`. Use `SkinRoot` from `@moonwitness/ui/skin` for the client-side visual boundary. Import from these public package entry points (or equivalent root exports); do not import from `packages/ui/src/**` in consuming applications.

## Legacy DNA registry compatibility

The `@moonwitness/ui/dna` and root `@moonwitness/ui` entry points still export the earlier `DNATokens` registry API:

- `getToken` and `resolveToken` read paths from a legacy `DNATokens` theme object.
- `createTheme`, `defaultTheme`, `themeRegistry`, `getTheme` and `listThemes` manage the legacy theme set.
- `generateCSSVariables` builds the legacy `--mw-*` and shadcn-compatible variable block.
- `applyTheme` injects that generated block into a document-level style element; it is not a scoped replacement for `SkinRoot` or `SkinScope`.

These exports are retained for compatibility; this documentation does not remove or formally deprecate them. Do not introduce new application callers for the legacy global theme-injection path. Use the canonical resolver and scoped skin runtime for new work. Existing consumers should migrate in a separately scoped change so their behavior and CSS ownership can be verified.

Known repository usage at the time of this review:

- `apps/web/src/components/theme-bootstrap.tsx` still calls `applyTheme(defaultTheme)`.
- The package's DX token inspector and documentation generator still use `generateCSSVariables` to display legacy-theme output.
- The canonical resolver is implemented by `packages/ui/src/dna/canonical` and consumed by the skin runtime; keep public usage through `@moonwitness/ui/dna`.

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
