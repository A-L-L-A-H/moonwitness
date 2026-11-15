// DNA System - Compiler Engine
// Compiles genotype → phenotype (CSS vars, design tokens, component configs)

import type {
  DNAGenotype,
  DNAPhenotype,
  CompileContext,
  PrimitiveToken,
  ComponentMolecule,
  OrganismPattern,
  EcosystemTemplate,
  SVGPrimitives,
  TokenGraph,
  UsageMap,
  AnyPrimitiveToken,
} from '../types'

import { TokenGraphEngine, createTokenGraph } from './token-graph'
import { allPrimitives } from '../primitives'

// ============================================
// DNA COMPILER
// ============================================

export class DNACompiler {
  private genotype: DNAGenotype
  private tokenGraph: TokenGraphEngine
  private context: CompileContext

  constructor(genotype: DNAGenotype, context: CompileContext) {
    this.genotype = genotype
    this.context = context
    this.tokenGraph = this.buildTokenGraph()
  }

  private buildTokenGraph(): TokenGraphEngine {
    // Merge base primitives with genotype primitives
    const allTokens: Record<string, AnyPrimitiveToken> = {
      ...allPrimitives,
      ...this.genotype.primitives,
    }

    return createTokenGraph(allTokens)
  }

  compile(): DNAPhenotype {
    const startTime = performance.now()

    // Resolve all tokens
    const resolvedTokens = this.tokenGraph.resolveAll()

    // Generate CSS variables
    const cssVariables = this.generateCSSVariables(resolvedTokens)

    // Generate design tokens (Style Dictionary / CTI format)
    const designTokens = this.generateDesignTokens(resolvedTokens)

    // Compile component recipes
    const componentRecipes = this.compileComponentRecipes(resolvedTokens)

    // Compile organism patterns
    const organismPatterns = this.compileOrganismPatterns(resolvedTokens)

    // Compile ecosystem templates
    const ecosystemTemplates = this.compileEcosystemTemplates(resolvedTokens)

    // Compile SVG primitives
    const svgPrimitives = this.compileSVGPrimitives(resolvedTokens)

    // Export token graph
    const tokenGraph = this.tokenGraph.exportGraph()

    const compileTime = performance.now() - startTime

    return {
      cssVariables,
      designTokens,
      componentRecipes,
      organismPatterns,
      ecosystemTemplates,
      svgPrimitives,
      tokenGraph,
      version: this.genotype.version,
      checksum: tokenGraph.checksum,
      compiledAt: Date.now(),
      compileTime,
    }
  }

  // ============================================
  // CSS VARIABLE GENERATION
  // ============================================

  private generateCSSVariables(resolvedTokens: Map<string, any>): Record<string, string> {
    const variables: Record<string, string> = {}

    for (const [tokenId, result] of resolvedTokens) {
      if (!result.resolved) continue

      const token = this.tokenGraph.getToken(tokenId)
      if (!token) continue

      const cssName = this.toCSSVariableName(tokenId, token as AnyPrimitiveToken)

      switch (token.type) {
        case 'color':
        case 'number':
        case 'string':
        case 'reference':
          variables[cssName] = String(result.value)
          break

        case 'gradient':
          variables[cssName] = result.value
          break

        case 'shadow':
          variables[cssName] = result.value
          break

        case 'transition':
          variables[cssName] = result.value
          break

        case 'path':
          variables[cssName] = result.value
          break

        case 'easing':
          variables[cssName] = result.value
          break

        case 'function':
          // Functions are not directly output as CSS vars
          break
      }
    }

    return variables
  }

  private toCSSVariableName(tokenId: string, token: AnyPrimitiveToken): string {
    const prefix = this.context.prefix || '--'

    // Use semantic role if available
    if (token.metadata.semanticRole) {
      return `${prefix}${this.slugify(token.metadata.semanticRole)}`
    }

    return `${prefix}${this.slugify(tokenId)}`
  }

  private slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // ============================================
  // DESIGN TOKENS (Style Dictionary / CTI Format)
  // ============================================

  private generateDesignTokens(resolvedTokens: Map<string, any>): Record<string, any> {
    const tokens: Record<string, any> = {}

    // Group by category
    const byCategory = new Map<string, Map<string, any>>()

    for (const [tokenId, result] of resolvedTokens) {
      if (!result.resolved) continue

      const token = this.tokenGraph.getToken(tokenId)
      if (!token) continue

      const category = token.metadata.category
      if (!byCategory.has(category)) {
        byCategory.set(category, new Map())
      }

      const tokenData = this.formatTokenForCTI(token as AnyPrimitiveToken, result.value)
      byCategory.get(category)!.set(tokenId, tokenData)
    }

    // Format based on output format
    switch (this.context.format) {
      case 'cti':
        return this.formatCTI(byCategory)
      case 'nested':
        return this.formatNested(byCategory)
      case 'flat':
      default:
        return this.formatFlat(byCategory)
    }
  }

  private formatTokenForCTI(token: AnyPrimitiveToken, value: any): any {
    const base: any = {
      $value: value,
      $type: this.mapTypeToCTI(token.type),
      $description: token.metadata.description,
      $extensions: {
        'dna': {
          semanticRole: token.metadata.semanticRole,
          constraints: token.metadata.constraints,
          dependencies: token.metadata.dependencies,
          version: token.metadata.version,
          source: token.metadata.source,
        },
      },
    }

    // Add type-specific extensions
    if (token.type === 'color' && 'colorSpace' in token && token.colorSpace) {
      base.$extensions.dna.colorSpace = token.colorSpace
    }
    if (token.type === 'number' && 'unit' in token && token.unit) {
      base.$extensions.dna.unit = token.unit
    }

    return base
  }

  private mapTypeToCTI(type: string): string {
    switch (type) {
      case 'color': return 'color'
      case 'number': return 'dimension'
      case 'string': return 'fontFamily' // or 'string'
      case 'gradient': return 'gradient'
      case 'shadow': return 'shadow'
      case 'transition': return 'transition'
      case 'easing': return 'easing'
      case 'path': return 'path'
      default: return 'string'
    }
  }

  private formatCTI(byCategory: Map<string, Map<string, any>>): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [category, tokens] of byCategory) {
      result[category] = {}
      for (const [tokenId, tokenData] of tokens) {
        result[category][this.slugify(tokenId)] = tokenData
      }
    }

    return result
  }

  private formatNested(byCategory: Map<string, Map<string, any>>): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [category, tokens] of byCategory) {
      result[category] = {}
      for (const [tokenId, tokenData] of tokens) {
        result[category][tokenId] = tokenData.$value
      }
    }

    return result
  }

  private formatFlat(byCategory: Map<string, Map<string, any>>): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [, tokens] of byCategory) {
      for (const [tokenId, tokenData] of tokens) {
        result[tokenId] = tokenData.$value
      }
    }

    return result
  }

  // ============================================
  // COMPONENT RECIPE COMPILATION
  // ============================================

  private compileComponentRecipes(
    resolvedTokens: Map<string, any>
  ): Record<string, ComponentMolecule> {
    const recipes: Record<string, ComponentMolecule> = {}

    for (const [componentId, molecule] of Object.entries(this.genotype.molecules)) {
      recipes[componentId] = this.compileMolecule(molecule, resolvedTokens)
    }

    return recipes
  }

  private compileMolecule(
    molecule: ComponentMolecule,
    resolvedTokens: Map<string, any>
  ): ComponentMolecule {
    // Resolve token references in molecule
    const compiledVariants: Record<string, any> = {}

    for (const [variantName, variant] of Object.entries(molecule.variants)) {
      compiledVariants[variantName] = this.compileVariant(variant, resolvedTokens)
    }

    return {
      ...molecule,
      variants: compiledVariants,
    }
  }

  private compileVariant(
    variant: any,
    resolvedTokens: Map<string, any>
  ): any {
    return {
      ...variant,
      base: this.resolveRecipeTokens(variant.base, resolvedTokens),
      states: Object.fromEntries(
        Object.entries(variant.states).map(([stateName, state]) => [
          stateName,
          this.resolveRecipeTokens(state, resolvedTokens),
        ])
      ),
      sizes: variant.sizes ? Object.fromEntries(
        Object.entries(variant.sizes).map(([sizeName, size]) => [
          sizeName,
          this.compileVariant(size, resolvedTokens),
        ])
      ) : undefined,
    }
  }

  private resolveRecipeTokens(recipe: any, resolvedTokens: Map<string, any>): any {
    if (!recipe || !recipe.tokens) return recipe

    const resolved: Record<string, any> = {}
    for (const [property, tokenId] of Object.entries(recipe.tokens)) {
      const result = resolvedTokens.get(tokenId as string)
      if (result?.resolved) {
        resolved[property] = result.value
      } else {
        resolved[property] = tokenId // Keep reference if not resolved
      }
    }

    return {
      ...recipe,
      tokens: resolved,
    }
  }

  // ============================================
  // ORGANISM PATTERN COMPILATION
  // ============================================

  private compileOrganismPatterns(
    resolvedTokens: Map<string, any>
  ): Record<string, OrganismPattern> {
    const patterns: Record<string, OrganismPattern> = {}

    for (const [patternId, organism] of Object.entries(this.genotype.organisms)) {
      patterns[patternId] = this.compileOrganism(organism, resolvedTokens)
    }

    return patterns
  }

  private compileOrganism(
    organism: OrganismPattern,
    resolvedTokens: Map<string, any>
  ): OrganismPattern {
    return {
      ...organism,
      states: Object.fromEntries(
        Object.entries(organism.states).map(([stateName, state]) => [
          stateName,
          {
            ...state,
            mutations: state.mutations.map(m => this.resolveMutationToken(m, resolvedTokens)),
          },
        ])
      ),
    }
  }

  private resolveMutationToken(mutation: any, resolvedTokens: Map<string, any>): any {
    if (mutation.path && resolvedTokens.has(mutation.path)) {
      const result = resolvedTokens.get(mutation.path)
      if (result?.resolved) {
        return { ...mutation, resolvedValue: result.value }
      }
    }
    return mutation
  }

  // ============================================
  // ECOSYSTEM TEMPLATE COMPILATION
  // ============================================

  private compileEcosystemTemplates(
    resolvedTokens: Map<string, any>
  ): Record<string, EcosystemTemplate> {
    const templates: Record<string, EcosystemTemplate> = {}

    for (const [templateId, ecosystem] of Object.entries(this.genotype.ecosystems)) {
      templates[templateId] = this.compileEcosystem(ecosystem, resolvedTokens)
    }

    return templates
  }

  private compileEcosystem(
    ecosystem: EcosystemTemplate,
    resolvedTokens: Map<string, any>
  ): EcosystemTemplate {
    return {
      ...ecosystem,
      theming: {
        ...ecosystem.theming,
        mutations: ecosystem.theming.mutations.map(m => ({
          ...m,
          mutations: m.mutations.map(mut => this.resolveMutationToken(mut, resolvedTokens)),
        })),
      },
    }
  }

  // ============================================
  // SVG PRIMITIVES COMPILATION
  // ============================================

  private compileSVGPrimitives(
    resolvedTokens: Map<string, any>
  ): SVGPrimitives {
    const svg = this.genotype.svg

    return {
      pathData: this.compileRecord(svg.pathData, resolvedTokens),
      shapePresets: svg.shapePresets,
      fills: this.compileRecord(svg.fills, resolvedTokens),
      strokes: this.compileRecord(svg.strokes, resolvedTokens),
      gradients: this.compileRecord(svg.gradients, resolvedTokens),
      patterns: svg.patterns,
      filters: svg.filters,
      motionPaths: svg.motionPaths,
      easingCurves: svg.easingCurves,
      keyframeSets: svg.keyframeSets,
      viewBoxPresets: svg.viewBoxPresets,
      coordinateSystems: svg.coordinateSystems,
      iconRoles: svg.iconRoles,
      sizeScales: svg.sizeScales,
      densityTokens: svg.densityTokens,
    }
  }

  private compileRecord(
    record: Record<string, any>,
    resolvedTokens: Map<string, any>
  ): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(record)) {
      if (value && typeof value === 'object' && 'color' in value) {
        // Paint definition with token reference
        const paintDef = { ...value }
        if (typeof paintDef.color === 'string' && resolvedTokens.has(paintDef.color)) {
          const tokenResult = resolvedTokens.get(paintDef.color)
          if (tokenResult?.resolved) {
            paintDef.color = tokenResult.value
          }
        }
        result[key] = paintDef
      } else if (value && typeof value === 'object' && 'width' in value) {
        // Stroke definition
        const strokeDef = { ...value }
        if (typeof strokeDef.color === 'string' && resolvedTokens.has(strokeDef.color)) {
          const tokenResult = resolvedTokens.get(strokeDef.color)
          if (tokenResult?.resolved) {
            strokeDef.color = tokenResult.value
          }
        }
        result[key] = strokeDef
      } else {
        result[key] = value
      }
    }

    return result
  }

  // ============================================
  // TREE SHAKING
  // ============================================

  treeShake(phenotype: DNAPhenotype, usageMap: UsageMap): DNAPhenotype {
    // Find unused tokens
    const usedTokens = new Set<string>()
    for (const tokenId of usageMap.tokens.keys()) {
      usedTokens.add(tokenId)
    }

    // Filter CSS variables
    const filteredCSSVars: Record<string, string> = {}
    for (const [name, value] of Object.entries(phenotype.cssVariables)) {
      const tokenId = this.cssVarToTokenId(name)
      if (tokenId && usedTokens.has(tokenId)) {
        filteredCSSVars[name] = value
      } else if (!tokenId) {
        // Keep variables that can't be mapped
        filteredCSSVars[name] = value
      }
    }

    // Filter design tokens
    const filteredDesignTokens = this.treeShakeDesignTokens(
      phenotype.designTokens,
      usedTokens
    )

    return {
      ...phenotype,
      cssVariables: filteredCSSVars,
      designTokens: filteredDesignTokens,
    }
  }

  private treeShakeDesignTokens(
    tokens: Record<string, any>,
    usedTokens: Set<string>
  ): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(tokens)) {
      if (usedTokens.has(key) || typeof value !== 'object') {
        result[key] = value
      } else if (value && typeof value === 'object') {
        const filtered = this.treeShakeDesignTokens(value, usedTokens)
        if (Object.keys(filtered).length > 0) {
          result[key] = filtered
        }
      }
    }

    return result
  }

  private cssVarToTokenId(cssVar: string): string | null {
    // Reverse lookup would need a mapping - simplified
    return null
  }
}

// ============================================
// INCREMENTAL COMPILER
// ============================================

export class IncrementalCompiler {
  private compiler: DNACompiler
  private previousPhenotype: DNAPhenotype | null = null
  private previousMutations: Map<string, any> = new Map()

  constructor(genotype: DNAGenotype, context: CompileContext) {
    this.compiler = new DNACompiler(genotype, context)
  }

  compile(): DNAPhenotype {
    this.previousPhenotype = this.compiler.compile()
    return this.previousPhenotype
  }

  recompile(mutations: any[]): DNAPhenotype {
    if (!this.previousPhenotype) {
      return this.compile()
    }

    // Apply mutations to token graph
    for (const mutation of mutations) {
      this.compiler['tokenGraph'].queueMutation(mutation)
    }
    this.compiler['tokenGraph'].applyMutations()

    // Recompile only affected parts
    const newPhenotype = this.compiler.compile()

    // Calculate diff
    const diff = this.calculateDiff(this.previousPhenotype, newPhenotype)

    this.previousPhenotype = newPhenotype
    return newPhenotype
  }

  private calculateDiff(old: DNAPhenotype, new_: DNAPhenotype): any {
    return {
      cssVariables: this.diffObject(old.cssVariables, new_.cssVariables),
      designTokens: this.diffObject(old.designTokens, new_.designTokens),
    }
  }

  private diffObject(old: Record<string, any>, new_: Record<string, any>): any {
    const added: string[] = []
    const removed: string[] = []
    const changed: Record<string, { old: any; new: any }> = {}

    for (const key of Object.keys(new_)) {
      if (!(key in old)) {
        added.push(key)
      } else if (old[key] !== new_[key]) {
        changed[key] = { old: old[key], new: new_[key] }
      }
    }

    for (const key of Object.keys(old)) {
      if (!(key in new_)) {
        removed.push(key)
      }
    }

    return { added, removed, changed }
  }
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createCompiler(
  genotype: DNAGenotype,
  context: CompileContext
): DNACompiler {
  return new DNACompiler(genotype, context)
}

export function createIncrementalCompiler(
  genotype: DNAGenotype,
  context: CompileContext
): IncrementalCompiler {
  return new IncrementalCompiler(genotype, context)
}

export function compileDNA(
  genotype: DNAGenotype,
  context?: Partial<CompileContext>
): DNAPhenotype {
  const defaultContext: CompileContext = {
    target: 'css-vars',
    includeMetadata: true,
    minify: false,
    prefix: '--',
    format: 'flat',
    treeShake: false,
    ...context,
  }

  const compiler = createCompiler(genotype, defaultContext)
  return compiler.compile()
}