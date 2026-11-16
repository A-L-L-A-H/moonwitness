// DNA System - Runtime Engine
// Client-side reactive runtime for DNA system

import type {
  DNAGenotype,
  DNAPhenotype,
  DNARuntime,
  TokenResolutionContext,
  ReactiveTokenMap,
  ComputedTokenValue,
  TokenMutation,
  RuntimeMetrics,
  ContextMutation,
  DNAVersion,
  AnyPrimitiveToken,
  TokenSubscriber,
} from '../types'

import { TokenGraphEngine, ReactiveTokenMapImpl, createTokenGraph } from './token-graph'
import { DNACompiler, createCompiler } from './compiler'
import { allPrimitives } from '../primitives'

// ============================================
// DNA RUNTIME
// ============================================

export class DNARuntimeImpl implements DNARuntime {
  genotype: DNAGenotype
  phenotype: DNAPhenotype
  context: TokenResolutionContext
  tokens: ReactiveTokenMap
  subscriptions: Map<string, Set<TokenSubscriber>> = new Map()
  mutationQueue: TokenMutation[] = []
  applying: boolean = false
  metrics: RuntimeMetrics
  private engine: TokenGraphEngine
  private compiler: DNACompiler
  private contextMutations: ContextMutation[] = []
  private observers: MutationObserver | null = null

  constructor(
    genotype: DNAGenotype,
    phenotype: DNAPhenotype,
    initialContext: TokenResolutionContext
  ) {
    this.genotype = genotype
    this.phenotype = phenotype
    this.context = initialContext

    // Initialize token graph with compiled phenotype tokens
    this.engine = createTokenGraph(this.phenotype.tokenGraph.nodes as any, initialContext)
    this.tokens = new ReactiveTokenMapImpl(this.engine)

    // Initialize compiler for incremental updates
    this.compiler = createCompiler(genotype, {
      target: 'css-vars',
      includeMetadata: false,
      minify: true,
      prefix: '--',
      format: 'flat',
      treeShake: false,
    })

    // Initialize metrics
    this.metrics = {
      resolutionTimes: new Map(),
      mutationCount: 0,
      recompilationCount: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      lastGC: Date.now(),
    }

    // Apply CSS variables to document
    this.applyCSSVariables()

    // Setup context mutation observers
    this.setupContextObservers()

    // Evaluate context mutations
    this.evaluateContextMutations()
  }

  // ============================================
  // COMPONENT RESOLUTION
  // ============================================

  resolveComponent(
    component: string,
    variant: string,
    context: Record<string, any> = {}
  ): ResolvedComponentRecipe {
    const molecule = this.phenotype.componentRecipes[component]
    if (!molecule) {
      throw new Error(`Component not found: ${component}`)
    }

    const variantRecipe = molecule.variants[variant]
    if (!variantRecipe) {
      throw new Error(`Variant not found: ${variant} for component ${component}`)
    }

    // Apply size if specified
    let resolvedVariant = variantRecipe
    if (context.size && variantRecipe.sizes?.[context.size]) {
      const sizeVariant = variantRecipe.sizes[context.size]
      resolvedVariant = {
        ...variantRecipe,
        ...sizeVariant,
        base: sizeVariant.base,
        states: { ...variantRecipe.states, ...(sizeVariant.states || {}) },
        name: sizeVariant.name || variantRecipe.name,
      }
    }

    // Apply responsive variant if specified
    if (context.breakpoint && variantRecipe.responsive?.[context.breakpoint]) {
      resolvedVariant = variantRecipe.responsive[context.breakpoint]
    }

    // Merge state if specified
    if (context.state && resolvedVariant.states?.[context.state]) {
      const stateRecipe = resolvedVariant.states[context.state]
      resolvedVariant = this.mergeRecipes(resolvedVariant, stateRecipe)
    }

    return {
      component: molecule.component,
      variant,
      base: resolvedVariant.base,
      states: resolvedVariant.states,
      layout: this.resolveLayoutTokens(resolvedVariant.base.layout),
      behaviors: molecule.behaviors || [],
      accessibility: molecule.accessibility,
      toInlineStyles: () => this.recipeToInlineStyles(resolvedVariant.base),
      toCSSClasses: () => this.recipeToCSSClasses(molecule, variant, context),
    }
  }

  private mergeRecipes(base: any, override: any): any {
    return {
      ...base,
      tokens: { ...base.tokens, ...override.tokens },
      className: override.className || base.className,
      style: { ...base.style, ...override.style },
    }
  }

  private resolveLayoutTokens(layout?: any): any {
    if (!layout) return undefined

    const resolved: any = { ...layout }
    if (layout.gap && typeof layout.gap === 'string' && layout.gap.startsWith('--')) {
      const tokenResult = this.tokens.get(layout.gap.slice(2)) // Remove -- prefix
      if (tokenResult.resolved) {
        resolved.gap = tokenResult.value
      }
    }
    return resolved
  }

  private recipeToInlineStyles(recipe: any): React.CSSProperties {
    const styles: Record<string, any> = {}

    if (recipe.tokens) {
      for (const [property, value] of Object.entries(recipe.tokens)) {
        const cssProperty = this.toCSSProperty(property)
        styles[cssProperty] = value
      }
    }

    if (recipe.style) {
      Object.assign(styles, recipe.style)
    }

    return styles
  }

  private recipeToCSSClasses(molecule: any, variant: string, context: any): string[] {
    const classes = [
      `dna-component-${molecule.component.toLowerCase()}`,
      `dna-variant-${variant}`,
    ]

    if (context.size) {
      classes.push(`dna-size-${context.size}`)
    }
    if (context.state) {
      classes.push(`dna-state-${context.state}`)
    }

    return classes
  }

  private toCSSProperty(property: string): string {
    // Convert camelCase to kebab-case
    return property.replace(/([A-Z])/g, '-$1').toLowerCase()
  }

  // ============================================
  // CONTEXT MUTATION
  // ============================================

  mutateContext(mutation: ContextMutation): void {
    this.contextMutations.push(mutation)
    this.evaluateContextMutations()
  }

  removeContextMutation(mutationId: string): void {
    this.contextMutations = this.contextMutations.filter(m => m.id !== mutationId)
    this.recomputeFromContext()
  }

  private evaluateContextMutations(): void {
    for (const mutation of this.contextMutations) {
      if (mutation.condition(this.context)) {
        this.engine.queueMutations(mutation.mutations)
        this.engine.applyMutations()
      }
    }
  }

  private recomputeFromContext(): void {
    // Re-evaluate all context mutations
    this.engine.setContext(this.context)
    this.evaluateContextMutations()
    this.applyCSSVariables()
  }

  // ============================================
  // THEME TRANSITIONS
  // ============================================

  async transitionTo(
    targetGenotype: DNAGenotype,
    transitionConfig: TransitionConfig = {}
  ): Promise<void> {
    const {
      duration = 300,
      easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties = ['color', 'background-color', 'border-color', 'box-shadow'],
    } = transitionConfig

    // Compile target phenotype
    const targetCompiler = createCompiler(targetGenotype, {
      target: 'css-vars',
      includeMetadata: false,
      minify: true,
      prefix: '--',
      format: 'flat',
      treeShake: false,
    })
    const targetPhenotype = targetCompiler.compile()

    // Apply transition
    await this.animateTransition(this.phenotype.cssVariables, targetPhenotype.cssVariables, {
      duration,
      easing,
      properties,
    })

    // Swap genotype/phenotype
    this.genotype = targetGenotype
    this.phenotype = targetPhenotype

    // Rebuild engine
    this.engine = createTokenGraph(this.phenotype.tokenGraph.nodes as any, this.context)
    this.tokens = new ReactiveTokenMapImpl(this.engine)
    this.compiler = targetCompiler

    // Apply new CSS variables
    this.applyCSSVariables()
  }

  private animateTransition(
    from: Record<string, string>,
    to: Record<string, string>,
    config: { duration: number; easing: string; properties: string[] }
  ): Promise<void> {
    return new Promise(resolve => {
      const root = document.documentElement

      // Set transition properties
      const transitionProps = config.properties.join(', ')
      root.style.transition = `${transitionProps} ${config.duration}ms ${config.easing}`

      // Apply target values
      for (const [key, value] of Object.entries(to)) {
        root.style.setProperty(key, value)
      }

      // Wait for transition
      setTimeout(() => {
        root.style.transition = ''
        resolve()
      }, config.duration)
    })
  }

  // ============================================
  // CSS VARIABLE APPLICATION
  // ============================================

  private applyCSSVariables(): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    for (const [name, value] of Object.entries(this.phenotype.cssVariables)) {
      root.style.setProperty(name, value)
    }

    // Apply density
    const density = this.context.density
    const densityToken = this.engine.getToken(`density-${density}`)
    if (densityToken) {
      const result = this.engine.resolve(`density-${density}`)
      if (result.resolved) {
        root.style.setProperty('--density-multiplier', String(result.value))
      }
    }
  }

  // ============================================
  // CONTEXT OBSERVERS
  // ============================================

  private setupContextObservers(): void {
    if (typeof window === 'undefined') return

    // Media query observers
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: more)'),
      darkMode: window.matchMedia('(prefers-color-scheme: dark)'),
    }

    for (const [key, mq] of Object.entries(mediaQueries)) {
      mq.addEventListener('change', () => this.handleMediaChange(key, mq.matches))
    }

    // Resize observer for viewport
    this.observers = new MutationObserver(() => {
      this.updateViewportContext()
    })

    // Viewport resize
    window.addEventListener('resize', () => this.updateViewportContext())

    // Initial viewport
    this.updateViewportContext()
  }

  private handleMediaChange(key: string, matches: boolean): void {
    switch (key) {
      case 'reducedMotion':
        this.context.reducedMotion = matches
        break
      case 'highContrast':
        this.context.highContrast = matches
        break
      case 'darkMode':
        if (this.context.theme === 'system') {
          this.context.theme = matches ? 'dark' : 'light'
        }
        break
    }
    this.recomputeFromContext()
  }

  private updateViewportContext(): void {
    this.context.viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      breakpoint: this.getBreakpoint(window.innerWidth),
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      pixelRatio: window.devicePixelRatio,
    }
    this.recomputeFromContext()
  }

  private getBreakpoint(width: number): string {
    const breakpoints = [
      { name: '2xl', min: 1536 },
      { name: 'xl', min: 1280 },
      { name: 'lg', min: 1024 },
      { name: 'md', min: 768 },
      { name: 'sm', min: 640 },
      { name: 'xs', min: 0 },
    ]

    for (const bp of breakpoints) {
      if (width >= bp.min) return bp.name
    }
    return 'xs'
  }

  // ============================================
  // METRICS
  // ============================================

  getMetrics(): RuntimeMetrics {
    // Update cache hit rate
    const totalResolutions = this.engine.getTopologicalOrder().length
    const cachedResolutions = this.engine['computedCache'].size
    this.metrics.cacheHitRate = totalResolutions > 0 ? cachedResolutions / totalResolutions : 0

    // Estimate memory usage
    this.metrics.memoryUsage = this.estimateMemoryUsage()

    return { ...this.metrics }
  }

  private estimateMemoryUsage(): number {
    let bytes = 0
    for (const [, token] of this.engine['nodes']) {
      bytes += JSON.stringify(token).length * 2 // rough estimate
    }
    for (const [, value] of this.engine['computedCache']) {
      bytes += JSON.stringify(value).length * 2
    }
    return bytes
  }

  // ============================================
  // PERSISTENCE
  // ============================================

  serialize(): string {
    return JSON.stringify({
      genotype: this.genotype,
      context: this.context,
      phenotypeVersion: this.phenotype.version,
      phenotypeChecksum: this.phenotype.checksum,
    })
  }

  static deserialize(
    data: string,
    initialContext: TokenResolutionContext
  ): DNARuntimeImpl {
    const parsed = JSON.parse(data)
    const runtime = new DNARuntimeImpl(
      parsed.genotype,
      // Would need to recompile or store phenotype
      // For now, recompile
      createCompiler(parsed.genotype, {
        target: 'css-vars',
        includeMetadata: false,
        minify: true,
        prefix: '--',
        format: 'flat',
        treeShake: false,
      }).compile(),
      { ...initialContext, ...parsed.context }
    )
    return runtime
  }

  // ============================================
  // CLEANUP
  // ============================================

  destroy(): void {
    if (this.observers) {
      this.observers.disconnect()
      this.observers = null
    }
    this.subscriptions.clear()
    this.mutationQueue = []
    this.contextMutations = []
  }
}

// ============================================
// RESOLVED COMPONENT RECIPE
// ============================================

export interface ResolvedComponentRecipe {
  component: string
  variant: string
  base: any
  states: Record<string, any>
  layout: any
  behaviors: any[]
  accessibility: any
  toInlineStyles: () => React.CSSProperties
  toCSSClasses: () => string[]
}

// ============================================
// TRANSITION CONFIG
// ============================================

export interface TransitionConfig {
  duration?: number
  easing?: string
  properties?: string[]
  onComplete?: () => void
}

// ============================================
// HOOKS (React Integration)
// ============================================

import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react'

// DNA Runtime Context
const DNARuntimeContext = createContext<DNARuntimeImpl | null>(null)

export function DNARuntimeProvider({
  children,
  genotype,
  initialContext,
}: {
  children: React.ReactNode
  genotype: DNAGenotype
  initialContext: TokenResolutionContext
}) {
  const runtimeRef = useRef<DNARuntimeImpl | null>(null)

  if (!runtimeRef.current) {
    const compiler = createCompiler(genotype, {
      target: 'css-vars',
      includeMetadata: false,
      minify: true,
      prefix: '--',
      format: 'flat',
      treeShake: false,
    })
    const phenotype = compiler.compile()
    runtimeRef.current = new DNARuntimeImpl(genotype, phenotype, initialContext)
  }

  useEffect(() => {
    return () => runtimeRef.current?.destroy()
  }, [])

  return (
    <DNARuntimeContext.Provider value={runtimeRef.current}>
      {children}
    </DNARuntimeContext.Provider>
  )
}

export function useDNA(): DNARuntimeImpl {
  const runtime = useContext(DNARuntimeContext)
  if (!runtime) {
    throw new Error('useDNA must be used within DNARuntimeProvider')
  }
  return runtime
}

export function useToken(tokenId: string): ComputedTokenValue {
  const runtime = useDNA()

  return useSyncExternalStore(
    runtime.tokens.subscribe.bind(runtime.tokens, tokenId),
    () => runtime.tokens.get(tokenId),
    () => runtime.tokens.get(tokenId)
  )
}

export function useComponent(component: string, variant: string, context?: Record<string, any>): ResolvedComponentRecipe {
  const runtime = useDNA()

  // Use ref to avoid re-creating on every render
  const recipeRef = useRef<ResolvedComponentRecipe | null>(null)

  useEffect(() => {
    recipeRef.current = runtime.resolveComponent(component, variant, context)
  }, [runtime, component, variant, JSON.stringify(context)])

  return recipeRef.current!
}

export function useThemeTransition(): (targetGenotype: DNAGenotype, config?: TransitionConfig) => Promise<void> {
  const runtime = useDNA()
  return runtime.transitionTo.bind(runtime)
}

export function useContextMutation(): (mutation: ContextMutation) => void {
  const runtime = useDNA()
  return runtime.mutateContext.bind(runtime)
}

// ============================================
// FACTORY
// ============================================

export function createRuntime(
  genotype: DNAGenotype,
  initialContext: TokenResolutionContext
): DNARuntimeImpl {
  const compiler = createCompiler(genotype, {
    target: 'css-vars',
    includeMetadata: false,
    minify: true,
    prefix: '--',
    format: 'flat',
    treeShake: false,
  })
  const phenotype = compiler.compile()
  return new DNARuntimeImpl(genotype, phenotype, initialContext)
}

export function createDefaultContext(overrides: Partial<TokenResolutionContext> = {}): TokenResolutionContext {
  return {
    viewport: {
      width: typeof window !== 'undefined' ? window.innerWidth : 1920,
      height: typeof window !== 'undefined' ? window.innerHeight : 1080,
      breakpoint: 'xl',
      orientation: 'landscape',
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    },
    user: {
      theme: 'system',
      density: 'comfortable',
      reducedMotion: false,
      highContrast: false,
      fontSize: 1,
      language: 'en',
      region: 'US',
    },
    device: {
      hover: true,
      touch: false,
      pointer: 'fine',
      colorGamut: 'srgb',
      maxTextureSize: 4096,
      gpuTier: 'high',
    },
    time: {
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      season: 'spring',
      timeOfDay: 'morning',
    },
    locale: {
      language: 'en',
      region: 'US',
      direction: 'ltr',
      numberFormat: {},
      dateFormat: {},
      currency: 'USD',
    },
    performance: {
      maxBundleSize: 50000,
      maxRuntimeTokens: 1000,
      targetFPS: 60,
      maxCLS: 0.1,
      maxLCP: 2500,
      maxINP: 200,
    },
    brand: {
      primaryColors: [],
      secondaryColors: [],
      forbiddenColors: [],
      logoClearSpace: 24,
      minimumContrast: 4.5,
      typographyRules: [],
    },
    theme: 'system',
    density: 'comfortable',
    direction: 'ltr',
    reducedMotion: false,
    highContrast: false,
    ...overrides,
  }
}