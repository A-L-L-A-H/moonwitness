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
  SkinOrnament,
  type TactileTapeProps,
  type StapleProps,
  type SkinOrnamentProps,
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
  type CardProps,
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
  MenubarMenu,
  MenubarGroup,
  MenubarPortal,
  MenubarSub,
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
export { Checkbox, type CheckboxProps, type CheckedState } from "./components/ui/checkbox";
export { Skeleton, type SkeletonProps } from "./components/ui/skeleton";
export {
  Alert,
  AlertTitle,
  AlertDescription,
  alertVariants,
  type AlertProps,
} from "./components/ui/alert";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./components/ui/table";
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./components/ui/alert-dialog";
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "./components/ui/breadcrumb";
export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  Toaster,
  toast,
  dismissToast,
  useToast,
  toastVariants,
  type ToastProps,
  type ToastRecord,
  type ToastVariant,
} from "./components/ui/toast";
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  type AccordionProps,
} from "./components/ui/accordion";
export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  type CollapsibleProps,
} from "./components/ui/collapsible";
export { AspectRatio, type AspectRatioProps } from "./components/ui/aspect-ratio";
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "./components/ui/drawer";
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuShortcut,
} from "./components/ui/context-menu";
export { Kbd, type KbdProps } from "./components/ui/kbd";
export {
  Typography,
  Prose,
  typographyVariants,
  type TypographyProps,
} from "./components/ui/typography";
export {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "./components/ui/empty";
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
  type CommandProps,
  type CommandItemProps,
} from "./components/ui/command";
export { Combobox, type ComboboxOption, type ComboboxProps } from "./components/ui/combobox";
export { Calendar, type CalendarProps } from "./components/ui/calendar";
export { DatePicker, type DatePickerProps } from "./components/ui/date-picker";
export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselProps,
} from "./components/ui/carousel";
export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
  type InputOTPProps,
} from "./components/ui/input-otp";
export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  type ResizablePanelGroupProps,
} from "./components/ui/resizable";
export {
  Field,
  FieldLabel,
  FieldControl,
  FieldDescription,
  FieldError,
  type FieldProps,
} from "./components/ui/field";
export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  type FormErrors,
  type FormProps,
  type FormFieldProps,
} from "./components/ui/form";
export { DataTable, type DataTableColumn, type DataTableProps } from "./components/ui/data-table";
export {
  ChartContainer,
  BarChart,
  Sparkline,
  LineChart,
  AreaChart,
  RadialGauge,
  ChartLegend,
  ChartTooltip,
  type ChartDataPoint,
  type ChartContainerProps,
  type BarChartProps,
  type SparklineProps,
  type LineChartProps,
  type AreaChartProps,
  type RadialGaugeProps,
} from "./components/ui/chart";

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
  SKIN_SURFACE_PALETTES,
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
  scanlines,
  resolveEffectStyle,
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
  skinBaseClasses,
  isValidSkin,
  type SkinContextValue,
  type SkinProviderProps,
  type SkinnedComponentProps,
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
  isValidDnaId,
  getDnaWorld,
  listDnaWorlds,
  dnaWorldCssVariables,
  useDnaWorld,
  useOptionalDnaWorld,
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

/* Sovereign DNA Icons */
export * as SovereignIcons from "./icons";
export * from "./icons/types";
export {
  Bolt,
  Splatter,
  PlayIcon,
  PauseIcon,
  GlobeIcon,
  EyeIcon,
  SearchIcon,
  SafetyPin,
  BarbedWire,
  RazorBlade,
  SprayCan,
  SkullCrossbonesFunky,
  TornTicket,
  StaplerMark,
} from "./icons/tactical";
export {
  PortalAstrolabeIcon,
  MoonwitnessCrestIcon,
  ArsyTowerIcon,
  QalamNibIcon,
  SidraPolyhedronIcon,
  RocksoulCubeIcon,
  CrayonPrismIcon,
  SinCanMirrorIcon,
  MythosArchIcon,
  AwsScalesIcon,
  WorldEmblemById,
  type WorldIconId,
} from "./icons/worlds";
export {
  ArrowUpRight,
  ArrowUpDown,
  ChevronsUpDown,
  ChevronsLeftRight,
  Circle,
  GripVertical,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
} from "./icons/primitives";
export {
  Grid as GridIcon,
  VpnTunnel,
  SyslogStream,
  SnmpProbe,
  StorageBucket,
  RadiusKey,
  MtimeHorizon,
  ScriptureFolio,
  MemoryTapeNode,
  ArsyRelay,
  SimpulNode,
  MyceliumSpore,
  SkinPalette,
} from "./icons/modules";

/* Artwork System */
export * from "./artwork/vector";
export * from "./artwork/generative";
export * from "./artwork/compositions";
export * from "./artwork/logos";
export * from "./artwork/cutouts";
export * from "./artwork/backdrop";

/* Schema-Driven Composite View */
export {
  AutoModelView,
  type AutoModelFieldType,
  type AutoModelFieldSpec,
  type AutoModelAcl,
  type AutoModelCustomAction,
  type AutoModelViewDescriptor,
  type AutoModelRow,
  type AutoModelViewProps,
} from "./composites/auto-model-view";

/* DX Layer */
export { TokenInspector, type TokenInspectorProps } from "./dx/inspector";
export { SkinPlayground, type SkinPlaygroundProps } from "./dx/playground";
export {
  SkinMatrixCompare,
  formatSkinTokensAsCss,
  formatSkinTokensAsJson,
  type SkinMatrixCompareProps,
} from "./dx/matrix-compare";
export {
  measureContrastRatio,
  auditPaletteContrast,
  auditDnaContrast,
  auditAllDnaWorlds,
  auditAllDnaWorldsAndModes,
  type ContrastPairResult,
  type ContrastAuditResult,
} from "./dx/contrast";
export {
  generateTokenDocs,
  generateSkinDocs,
  generateSkinAtmosphereDocs,
  generateArtworkDocs,
  generateBrandCatalogDocs,
  generateTelemetryDocs,
  generateThemeCSSDocs,
  generateEffectsDocs,
  generateDocsMarkdown,
  type TokenDoc,
  type SkinDoc,
  type ArtworkDoc,
  type SkinAtmosphereDoc,
  type BrandCatalogDoc,
  type TelemetryComponentDoc,
} from "./dx/docs";
