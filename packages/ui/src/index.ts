export { cn } from "./lib/utils";
export { SOURCE_PROBE_CLASS } from "./probe";

export { ZineButton, type ZineButtonProps, type ZineTone } from "./primitives/zine-button";
export { Sticker, type StickerProps, type StickerTone } from "./primitives/sticker";
export { Tape } from "./primitives/tape";
export { ZineCard, ZineCardRough } from "./primitives/zine-card";
export { ZineBadge, type ZineBadgeProps } from "./primitives/zine-badge";
export { ZineInput } from "./primitives/zine-input";
export { ZineImage, type ZineImageProps } from "./primitives/zine-image";
export { Marquee, type MarqueeProps } from "./primitives/marquee";
export { Halftone, Grain, type HalftoneProps } from "./primitives/texture";
export { SkipLink, type SkipLinkProps } from "./primitives/skip-link";
export { WitnessAvatar, type WitnessAvatarProps } from "./primitives/witness-avatar";
export { RansomText, type RansomTextProps } from "./primitives/ransom-text";
export {
  TactileTape,
  Staple,
  type TactileTapeProps,
  type StapleProps,
} from "./primitives/tactile-hardware";
export {
  DistressedSticker,
  type DistressedStickerProps,
  type DistressedStickerVariant,
} from "./primitives/distressed-sticker";
export { ComicPanel, type ComicPanelProps, type ComicPanelTone } from "./primitives/comic-panel";

export { kindColors, defaultKindColors } from "./composites/kind-colors";
export {
  EventCard,
  KindBadge,
  type EventCardProps,
  type EventCardData,
} from "./composites/event-card";
export {
  EventDetail,
  type EventDetailProps,
  type EventDetailData,
  type EventDetailEra,
} from "./composites/event-detail";
export {
  EventDetailRelated,
  type EventDetailRelatedProps,
  type RelatedEventItem,
} from "./composites/event-detail-related";
export { EraBand, type EraBandProps, type EraItem } from "./composites/era-band";
export { CountUp } from "./composites/count-up";
export { TransmissionCard, type TransmissionCardProps } from "./composites/transmission-card";
export {
  CrewConstellation,
  type CrewConstellationProps,
  type WitnessItem,
  type CrewStat,
} from "./composites/crew-constellation";
export { MODULE_GLYPHS } from "./composites/module-glyphs";
export { ModuleGlyph, type ModuleGlyphProps } from "./composites/module-glyph";
export {
  ModuleCard,
  type ModuleCardProps,
  type ModuleItem,
  type ModuleStat,
} from "./composites/module-card";
export { StatBlock, type StatBlockProps } from "./composites/stat-block";
export { StatusBadge, type StatusBadgeProps } from "./composites/status-badge";
export {
  QuickActionGrid,
  type QuickActionGridProps,
  type QuickActionItem,
} from "./composites/quick-action-grid";
export {
  WorkspaceList,
  type WorkspaceListProps,
  type WorkspaceItem,
} from "./composites/workspace-list";
export {
  KanbanColumn,
  STAGE_COLOR,
  type KanbanColumnProps,
  type KanbanColumnData,
  type KanbanCard,
} from "./composites/kanban-column";
export {
  CollectionsGrid,
  type CollectionsGridProps,
  type CollectionItem,
} from "./composites/collections-grid";
export { WorldMap, type WorldMapProps, type MapCityItem } from "./composites/world-map";
export { AtlasStage, type AtlasStageProps } from "./composites/atlas-stage";
export {
  ScenePage,
  ScenePanel,
  ChapterBanner,
  FilmStrip,
  type ScenePageProps,
  type ScenePanelProps,
  type ChapterBannerProps,
  type FilmStripProps,
} from "./composites/scene-page";
export {
  TopRail,
  SideRail,
  CommandStrip,
  CornerBrackets,
  Gauge,
  type HudNavItem,
  type HudLinkComponent,
  type TopRailProps,
  type SideRailProps,
  type CommandStripProps,
  type CornerBracketsProps,
  type GaugeProps,
} from "./primitives/hud-chrome";
export { ConsoleShell, type ConsoleShellProps } from "./composites/console-shell";

/* shadcn/ui compatible components */
export { Button, type ButtonProps } from "./components/ui/button";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/ui/card";
export { Input, type InputProps } from "./components/ui/input";
export { Badge, badgeVariants, type BadgeProps } from "./components/ui/badge";
export { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./components/ui/tooltip";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./components/ui/dropdown-menu";
export { Separator } from "./components/ui/separator";
export { Label } from "./components/ui/label";
export { ScrollArea, ScrollBar } from "./components/ui/scroll-area";
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "./components/ui/sheet";
export { Switch } from "./components/ui/switch";
export { Textarea, type TextareaProps } from "./components/ui/textarea";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./components/ui/select";
export { Popover, PopoverTrigger, PopoverContent } from "./components/ui/popover";
export { HoverCard, HoverCardTrigger, HoverCardContent } from "./components/ui/hover-card";
export {
  Menubar,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarRadioGroup,
} from "./components/ui/menubar";
export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
} from "./components/ui/navigation-menu";
export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "./components/ui/pagination";
export { Progress } from "./components/ui/progress";
export { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
export { Slider } from "./components/ui/slider";
export { Toggle, toggleVariants, type ToggleProps } from "./components/ui/toggle";
export { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";

export { cva, type VariantProps } from "./lib/utils";

/* DNA System */
export {
  type DNATokens,
  type TokenPath,
  type TokenReference,
  type ColorToken,
  type ColorScale,
  type SemanticColors,
  type LegacyColors,
  type SpacingToken,
  type RadiusToken,
  type ShadowToken,
  type TypographyToken,
  type MotionToken,
  type EffectToken,
  type ZIndexToken,
  type BreakpointToken,
} from "./dna/tokens";
export { defaultTheme, type DefaultTheme } from "./dna/default-theme";
export {
  getToken,
  resolveToken,
  generateCSSVariables,
  applyTheme,
  createTheme,
  getTheme,
  listThemes,
  themeRegistry,
  type ThemeName,
} from "./dna/registry";
export {
  BRAND_TOKENS,
  MASTER_DNA_LIGHT_PALETTES,
  DEPRECATED_TOKEN_ALIASES,
  hexToHslString,
  normalizeColorTokenToCss,
  createCanonicalColorToken,
  resolveCanonicalTokens,
  canonicalTokensToCssVariables,
  assertCanonicalTokensValid,
  canonicalSemanticToDnaTokens,
  type CanonicalDnaId,
  type CanonicalThemeMode,
  type CanonicalDensity,
  type DnaPaletteSpec,
  type CanonicalBrandTokens,
  type CanonicalSemanticTokens,
  type CanonicalShapeTokens,
  type CanonicalComponentTokens,
  type CanonicalResolvedTokens,
  type DeprecatedTokenAlias,
  type ResolveCanonicalTokensOptions,
} from "./dna/canonical";

/* Skin System */
export { buttonVariants as skinButtonVariants } from "./skin/variants";
export {
  halftone,
  grain,
  cmykSlip,
  duotone,
  tape,
  sticker,
  brushUnderline,
  composeEffects,
  effectPresets,
} from "./skin/effects";
export {
  eventCardVariants,
  kanbanColumnVariants,
  moduleCardVariants,
  buttonSkinCompositions,
  inputSkinCompositions,
  badgeSkinCompositions,
  cardSkinCompositions,
  type SkinName,
  type EventCardSkin,
  type KanbanColumnSkin,
  type ModuleCardSkin,
} from "./skin/compositions";
export {
  skinPresets,
  getPreset,
  applyPreset,
  listPresets,
  defaultPreset,
  riotPreset,
  editorialPreset,
  technicalPreset,
  archivePreset,
  transmissionPreset,
  type SkinPreset,
} from "./skin/presets";
export {
  SkinProvider,
  useSkin,
  withSkin,
  createSkinComponent,
  Skinned,
  skinCn,
  type SkinContextValue,
  type SkinProviderProps,
} from "./skin/index";
export {
  useThemeMode,
  getStoredThemeMode,
  resolveThemeMode,
  applyThemeMode,
  type ThemeMode,
} from "./skin/index";
export {
  MASTER_DNA_IDS,
  MASTER_DNA_WORLDS,
  getDnaWorld,
  listDnaWorlds,
  dnaWorldCssVariables,
  useDnaWorld,
  SkinScope,
  SkinRoot,
  type MasterDnaId,
  type DnaWorldPalette,
  type MasterDnaWorldSpec,
  type SkinScopeProps,
  type SkinRootProps,
} from "./skin/dna-worlds";
export {
  IMPERIUM_LUMEN_TOKENS,
  LIVING_LIGHT_PALETTE,
  LIVING_LIGHT_TYPOGRAPHY,
  LIVING_LIGHT_MOTION,
  SACRED_VISUAL_COVENANT,
  DnaButton,
  DnaChamber,
  DnaPortalArch,
  DnaBadge,
  PrimaryAction,
  SecondaryAction,
  SiteNavigation,
  SectionHeading,
  StorySection,
  EditorialFeature,
  IllustrationFrame,
  ResponsiveImage,
  WorldTile,
  WorldExplorer,
  WorldAtlas,
  IllustratedHero,
  MotionReveal,
  CrownEmblemIcon,
  OctagramMandalaIcon,
  CrescentStarIcon,
  SearchLensIcon,
  DiamondStarOrnament,
  SacredCornerBrackets,
  type RenderingCapabilityTier,
  type SpringPhysicsPreset,
  type DnaButtonProps,
  type DnaChamberProps,
  type DnaPortalArchProps,
  type DnaBadgeProps,
  type ActionControlProps,
  type SiteNavigationItem,
  type SiteNavigationProps,
  type SectionHeadingProps,
  type StorySectionProps,
  type EditorialFeatureProps,
  type IllustrationFrameProps,
  type ResponsiveImageProps,
  type WorldTileProps,
  type WorldExplorerProps,
  type WorldAtlasItem,
  type WorldAtlasProps,
  type IllustratedHeroProps,
  type MotionRevealProps,
} from "./skin/imperium";

/* Layout System */
export { Grid, GridItem, Stack, VStack, HStack, ZStack, Container, Flow } from "./layout";

/* Artwork System */
export * from "./artwork/vector";
export * from "./artwork/generative";
export * from "./artwork/compositions";

/* DX Layer */
export { TokenInspector, type TokenInspectorProps } from "./dx/inspector";
export { SkinPlayground, type SkinPlaygroundProps } from "./dx/playground";
export {
  measureContrastRatio,
  auditDnaContrast,
  auditAllDnaWorlds,
  type ContrastPairResult,
  type ContrastAuditResult,
} from "./dx/contrast";
export {
  generateTokenDocs,
  generateSkinDocs,
  generateThemeCSSDocs,
  generateEffectsDocs,
  generateDocsMarkdown,
  type TokenDoc,
  type SkinDoc,
} from "./dx/docs";
