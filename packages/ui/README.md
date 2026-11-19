# @moonwitness/ui

Shared MoonWitness Design DNA skin engine, tokens, primitives, composites, artwork wrappers, icons, and accessibility/architecture DX checks (`@moonwitness/ui`).

## Architecture & Exports (`package.json`)

- **Core Entry (`.`):** `./src/index.ts` — primitives (`ZineButton`, `Sticker`, `Tape`, `ZineCard`, `WitnessAvatar`, `RansomText`, `ComicPanel`, etc.), composites (`EventCard`, `EventDetail`, `ConsoleShell`, `WorldMap`, `ScenePage`, etc.), and `cn` utility.
- **DNA & Skins (`./dna`, `./skin`, `./imperium`, `./tokens`, `./imperium-icons`):** Multi-world `[data-dna]` scoping, tokens, and presets plus shared stylesheets (`./theme.css`, `./base.css`, `./skins/dna-base.css`, `./skins/imperium.css`).
- **Layout, Artwork & Icons (`./layout`, `./artwork`, `./icons`):** Grid/stack/container primitives, generative/vector artwork scenes, and shared icon mappings.
- **DX & Quality Tooling (`./docs-cli`, `src/dx/`):** Automated contrast checks (`contrast.test.ts` -> `pnpm ui:contrast`) and package architecture boundary tests (`architecture.test.ts`).

## Canonical token and skin runtime

Use the canonical DNA resolver for new DNA/skin/mode-aware token work. It is exported from the public `@moonwitness/ui/dna` entry:

```ts
import {
  assertCanonicalTokensValid,
  canonicalTokensToCssVariables,
  resolveCanonicalTokens,
} from "@moonwitness/ui/dna";

const resolved = resolveCanonicalTokens({
  dnaId: "03-rocksoul",
  skin: "riot",
  mode: "dark",
  density: "comfortable",
});

const errors = assertCanonicalTokensValid(resolved);
const cssVariables = canonicalTokensToCssVariables(resolved);
```

- `resolveCanonicalTokens` resolves a supported DNA, skin, mode and density combination into one canonical token tree.
- `assertCanonicalTokensValid` validates the resolved token tree before it is consumed.
- `canonicalTokensToCssVariables` returns the CSS custom-property map; it does not mutate the DOM or install global styles.
- React applications should use the public `@moonwitness/ui/skin` entry for `SkinProvider`, `SkinRoot`, `SkinScope`, and related skin context APIs. Prefer scoped runtime components over manually writing global `:root` variables.

### Legacy DNA registry compatibility

The public `@moonwitness/ui/dna` entry still exports the original registry helpers for existing consumers:

- `getToken` / `resolveToken` read values from the legacy `DNATokens` model.
- `createTheme` creates a merged legacy theme; `getTheme`, `listThemes`, and `themeRegistry` expose the legacy named-theme registry.
- `generateCSSVariables` serializes a legacy theme to CSS text.
- `applyTheme` injects that generated CSS into a document style element when a browser document exists.

These helpers remain exported for compatibility; this documentation does not remove them or announce a removal date. They are not the canonical DNA × skin × mode resolver for new features. Do not build a second theme registry, mix legacy token maps over canonical scope variables, or use `applyTheme` as a replacement for the scoped React skin runtime. Use `resolveCanonicalTokens` and the scoped skin entry for new work.

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
