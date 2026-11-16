// DNA System - Core Types
// Complete computational design genome types

// Forward declare TokenGraphEngine for type references
export interface TokenGraphEngine {
  resolve(tokenId: string): ComputedTokenValue
  resolveAll(): Map<string, ComputedTokenValue>
  getToken(tokenId: string): AnyPrimitiveToken | undefined
  queueMutation(mutation: TokenMutation): void
  applyMutations(): Map<string, ComputedTokenValue>
  setContext(context: TokenResolutionContext): void
  getContext(): TokenResolutionContext | null
  exportGraph(): TokenGraph
  rebuildGraph(): void
  getTopologicalOrder(): string[]
  subscribe(tokenId: string, listener: (value: ComputedTokenValue) => void): () => void
  unsubscribe(tokenId: string, listener: (value: ComputedTokenValue) => void): void
}

export type PrimitiveType = 'color' | 'number' | 'string' | 'function' | 'reference' | 'gradient' | 'shadow' | 'transition' | 'path' | 'easing'

export interface TokenConstraint {
  type: 'contrast' | 'range' | 'enum' | 'ratio' | 'dependency' | 'accessibility' | 'performance'
  params: Record<string, any>
  severity: 'error' | 'warning' | 'info'
  message?: string
}

export interface TokenMetadata {
  semanticRole: string
  category: 'color' | 'spacing' | 'typography' | 'border' | 'shadow' | 'motion' | 'svg' | 'layout' | 'effect' | 'z-index'
  constraints: TokenConstraint[]
  dependencies: string[]
  transform?: string // Reference to transform function ID
  description?: string
  deprecated?: boolean
  experimental?: boolean
  version: string
  source: 'manual' | 'ai-synthesized' | 'inherited' | 'computed'
}

export interface PrimitiveToken<T = any> {
  id: string
  type: PrimitiveType
  value: T
  metadata: TokenMetadata
  // Computed fields (populated at runtime)
  computed?: T
  resolved?: boolean
  lastResolved?: number
}

// Color-specific primitives
export interface ColorToken extends PrimitiveToken<string> {
  type: 'color'
  value: string // CSS color value
  colorSpace?: 'srgb' | 'display-p3' | 'rec2020' | 'oklab' | 'oklch'
  channels?: {
    lightness?: number
    chroma?: number
    hue?: number
    alpha?: number
  }
}

// Number primitives (spacing, sizing, etc.)
export interface NumberToken extends PrimitiveToken<number> {
  type: 'number'
  value: number
  unit: 'px' | 'rem' | 'em' | '%' | 'vw' | 'vh' | 'vmin' | 'vmax' | 'unitless'
  scale?: 'linear' | 'exponential' | 'modular' | 'fibonacci'
}

// String primitives (font families, paths, etc.)
export interface StringToken extends PrimitiveToken<string> {
  type: 'string'
  value: string
  format?: 'font-family' | 'font-feature' | 'path-data' | 'url' | 'identifier'
}

// Function primitives (dynamic values)
export interface FunctionToken extends PrimitiveToken<Function> {
  type: 'function'
  value: (context: TokenResolutionContext) => any
  pure: boolean
  memoize: boolean
}

// Reference primitives (alias to another token)
export interface ReferenceToken extends PrimitiveToken<string> {
  type: 'reference'
  value: string // Target token ID
  fallback?: any
}

// Gradient primitives
export interface GradientToken extends PrimitiveToken<GradientDefinition> {
  type: 'gradient'
  value: GradientDefinition
}

export interface GradientDefinition {
  type: 'linear' | 'radial' | 'conic'
  stops: GradientStop[]
  direction?: string // for linear
  center?: string // for radial
  radius?: string // for radial
}

export interface GradientStop {
  color: string
  position: number // 0-1
  opacity?: number
}

// Shadow primitives
export interface ShadowToken extends PrimitiveToken<ShadowDefinition> {
  type: 'shadow'
  value: ShadowDefinition
}

export interface ShadowDefinition {
  layers: ShadowLayer[]
}

export interface ShadowLayer {
  x: number
  y: number
  blur: number
  spread?: number
  color: string
  inset?: boolean
}

// Transition primitives
export interface TransitionToken extends PrimitiveToken<TransitionDefinition> {
  type: 'transition'
  value: TransitionDefinition
}

export interface TransitionDefinition {
  property: string | 'all'
  duration: string
  easing: string
  delay?: string
}

// Path primitives (SVG)
export interface PathToken extends PrimitiveToken<PathDefinition> {
  type: 'path'
  value: PathDefinition
}

export interface PathDefinition {
  d: string
  viewBox?: string
  transform?: string
  fillRule?: 'nonzero' | 'evenodd'
}

// Easing primitives
export interface EasingToken extends PrimitiveToken<EasingDefinition> {
  type: 'easing'
  value: EasingDefinition
}

export interface EasingDefinition {
  type: 'cubic-bezier' | 'steps' | 'linear' | 'spring' | 'custom'
  values?: number[] // for cubic-bezier [x1, y1, x2, y2] or steps [n, start|end]
  springConfig?: {
    stiffness: number
    damping: number
    mass: number
  }
  customFn?: string // reference to custom easing function
}

// ============================================
// TOKEN RESOLUTION CONTEXT
// ============================================

export interface TokenResolutionContext {
  viewport: ViewportInfo
  user: UserPreferences
  device: DeviceCapabilities
  time: TemporalContext
  locale: LocaleContext
  performance: PerformanceBudget
  brand: BrandGuidelines
  theme: 'light' | 'dark' | 'system'
  density: 'compact' | 'comfortable' | 'spacious'
  direction: 'ltr' | 'rtl'
  reducedMotion: boolean
  highContrast: boolean
}

export interface ViewportInfo {
  width: number
  height: number
  breakpoint: string
  orientation: 'portrait' | 'landscape'
  pixelRatio: number
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  density: 'compact' | 'comfortable' | 'spacious'
  reducedMotion: boolean
  highContrast: boolean
  fontSize: number // multiplier
  language: string
  region: string
}

export interface DeviceCapabilities {
  hover: boolean
  touch: boolean
  pointer: 'fine' | 'coarse' | 'none'
  colorGamut: 'srgb' | 'p3' | 'rec2020'
  maxTextureSize: number
  gpuTier: 'low' | 'medium' | 'high'
}

export interface TemporalContext {
  timestamp: number
  timezone: string
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
}

export interface LocaleContext {
  language: string
  region: string
  direction: 'ltr' | 'rtl'
  numberFormat: Intl.NumberFormatOptions
  dateFormat: Intl.DateTimeFormatOptions
  currency: string
}

export interface PerformanceBudget {
  maxBundleSize: number
  maxRuntimeTokens: number
  targetFPS: number
  maxCLS: number
  maxLCP: number
  maxINP: number
}

export interface BrandGuidelines {
  primaryColors: string[]
  secondaryColors: string[]
  forbiddenColors: string[]
  logoClearSpace: number
  minimumContrast: number
  typographyRules: TypographyRule[]
}

export interface TypographyRule {
  selector: string
  properties: Record<string, any>
}

// ============================================
// TOKEN GRAPH
// ============================================

export interface TokenGraph {
  nodes: Map<string, PrimitiveToken>
  edges: Map<string, Set<string>> // dependency graph: tokenId -> Set<dependentTokenIds>
  reverseEdges: Map<string, Set<string>> // reverse dependency: tokenId -> Set<dependencyTokenIds>
  topologicalOrder: string[]
  version: string
  checksum: string
}

export interface ComputedTokenValue {
  tokenId: string
  value: any
  resolved: boolean
  dependencies: string[]
  warnings: string[]
  errors: string[]
  computationTime: number
}

// ============================================
// LAYER 1: MOLECULES (Component Recipes)
// ============================================

export interface ComponentStateRecipe {
  tokens: Record<string, string> // property -> tokenId
  className?: string
  style?: Record<string, any>
  aria?: Record<string, string>
  dataAttributes?: Record<string, string>
  layout?: Record<string, string> // layout property -> tokenId
}

export interface ComponentVariantRecipe {
  name: string
  base: ComponentStateRecipe
  states: {
    default?: ComponentStateRecipe
    hover?: ComponentStateRecipe
    focus?: ComponentStateRecipe
    focusVisible?: ComponentStateRecipe
    active?: ComponentStateRecipe
    disabled?: ComponentStateRecipe
    loading?: ComponentStateRecipe
    selected?: ComponentStateRecipe
    error?: ComponentStateRecipe
    [key: string]: ComponentStateRecipe | undefined
  }
  sizes?: Record<string, { base: ComponentStateRecipe; states?: ComponentVariantRecipe['states']; name?: string }>
  responsive?: Record<string, ComponentVariantRecipe>
}

export interface ComponentMolecule {
  component: string
  displayName: string
  description?: string
  category: 'action' | 'input' | 'display' | 'navigation' | 'feedback' | 'layout' | 'data' | 'svg'
  variants: Record<string, ComponentVariantRecipe>
  defaultVariant: string
  defaultSize: string
  props: ComponentPropDefinition[]
  slots?: ComponentSlotDefinition[]
  behaviors?: ComponentBehavior[]
  accessibility?: ComponentA11yRecipe
}

export interface ComponentPropDefinition {
  name: string
  type: 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'function' | 'node'
  required: boolean
  default?: any
  description?: string
  tokenMapping?: Record<string, string> // prop value -> tokenId
}

export interface ComponentSlotDefinition {
  name: string
  required: boolean
  description?: string
  defaultContent?: string
}

export interface ComponentBehavior {
  trigger: 'hover' | 'focus' | 'click' | 'keydown' | 'viewport' | 'media' | 'custom'
  action: 'mutation' | 'animation' | 'navigation' | 'callback' | 'state-change'
  config: Record<string, any>
}

export interface ComponentA11yRecipe {
  role?: string
  ariaAttributes?: Record<string, string | string[]>
  keyboardNavigation?: KeyboardNavigationRecipe
  focusManagement?: FocusManagementRecipe
  screenReader?: ScreenReaderRecipe
}

export interface KeyboardNavigationRecipe {
  tabOrder?: number[]
  arrowNavigation?: 'horizontal' | 'vertical' | 'grid' | 'tree'
  homeEndSupport?: boolean
  escapeToClose?: boolean
  shortcuts?: Record<string, string>
}

export interface FocusManagementRecipe {
  trapFocus?: boolean
  restoreFocus?: boolean
  skipLinks?: string[]
  focusVisibleRing?: string // tokenId
}

export interface ScreenReaderRecipe {
  liveRegion?: 'polite' | 'assertive' | 'off'
  labels?: Record<string, string>
  descriptions?: Record<string, string>
}

// ============================================
// LAYOUT RECIPES
// ============================================

export interface LayoutRecipe {
  display: 'flex' | 'grid' | 'block' | 'inline' | 'inline-flex' | 'inline-grid' | 'contents'
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  alignContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'stretch'
  gap?: string // tokenId
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  gridTemplateColumns?: string
  gridTemplateRows?: string
  gridAutoFlow?: 'row' | 'column' | 'dense'
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
  inset?: Record<string, string> // tokenIds
  zIndex?: string // tokenId
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto' | 'clip'
  containerQueries?: ContainerQueryRecipe[]
}

export interface ContainerQueryRecipe {
  name: string
  condition: string
  layout: LayoutRecipe
}

export interface BehaviorRecipe {
  transitions: Record<string, string> // property -> transition tokenId
  animations: Record<string, string> // name -> keyframe tokenId
  interactions: InteractionRecipe[]
}

export interface InteractionRecipe {
  trigger: string
  target: string // tokenId or CSS selector
  mutation: TokenMutation
  condition?: string // media query or custom condition
}

// ============================================
// LAYER 2: ORGANISMS (Pattern Assemblies)
// ============================================

export interface CompositionRule {
  type: 'stack' | 'inline' | 'grid' | 'overlay' | 'sidebar' | 'tabs' | 'accordion' | 'wizard'
  config: Record<string, any>
  children: string[] // molecule IDs
  responsive?: Record<string, CompositionRule>
}

export interface BreakpointMutation {
  breakpoint: string
  mutations: TokenMutation[]
  layoutOverrides?: Record<string, LayoutRecipe>
}

export interface A11yRecipe {
  landmarks: Record<string, string> // region -> ARIA role
  headingStructure: HeadingLevel[]
  focusOrder: string[]
  skipLinks: SkipLink[]
  liveRegions: LiveRegion[]
  colorContrast: ContrastRequirement[]
}

export interface HeadingLevel {
  selector: string
  level: 1 | 2 | 3 | 4 | 5 | 6
}

export interface SkipLink {
  target: string
  label: string
  position: 'top' | 'bottom'
}

export interface LiveRegion {
  selector: string
  politeness: 'polite' | 'assertive' | 'off'
  atomic: boolean
}

export interface ContrastRequirement {
  foreground: string // tokenId
  background: string // tokenId
  minimumRatio: number
  enhancedRatio?: number
  appliesTo: 'text' | 'ui' | 'graphical' | 'all'
}

export interface OrganismPattern {
  id: string
  name: string
  category: 'form' | 'table' | 'navigation' | 'modal' | 'card' | 'list' | 'chart' | 'editor' | 'dashboard' | 'display' | 'marketing'
  description?: string
  molecules: string[] // molecule IDs
  composition: CompositionRule
  responsive: BreakpointMutation[]
  accessibility: A11yRecipe
  states: Record<string, OrganismState>
  slots: OrganismSlot[]
  dataRequirements?: DataRequirement[]
}

export interface OrganismState {
  name: string
  mutations: TokenMutation[]
  layoutOverrides?: Record<string, LayoutRecipe>
  behaviorOverrides?: Record<string, BehaviorRecipe>
}

export interface OrganismSlot {
  name: string
  required: boolean
  allowedMolecules?: string[]
  defaultMolecule?: string
  description?: string
}

export interface DataRequirement {
  type: 'collection' | 'entity' | 'scalar' | 'stream'
  schema: any
  required: boolean
  transform?: string // transform function ID
}

// ============================================
// LAYER 3: ECOSYSTEMS (Page/Application Templates)
// ============================================

export interface GlobalStateRecipe {
  providers: StateProvider[]
  initialState: Record<string, any>
  persistence: PersistenceConfig
  hydration: HydrationConfig
}

export interface StateProvider {
  id: string
  type: 'theme' | 'auth' | 'router' | 'query' | 'mutation' | 'websocket' | 'storage' | 'custom'
  config: Record<string, any>
  dependencies: string[]
}

export interface PersistenceConfig {
  strategy: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'cookie' | 'none'
  keys: string[]
  encryption?: boolean
  expiration?: number
}

export interface HydrationConfig {
  strategy: 'ssr' | 'csr' | 'streaming' | 'progressive'
  priority: 'high' | 'normal' | 'low'
  fallback?: string
}

export interface ThemingStrategy {
  mode: 'static' | 'dynamic' | 'context-aware' | 'ai-adaptive'
  defaultDNA: string
  fallbackDNA: string
  transitions: ThemeTransition[]
  mutations: ContextMutation[]
  userOverrides: boolean
}

export interface ThemeTransition {
  from: string | '*'
  to: string | '*'
  duration: number
  easing: string
  properties: string[]
}

export interface ContextMutation {
  id: string
  name: string
  description?: string
  condition: (ctx: TokenResolutionContext) => boolean
  mutations: TokenMutation[]
  priority: number
  reversible: boolean
  tags: string[]
}

export interface EcosystemTemplate {
  id: string
  name: string
  category: 'dashboard' | 'landing' | 'auth' | 'settings' | 'editor' | 'viewer' | 'marketing' | 'docs' | 'display' | 'documentation'
  description?: string
  organisms: string[] // organism IDs
  globalState: GlobalStateRecipe
  theming: ThemingStrategy
  seo: SEORecipe
  performance: PerformanceRecipe
  analytics: AnalyticsRecipe
  i18n: I18nRecipe
}

export interface SEORecipe {
  title: string
  description: string
  keywords: string[]
  openGraph: OpenGraphRecipe
  twitterCard: TwitterCardRecipe
  jsonLd: JSONLDRecipe[]
}

export interface OpenGraphRecipe {
  type: string
  locale: string
  url: string
  siteName: string
  images: OGImage[]
}

export interface OGImage {
  url: string
  width: number
  height: number
  alt: string
}

export interface TwitterCardRecipe {
  card: 'summary' | 'summary_large_image' | 'app' | 'player'
  site: string
  creator?: string
}

export interface JSONLDRecipe {
  type: string
  data: Record<string, any>
}

export interface PerformanceRecipe {
  budgets: PerformanceBudget
  optimizations: OptimizationStrategy[]
  monitoring: MonitoringConfig
}

export interface OptimizationStrategy {
  type: 'code-split' | 'lazy-load' | 'preload' | 'prefetch' | 'tree-shake' | 'inline-critical' | 'compress' | 'cache'
  targets: string[]
  config: Record<string, any>
}

export interface MonitoringConfig {
  vitals: boolean
  customMetrics: CustomMetric[]
  alerts: AlertRule[]
}

export interface CustomMetric {
  name: string
  type: 'timing' | 'count' | 'gauge' | 'histogram'
  threshold?: number
}

export interface AlertRule {
  metric: string
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  threshold: number
  severity: 'info' | 'warning' | 'critical'
  notification: 'log' | 'console' | 'webhook' | 'email'
}

export interface AnalyticsRecipe {
  provider: 'ga4' | 'matomo' | 'plausible' | 'custom' | 'none'
  events: AnalyticsEvent[]
  consent: ConsentConfig
}

export interface AnalyticsEvent {
  name: string
  trigger: string
  properties: Record<string, string>
  pii: boolean
}

export interface ConsentConfig {
  required: boolean
  categories: ConsentCategory[]
  defaultDeny: boolean
}

export interface ConsentCategory {
  id: string
  name: string
  description: string
  required: boolean
}

export interface I18nRecipe {
  defaultLocale: string
  supportedLocales: string[]
  fallbackLocale: string
  namespaces: string[]
  interpolation: InterpolationConfig
}

export interface InterpolationConfig {
  prefix: string
  suffix: string
  escapeValue: boolean
  format: (value: any, format: string, locale: string) => string
}

// ============================================
// SVG PRIMITIVES
// ============================================

export interface SVGPrimitives {
  // Geometry
  pathData: Record<string, PathDefinition>
  shapePresets: Record<string, ShapePreset>

  // Paint
  fills: Record<string, PaintDefinition>
  strokes: Record<string, StrokeDefinition>
  gradients: Record<string, GradientDefinition>
  patterns: Record<string, PatternDefinition>
  filters: Record<string, FilterDefinition>

  // Animation
  motionPaths: Record<string, MotionPathDefinition>
  easingCurves: Record<string, EasingDefinition>
  keyframeSets: Record<string, KeyframeSet>

  // Layout
  viewBoxPresets: Record<string, ViewBoxPreset>
  coordinateSystems: Record<string, CoordinateSystem>

  // Semantic
  iconRoles: Record<string, IconRole>
  sizeScales: Record<string, SizeScale>
  densityTokens: Record<string, DensityToken>
}

export interface ShapePreset {
  type: 'rect' | 'circle' | 'ellipse' | 'polygon' | 'path' | 'rounded-rect' | 'pill' | 'chevron' | 'star' | 'gear' | 'custom'
  params: Record<string, number | string>
  pathTemplate?: string // with {{params}} placeholders
}

export interface PaintDefinition {
  type: 'solid' | 'gradient' | 'pattern' | 'none'
  color?: string // tokenId
  gradient?: string // tokenId
  pattern?: string // tokenId
  opacity?: number | string // tokenId
  fillRule?: 'nonzero' | 'evenodd'
}

export interface StrokeDefinition {
  width: number | string // tokenId
  color: string // tokenId
  opacity?: number | string // tokenId
  dashArray?: number[]
  dashOffset?: number
  lineCap?: 'butt' | 'round' | 'square'
  lineJoin?: 'miter' | 'round' | 'bevel'
  miterLimit?: number
}

export interface PatternDefinition {
  id: string
  patternUnits: 'userSpaceOnUse' | 'objectBoundingBox'
  contentUnits: 'userSpaceOnUse' | 'objectBoundingBox'
  width: number | string
  height: number | string
  elements: PatternElement[]
}

export interface PatternElement {
  type: 'rect' | 'circle' | 'path' | 'image' | 'text'
  attributes: Record<string, string | number>
}

export interface FilterDefinition {
  id: string
  primitives: FilterPrimitive[]
  type?: string
  params?: Record<string, string | number>
}

export interface FilterPrimitive {
  type: 'blur' | 'gaussian-blur' | 'backdrop-blur' | 'drop-shadow' | 'offset' | 'color-matrix' | 'component-transfer' | 'composite' | 'morphology' | 'turbulence' | 'displacement-map' | 'convolve-matrix'
  in?: string
  in2?: string
  result?: string
  attributes: Record<string, string | number>
}

export interface MotionPathDefinition {
  path: string // tokenId
  rotate?: 'auto' | 'auto-reverse' | number
  origin?: 'center' | 'auto' | string
}

export interface KeyframeSet {
  name: string
  keyframes: Keyframe[]
  duration?: string
  iterations?: string | number
  easing?: string
}

export interface Keyframe {
  offset: number // 0-1 or 'from'/'to'
  properties?: Record<string, string | number>
  easing?: string // tokenId
  composite?: 'replace' | 'add' | 'accumulate'
  transform?: string
  opacity?: number
  filter?: string
}

export interface ViewBoxPreset {
  x: number
  y: number
  width: number
  height: number
  preserveAspectRatio?: string
}

export interface CoordinateSystem {
  type: 'cartesian' | 'polar' | 'isometric' | 'custom'
  origin: 'center' | 'top-left' | 'bottom-left' | 'custom'
  scale: number
  rotation: number
  flipX: boolean
  flipY: boolean
}

export interface IconRole {
  category: 'navigation' | 'action' | 'status' | 'decoration' | 'brand' | 'file' | 'media' | 'communication' | 'system'
  interactive: boolean
  semanticMeaning: string
  sizes: Record<string, number> // context -> size in px
  states: Record<string, IconState>
}

export interface IconState {
  fill?: string // tokenId
  stroke?: string // tokenId
  opacity?: number
  transform?: string
  animation?: string // keyframe tokenId
  outline?: string // tokenId
}

export interface SizeScale {
  name: string
  base: number
  scale: number[]
  remBase: number
  usage: 'icon' | 'illustration' | 'avatar' | 'logo' | 'chart' | 'diagram'
}

export interface DensityToken {
  name: string
  multiplier: number
  spacingScale: number
  borderScale: number
  radiusScale: number
  shadowScale: number
  description: string
}

// ============================================
// MUTATIONS & VERSIONING
// ============================================

export type MutationOperation =
  | 'set' | 'add' | 'remove' | 'replace' | 'transform'
  | 'scale' | 'shift' | 'blend' | 'invert' | 'derive'

export interface TokenMutation {
  id: string
  op: MutationOperation
  path?: string // tokenId or JSON path
  target?: string // alias for path (for backward compatibility)
  value?: any
  transform?: string // transform function ID
  condition?: string // predicate function ID
  priority?: number // mutation priority
  metadata?: Record<string, any>
}

export interface MutationSet {
  id: string
  name: string
  description?: string
  mutations: TokenMutation[]
  tags: string[]
  version: string
}

export interface DNAVersion {
  version: string // SemVer
  parent: string | null
  patches: TokenPatch[]
  migrations: MigrationDefinition[]
  compatibility: CompatibilityMatrix
  timestamp: number
  author: string
  message: string
}

export interface TokenPatch {
  op: 'add' | 'remove' | 'replace' | 'transform'
  path: string
  value?: any
  transform?: (old: any) => any
  condition?: (ctx: TokenResolutionContext) => boolean
}

export interface MigrationDefinition {
  fromVersion: string
  toVersion: string
  up: (graph: TokenGraphEngine) => TokenGraphEngine
  down: (graph: TokenGraphEngine) => TokenGraphEngine
  description: string
  breaking: boolean
}

export interface CompatibilityMatrix {
  browsers: Record<string, string> // browser -> minimum version
  runtimes: Record<string, string> // runtime -> minimum version
  dependencies: Record<string, string> // package -> version range
  features: string[] // required platform features
}

// ============================================
// AI INTELLIGENCE
// ============================================

export interface DesignIntent {
  brand: string
  personality: string[]
  industry?: string
  targetAudience?: string
  constraints: DesignConstraint[]
  references: DesignReference[]
  preferences: DesignPreference[]
  mustHave: string[]
  mustNotHave: string[]
}

export interface DesignConstraint {
  type: 'accessibility' | 'performance' | 'brand' | 'technical' | 'legal' | 'budget' | 'bundle-size'
  severity: 'hard' | 'soft'
  rule: string
  value?: any
}

export interface DesignReference {
  url: string
  aspects: ('color' | 'typography' | 'spacing' | 'layout' | 'motion' | 'interaction' | 'svg')[]
  weight: number
  notes?: string
}

export interface DesignPreference {
  category: string
  value: string
  strength: number // 0-1
}

export interface DesignDirection {
  type: 'evolve' | 'branch' | 'contrast' | 'minimal' | 'bold' | 'warm' | 'cool' | 'technical' | 'organic'
  intensity: number // 0-1
  preserve: string[] // token IDs to keep
  explore: string[] // token IDs to vary
}

export interface DesignExample {
  name: string
  type: 'component' | 'pattern' | 'page' | 'system'
  screenshot?: string
  tokens: Record<string, any>
  metadata: Record<string, any>
}

export interface DriftReport {
  timestamp: number
  baselineVersion: string
  currentVersion: string
  changes: DriftChange[]
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical'
  recommendations: DriftRecommendation[]
}

export interface DriftChange {
  tokenId: string
  type: 'value' | 'constraint' | 'dependency' | 'metadata'
  oldValue: any
  newValue: any
  impact: 'none' | 'visual' | 'functional' | 'breaking'
  affectedComponents: string[]
}

export interface DriftRecommendation {
  type: 'revert' | 'update-baseline' | 'migrate' | 'document' | 'review'
  tokenIds: string[]
  reason: string
  effort: 'trivial' | 'small' | 'medium' | 'large'
  priority: number
}

export interface RankedDNAMatch {
  dnaId: string
  score: number
  reasons: string[]
  gaps: string[]
  effort: 'trivial' | 'small' | 'medium' | 'large'
}

// ============================================
// COMPILATION & RUNTIME
// ============================================

export interface CompileContext {
  target: 'css-vars' | 'json' | 'ts' | 'scss' | 'figma' | 'style-dictionary'
  includeMetadata: boolean
  minify: boolean
  prefix: string
  format: 'flat' | 'nested' | 'cti' // CTI = Community Token Format
  treeShake: boolean
  usageMap?: UsageMap
}

export interface UsageMap {
  tokens: Map<string, number> // tokenId -> usage count
  components: Map<string, string[]> // componentId -> tokenIds
  pages: Map<string, string[]> // pageId -> componentIds
}

export interface DNAPhenotype {
  cssVariables: Record<string, string>
  designTokens: Record<string, any> // Style Dictionary / CTI format
  componentRecipes: Record<string, ComponentMolecule>
  organismPatterns: Record<string, OrganismPattern>
  ecosystemTemplates: Record<string, EcosystemTemplate>
  svgPrimitives: SVGPrimitives
  tokenGraph: TokenGraph
  version: string
  checksum: string
  compiledAt: number
  compileTime: number
}

export interface DNAGenotype {
  id: string
  name: string
  version: string
  description?: string
  extends?: string
  primitives: Record<string, PrimitiveToken>
  molecules: Record<string, ComponentMolecule>
  organisms: Record<string, OrganismPattern>
  ecosystems: Record<string, EcosystemTemplate>
  svg: SVGPrimitives
  contextMutations: ContextMutation[]
  versionHistory: DNAVersion[]
  metadata: DNAMetadata
}

export interface DNAMetadata {
  author: string
  createdAt: number
  updatedAt: number
  tags: string[]
  category: string
  license: string
  repository?: string
  documentation?: string
  changelog?: string
}

export interface DNARuntime {
  genotype: DNAGenotype
  phenotype: DNAPhenotype
  context: TokenResolutionContext
  tokens: ReactiveTokenMap
  subscriptions: Map<string, Set<TokenSubscriber>>
  mutationQueue: TokenMutation[]
  applying: boolean
  metrics: RuntimeMetrics
}

export interface ReactiveTokenMap {
  get(tokenId: string): ComputedTokenValue
  set(tokenId: string, value: any): void
  subscribe(tokenId: string, listener: TokenSubscriber): () => void
  unsubscribe(tokenId: string, listener: TokenSubscriber): void
  batch(mutations: TokenMutation[]): void
  flush(): void
}

export type TokenSubscriber = (value: ComputedTokenValue) => void

export interface RuntimeMetrics {
  resolutionTimes: Map<string, number>
  mutationCount: number
  recompilationCount: number
  cacheHitRate: number
  memoryUsage: number
  lastGC: number
}

// ============================================
// MAIN EXPORTS
// ============================================

export type AnyPrimitiveToken =
  | ColorToken
  | NumberToken
  | StringToken
  | FunctionToken
  | ReferenceToken
  | GradientToken
  | ShadowToken
  | TransitionToken
  | PathToken
  | EasingToken
  | PrimitiveToken<any>

export type DNAConfig = DNAGenotype // Legacy alias

export interface DNASystem {
  // Genotype management
  createGenotype(config: Partial<DNAGenotype>): DNAGenotype
  extendGenotype(base: DNAGenotype, extensions: Partial<DNAGenotype>): DNAGenotype
  mergeGenotypes(...genotypes: DNAGenotype[]): DNAGenotype
  validateGenotype(genotype: DNAGenotype): ValidationResult

  // Compilation
  compile(genotype: DNAGenotype, context: CompileContext): DNAPhenotype
  recompile(phenotype: DNAPhenotype, mutations: TokenMutation[]): DNAPhenotype

  // Runtime
  createRuntime(phenotype: DNAPhenotype, initialContext: TokenResolutionContext): DNARuntime

  // Intelligence
  synthesize(intent: DesignIntent): Promise<DNAGenotype>
  optimize(genotype: DNAGenotype, constraints: DesignConstraint[]): Promise<DNAGenotype>
  predict(partial: Partial<DNAGenotype>, direction: DesignDirection): Promise<DNAGenotype[]>
  match(criteria: DesignCriteria): Promise<RankedDNAMatch[]>
  detectDrift(baseline: DNAGenotype, current: DNAGenotype): DriftReport

  // Versioning
  createVersion(genotype: DNAGenotype, message: string): DNAVersion
  migrate(genotype: DNAGenotype, targetVersion: string): DNAGenotype
  diff(from: DNAGenotype, to: DNAGenotype): DiffResult
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: ValidationSuggestion[]
}

export interface ValidationError {
  path: string
  code: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  path: string
  code: string
  message: string
}

export interface ValidationSuggestion {
  path: string
  code: string
  message: string
  autoFix?: () => void
}

export interface DiffResult {
  added: string[]
  removed: string[]
  changed: DiffChange[]
  unchanged: string[]
}

export interface DiffChange {
  path: string
  oldValue: any
  newValue: any
  type: 'value' | 'type' | 'metadata'
  breaking: boolean
}

export interface DesignCriteria {
  category?: string
  tags?: string[]
  constraints?: DesignConstraint[]
  mustHaveTokens?: string[]
  mustNotHaveTokens?: string[]
  similarityThreshold?: number
}