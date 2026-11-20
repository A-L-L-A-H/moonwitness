# @moonwitness/ui

Shared MoonWitness Design DNA skin engine, tokens, primitives, composites, artwork wrappers, icons, and accessibility/architecture DX checks (`@moonwitness/ui`).

## Architecture & Exports (`package.json`)

- **Core Entry (`.`):** `./src/index.ts` — primitives (`ZineButton`, `Sticker`, `Tape`, `ZineCard`, `WitnessAvatar`, `RansomText`, `ComicPanel`, etc.), composites (`EventCard`, `EventDetail`, `ConsoleShell`, `WorldMap`, `ScenePage`, etc.), and `cn` utility.
- **DNA & Skins (`./dna`, `./skin`, `./imperium`, `./tokens`, `./imperium-icons`):** Multi-world `[data-dna]` scoping, tokens, and presets plus shared stylesheets (`./theme.css`, `./base.css`, `./skins/dna-base.css`, `./skins/imperium.css`).
- **Layout, Artwork & Icons (`./layout`, `./artwork`, `./icons`):** Grid/stack/container primitives, generative/vector artwork scenes, and shared icon mappings.
- **DX & Quality Tooling (`./docs-cli`, `src/dx/`):** Automated contrast checks (`contrast.test.ts` -> `pnpm ui:contrast`) and package architecture boundary tests (`architecture.test.ts`).

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

## DiffViewer component

Render precomputed, read-only diff hunks without adding a diff engine:

```tsx
import { DiffViewer, type DiffHunk } from "@moonwitness/ui";

const hunks: DiffHunk[] = [
  {
    id: "hunk-1",
    header: "@@ -1,2 +1,2 @@",
    lines: [
      { id: "before", kind: "removed", content: "const retries = 2;", oldLineNumber: 1 },
      { id: "after", kind: "added", content: "const retries = 3;", newLineNumber: 1 },
    ],
  },
];

<DiffViewer fileName="src/config.ts" hunks={hunks} />;
```

The caller owns diff computation, file loading, ordering and authorization. The component only presents added, removed and unchanged lines, with visible text labels and an accessible file/change description.

