# Moonwitness DNA/Skin System -- Implementation Plan  
  
## Current State Analysis 
  
**Package Structure** (packages/ui):  
  
| Layer | Count | Examples |  
|-------|-------|----------|  
| Primitives | 15 | ZineButton, ZineCard, Tape, WitnessAvatar, Sticker, DistressedSticker, Halftone/Grain |  
| Composites | 18 | EventCard, KanbanColumn, CrewConstellation, ModuleCard, WorldMap, CollectionsGrid |  
| shadcn/ui compat | 27 | Button, Card, Input, Badge, Dialog, Sheet, NavigationMenu, DropdownMenu |  
| **Total exports** | **61** | 34 custom + 27 shadcn | 
  
**Design Tokens** (theme.css + base.css):  
  
- **Color system**: HSL (shadcn) + hex (legacy) dual variables  
- **Typography**: Saksi proprietary family (--font-brush/hand/mono) loaded via next/font  
- **Effects**: Halftone, grain, CMYK slip, duotone, tape/sticker clip-paths, brush underline  
  
**Design Tokens** (theme.css + base.css):  
  
- **Color system**: HSL (shadcn) + hex (legacy) dual variables  
- **Typography**: Saksi proprietary family (--font-brush/hand/mono) loaded via next/font  
- **Effects**: Halftone, grain, CMYK slip, duotone, tape/sticker clip-paths, brush underline  
- **Motion**: Reduced-motion safe animations (marquee, float, rise-in, flicker)  
- **Dark-only**: color-scheme: dark in :root 
  
**Component Philosophy**:  
  
- **Zero breaking changes** -- custom zine components coexist with shadcn  
- **Radix primitives** under shadcn layer for accessibility  
- **CVA variants** for all component APIs  
- **Custom CSS** (base.css) provides the \"Moonwitness texture\" -- not replicable via Tailwind alone 
  
---  
  
## COMPREHENSIVE DNA/SKIN SYSTEM PLAN 
  
### Phase 1: DNA Core -- Token Architecture (packages/ui/src/dna/)  
**Goal**: Extract all design decisions into a type-safe, serializable, themeable token system  
  
| File | Purpose |  
|------|--------|  
| dna/tokens.ts | Root token type: colors, spacing, radii, shadows, typography, motion, effects |  
| dna/themes.ts | Theme variants: default (dark), high-contrast, print, low-motion, sepia |  
| dna/registry.ts | Token registry with getToken(path), resolveToken(ref), CSS var generation |  
| dna/transformers.ts | Transform token values: rem(), fluid(), clamp(), darken(), alpha() |  
| dna/index.ts | Public exports: createTheme(), applyTheme(), themeContract |  
  
**Deliverable**: dna/themes/default.json -- complete serialized token map (source of truth) 
  
### Phase 2: Skin Layer -- Visual Expression (packages/ui/src/skin/)  
**Goal**: Component-level visual variants powered by DNA tokens  
  
| File | Purpose |  
|------|--------|  
| skin/variants.ts | CVA recipes per component: buttonVariants, cardVariants, inputVariants |  
| skin/effects.ts | Reusable effect classes: halftone(), grain(), cmykSlip(), duotone(), tape() |  
| skin/compositions.ts | Composite skin recipes: eventCardSkin, kanbanColumnSkin, moduleCardSkin |  
| skin/presets.ts | Named presets: riot, editorial, technical, archive, transmission |  
| skin/index.ts | withSkin(Component, skinName), useSkin(), SkinProvider |  
  
**Key insight**: Each shadcn component gets a skin prop mapping to visual DNA -- e.g., Button skin=riot applies halftone+pink accent+tape texture. 
  
### Phase 3: Artwork/Vector/Sketch System (packages/ui/src/artwork/)  
**Goal**: First-class vector art, generative sketches, and illustration primitives  
  
| File | Purpose |  
|------|--------|  
| artwork/vector.ts | SVG primitives: Crown, Star4, Tape, Smiley, ArrowRight, CassetteTape |  
| artwork/generative.ts | Procedural: constellation(), halftoneField(), noiseTexture(), brushStroke() |  
| artwork/sketches.ts | Hand-drawn style: RansomText, Marginalia, Doodle, Splatters, StickerSheet |  
| artwork/compositions.tsx | Composite artwork: HeroIllustration, EmptyStateArt, LoadingConstellation |  
| artwork/index.ts | Exports + ArtworkProvider for context-aware art (era, mood, density) | 
  
### Phase 4: Layout System (packages/ui/src/layout/)  
**Goal**: Composable layout primitives replacing ad-hoc CSS  
  
| File | Purpose |  
|------|--------|  
| layout/grid.tsx | Grid, GridItem -- responsive, fluid, asymmetric |  
| layout/stack.tsx | VStack, HStack, ZStack -- spacing tokens, alignment |  
| layout/container.tsx | Container, Section, Sidebar, Drawer, Modal |  
| layout/flow.tsx | Flow, Masonry, Carousel, Marquee |  
| layout/index.ts | Layout tokens + LayoutProvider | 
  
### Phase 5: Developer Experience (packages/ui/src/dx/)  
**Goal**: Make DNA/Skin inspectable, documentable, testable  
  
| File | Purpose |  
|------|--------|  
| dx/inspector.tsx | DNAInspector -- live token viewer, theme switcher, variant preview |  
| dx/docs.ts | Auto-generated component docs from CVA recipes + JSDoc |  
| dx/playground.tsx | Interactive playground page (Storybook alternative) |  
| dx/testing.ts | renderWithDNA(), snapshotDNA(), visual regression helpers |  
| dx/cli.ts | pnpm dna:extract, pnpm dna:validate, pnpm skin:build | 
  
  
### Phase 6: Migration and Adoption  
**Goal**: Incrementally adopt DNA/Skin across web app  
  
| Batch | Target | DNA/Skin Integration |  
|-------|--------|--------------------|  
| 4 | control/index.tsx | Gauge - Progress + skin; ResourcePanel - Card + Table skin |  
| 5 | dock/event-list.tsx | Pagination - shadcn Pagination skin; empty state - Artwork |  
| 6 | command-center/pipeline.tsx | Keep KanbanColumn; add layout/grid + skin/kanban |  
| 7 | network/portforward.tsx | ZineInput - Input + skin; ZineBadge - Badge skin |  
| 8 | Landing pages | CTA buttons - Button skins; artwork - Artwork compositions |  
| 9 | Shell | Topbar search - Input + Popover skin; sidebar - layout/sidebar | 
  
---  
  
