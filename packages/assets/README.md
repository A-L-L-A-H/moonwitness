# @moonwitness/assets

Artwork manifest (`src/catalogue.json`), responsive AVIF/WebP derivative helpers (`HERO_LAYERS`, `ArtEntry`, `srcSetFor`), optimization pipeline (`scripts/optimize.mjs`), and font asset build scripts for `@moonwitness/ui` and `@moonwitness/web`.

## Exports & Source

- `.` -> `./src/index.ts` (`HERO_LAYERS`, `ArtEntry`, responsive width/srcSet utilities consuming `src/catalogue.json` and `src/optimize.ts`)
- Dependencies: `@moonwitness/types`

## Scripts

```sh
pnpm --filter @moonwitness/assets lint       # eslint src
pnpm --filter @moonwitness/assets typecheck  # tsc --noEmit
pnpm --filter @moonwitness/assets test       # vitest run (hero.test.ts, optimize.test.ts)
pnpm --filter @moonwitness/assets optimize   # node scripts/optimize.mjs
pnpm --filter @moonwitness/assets fonts      # node fonts/build.mjs && node fonts/build-specimen.mjs
```

## Ownership & References

- **Owner:** Visual Assets & Design Platform (`packages/assets`)
- **Design System Contract:** [docs/dna/00-ENGINE-CONTRACT.md](../../docs/dna/00-ENGINE-CONTRACT.md)
