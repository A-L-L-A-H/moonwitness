// DNA System - Token Graph Engine
// Reactive dependency graph for token resolution

import type {
  TokenGraph,
  PrimitiveToken,
  AnyPrimitiveToken,
  TokenResolutionContext,
  TokenMutation,
  MutationOperation,
  TokenConstraint,
} from '../types'

import { allPrimitives } from '../primitives'

// ============================================
// TYPES FOR EXTERNAL USE
// ============================================

export interface ComputedTokenValue {
  tokenId: string
  value: any
  resolved: boolean
  dependencies: string[]
  warnings: string[]
  errors: string[]
  computationTime: number
}

export type TokenSubscriber = (value: ComputedTokenValue) => void

// ============================================
// TOKEN GRAPH IMPLEMENTATION
// ============================================

export class TokenGraphEngine {
  private nodes: Map<string, PrimitiveToken> = new Map()
  private edges: Map<string, Set<string>> = new Map() // tokenId -> dependents
  private reverseEdges: Map<string, Set<string>> = new Map() // tokenId -> dependencies
  private topologicalOrder: string[] = []
  private version: string = '1.0.0'
  private checksum: string = ''
  private context: TokenResolutionContext | null = null
  private computedCache: Map<string, ComputedTokenValue> = new Map()
  private subscribers: Map<string, Set<(value: ComputedTokenValue) => void>> = new Map()
  private mutationQueue: TokenMutation[] = []
  private applying: boolean = false
  private resolutionTimes: Map<string, number> = new Map()

  constructor(initialTokens?: Record<string, AnyPrimitiveToken>, context?: TokenResolutionContext) {
    if (initialTokens) {
      Object.values(initialTokens).forEach(token => this.addToken(token))
    }
    if (context) {
      this.context = context
    }
    this.rebuildGraph()
  }

  // ============================================
  // GRAPH MANAGEMENT
  // ============================================

  addToken(token: PrimitiveToken): void {
    this.nodes.set(token.id, token)
    this.edges.set(token.id, new Set())
    this.reverseEdges.set(token.id, new Set())

    // Register dependencies
    token.metadata.dependencies.forEach(depId => {
      this.addEdge(depId, token.id)
    })

    this.invalidateCache(token.id)
    this.rebuildGraph()
  }

  removeToken(tokenId: string): boolean {
    if (!this.nodes.has(tokenId)) return false

    // Remove from dependents
    const dependents = this.edges.get(tokenId) || new Set()
    dependents.forEach(depId => {
      this.reverseEdges.get(depId)?.delete(tokenId)
    })

    // Remove from dependencies
    const dependencies = this.reverseEdges.get(tokenId) || new Set()
    dependencies.forEach(depId => {
      this.edges.get(depId)?.delete(tokenId)
    })

    this.nodes.delete(tokenId)
    this.edges.delete(tokenId)
    this.reverseEdges.delete(tokenId)
    this.invalidateCache(tokenId)
    this.rebuildGraph()
    return true
  }

  updateToken(tokenId: string, updates: Partial<PrimitiveToken>): boolean {
    const token = this.nodes.get(tokenId)
    if (!token) return false

    const oldDeps = new Set(token.metadata.dependencies)
    const newToken = { ...token, ...updates }
    this.nodes.set(tokenId, newToken)

    // Update dependencies
    const newDeps = new Set(newToken.metadata.dependencies)
    oldDeps.forEach(depId => {
      if (!newDeps.has(depId)) {
        this.edges.get(depId)?.delete(tokenId)
        this.reverseEdges.get(tokenId)?.delete(depId)
      }
    })
    newDeps.forEach(depId => {
      if (!oldDeps.has(depId)) {
        this.addEdge(depId, tokenId)
      }
    })

    this.invalidateCache(tokenId)
    this.rebuildGraph()
    return true
  }

  private addEdge(fromId: string, toId: string): void {
    if (!this.edges.has(fromId)) this.edges.set(fromId, new Set())
    if (!this.reverseEdges.has(toId)) this.reverseEdges.set(toId, new Set())
    this.edges.get(fromId)!.add(toId)
    this.reverseEdges.get(toId)!.add(fromId)
  }

  private rebuildGraph(): void {
    // Topological sort using Kahn's algorithm
    const inDegree = new Map<string, number>()
    const queue: string[] = []

    this.nodes.forEach((_, id) => {
      inDegree.set(id, (this.reverseEdges.get(id) || new Set()).size)
    })

    inDegree.forEach((degree, id) => {
      if (degree === 0) queue.push(id)
    })

    this.topologicalOrder = []
    while (queue.length > 0) {
      const id = queue.shift()!
      this.topologicalOrder.push(id)

      const dependents = this.edges.get(id) || new Set()
      dependents.forEach(depId => {
        const newDegree = (inDegree.get(depId) || 0) - 1
        inDegree.set(depId, newDegree)
        if (newDegree === 0) queue.push(depId)
      })
    }

    // Check for cycles
    if (this.topologicalOrder.length !== this.nodes.size) {
      console.warn('[TokenGraph] Cycle detected in token dependencies')
      // Fallback: use insertion order
      this.topologicalOrder = Array.from(this.nodes.keys())
    }

    this.version = `1.0.${Date.now()}`
    this.computeChecksum()
  }

  private computeChecksum(): void {
    let hash = 0
    this.topologicalOrder.forEach(id => {
      const token = this.nodes.get(id)!
      const str = `${id}:${JSON.stringify(token.value)}:${JSON.stringify(token.metadata.dependencies)}`
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i)
        hash |= 0
      }
    })
    this.checksum = hash.toString(16)
  }

  // ============================================
  // TOKEN RESOLUTION
  // ============================================

  setContext(context: TokenResolutionContext): void {
    this.context = context
    this.computedCache.clear() // Invalidate all cached values
    this.notifyAllSubscribers()
  }

  getContext(): TokenResolutionContext | null {
    return this.context
  }

  resolve(tokenId: string): ComputedTokenValue {
    const startTime = performance.now()
    const token = this.nodes.get(tokenId)

    if (!token) {
      return this.createErrorResult(tokenId, `Token not found: ${tokenId}`, startTime)
    }

    // Check cache
    const cached = this.computedCache.get(tokenId)
    if (cached && this.isCacheValid(tokenId)) {
      return cached
    }

    // Resolve dependencies first
    const dependencies: string[] = []
    const depValues: Map<string, any> = new Map()
    const warnings: string[] = []
    const errors: string[] = []

    for (const depId of token.metadata.dependencies) {
      const depResult = this.resolve(depId)
      dependencies.push(depId)
      if (depResult.resolved) {
        depValues.set(depId, depResult.value)
      } else {
        errors.push(`Dependency ${depId} failed: ${depResult.errors.join(', ')}`)
      }
      warnings.push(...depResult.warnings)
    }

    // Compute value
    let value: any
    try {
      value = this.computeTokenValue(token, depValues)
    } catch (error) {
      return this.createErrorResult(tokenId, `Computation error: ${error}`, startTime, dependencies)
    }

    // Validate constraints
    const constraintResults = this.validateConstraints(token, value, depValues)
    warnings.push(...constraintResults.warnings)
    errors.push(...constraintResults.errors)

    const computationTime = performance.now() - startTime
    this.resolutionTimes.set(tokenId, computationTime)

    const result: ComputedTokenValue = {
      tokenId,
      value,
      resolved: errors.length === 0,
      dependencies,
      warnings,
      errors,
      computationTime,
    }

    this.computedCache.set(tokenId, result)
    return result
  }

  private computeTokenValue(token: PrimitiveToken, depValues: Map<string, any>): any {
    switch (token.type) {
      case 'color':
      case 'number':
      case 'string':
        return token.value

      case 'reference':
        const targetValue = depValues.get(token.value)
        const refToken = token as any // ReferenceToken
        return targetValue !== undefined ? targetValue : refToken.fallback

      case 'function':
        if (!this.context) throw new Error('No resolution context available')
        return (token.value as Function)(this.createFunctionContext(depValues))

      case 'gradient':
        return this.resolveGradient(token.value, depValues)

      case 'shadow':
        return this.resolveShadow(token.value, depValues)

      case 'transition':
        return this.resolveTransition(token.value)

      case 'path':
        return token.value.d

      case 'easing':
        return this.formatEasing(token.value)

      default:
        return token.value
    }
  }

  private createFunctionContext(depValues: Map<string, any>): TokenResolutionContext & { tokens: Map<string, any> } {
    return {
      ...this.context!,
      tokens: depValues,
    } as any
  }

  private resolveGradient(gradient: any, depValues: Map<string, any>): string {
    const stops = gradient.stops.map((stop: any) => {
      const color = depValues.get(stop.color) || stop.color
      const opacity = stop.opacity !== undefined ? ` / ${stop.opacity}` : ''
      return `${color}${opacity} ${stop.position * 100}%`
    }).join(', ')

    switch (gradient.type) {
      case 'linear':
        return `linear-gradient(${gradient.direction || '180deg'}, ${stops})`
      case 'radial':
        return `radial-gradient(${gradient.center || 'center'} / ${gradient.radius || 'farthest-corner'}, ${stops})`
      case 'conic':
        return `conic-gradient(from ${gradient.direction || '0deg'}, ${stops})`
      default:
        return 'transparent'
    }
  }

  private resolveShadow(shadow: any, depValues: Map<string, any>): string {
    return shadow.layers.map((layer: any) => {
      const color = depValues.get(layer.color) || layer.color
      const parts = [
        `${layer.x}px`,
        `${layer.y}px`,
        `${layer.blur}px`,
        layer.spread !== undefined ? `${layer.spread}px` : '',
        color,
        layer.inset ? 'inset' : '',
      ].filter(Boolean).join(' ')
      return parts
    }).join(', ')
  }

  private resolveTransition(transition: any): string {
    return `${transition.property} ${transition.duration} ${transition.easing}${transition.delay ? ` ${transition.delay}` : ''}`
  }

  private formatEasing(easing: any): string {
    switch (easing.type) {
      case 'cubic-bezier':
        return `cubic-bezier(${easing.values?.join(', ') || '0.4, 0, 0.2, 1'})`
      case 'steps':
        return `steps(${easing.values?.join(', ') || '1, end'})`
      case 'linear':
        return 'linear'
      case 'spring':
        // CSS doesn't support spring directly, return custom property
        return `var(--spring-${easing.springConfig?.stiffness}-${easing.springConfig?.damping})`
      default:
        return 'ease'
    }
  }

  private validateConstraints(
    token: PrimitiveToken,
    value: any,
    depValues: Map<string, any>
  ): { warnings: string[]; errors: string[] } {
    const warnings: string[] = []
    const errors: string[] = []

    for (const constraint of token.metadata.constraints) {
      const result = this.checkConstraint(constraint, value, depValues)
      if (!result.valid) {
        if (constraint.severity === 'error') {
          errors.push(result.message || `Constraint failed: ${constraint.type}`)
        } else {
          warnings.push(result.message || `Constraint warning: ${constraint.type}`)
        }
      }
    }

    return { warnings, errors }
  }

  private checkConstraint(
    constraint: TokenConstraint,
    value: any,
    depValues: Map<string, any>
  ): { valid: boolean; message?: string } {
    switch (constraint.type) {
      case 'contrast': {
        const againstValue = depValues.get(constraint.params.against)
        if (!againstValue) return { valid: false, message: `Reference token ${constraint.params.against} not resolved` }
        const ratio = this.calculateContrast(value, againstValue)
        return { valid: ratio >= constraint.params.ratio, message: `Contrast ratio ${ratio.toFixed(2)}:1 < ${constraint.params.ratio}:1` }
      }
      case 'range': {
        const numValue = Number(value)
        return { valid: numValue >= constraint.params.min && numValue <= constraint.params.max }
      }
      case 'enum': {
        return { valid: constraint.params.values.includes(value) }
      }
      case 'ratio': {
        const num = Number(depValues.get(constraint.params.numerator))
        const den = Number(depValues.get(constraint.params.denominator))
        if (den === 0) return { valid: false, message: 'Denominator is zero' }
        return { valid: Math.abs(num / den - constraint.params.ratio) < 0.01 }
      }
      case 'dependency': {
        const missing = constraint.params.dependsOn.filter((d: string) => !depValues.has(d))
        return { valid: missing.length === 0, message: `Missing dependencies: ${missing.join(', ')}` }
      }
      case 'accessibility': {
        // Simplified - would need full WCAG implementation
        return { valid: true }
      }
      case 'performance': {
        // Checked at compile time
        return { valid: true }
      }
      default:
        return { valid: true }
    }
  }

  private calculateContrast(color1: string, color2: string): number {
    // Simplified contrast calculation - in reality would parse colors properly
    const lum1 = this.getLuminance(color1)
    const lum2 = this.getLuminance(color2)
    const lighter = Math.max(lum1, lum2)
    const darker = Math.min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  private getLuminance(color: string): number {
    // Very simplified - real implementation would parse hex/rgb/hsl
    if (color.startsWith('#')) {
      const hex = color.slice(1)
      const r = parseInt(hex.slice(0, 2), 16) / 255
      const g = parseInt(hex.slice(2, 4), 16) / 255
      const b = parseInt(hex.slice(4, 6), 16) / 255
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    return 0.5 // default
  }

  private isCacheValid(tokenId: string): boolean {
    const token = this.nodes.get(tokenId)
    if (!token) return false

    // Check if any dependency has been mutated
    for (const depId of token.metadata.dependencies) {
      const depToken = this.nodes.get(depId)
      if (depToken && depToken.lastResolved && token.lastResolved && depToken.lastResolved > token.lastResolved) {
        return false
      }
    }
    return true
  }

  private createErrorResult(
    tokenId: string,
    message: string,
    startTime: number,
    dependencies: string[] = []
  ): ComputedTokenValue {
    return {
      tokenId,
      value: null,
      resolved: false,
      dependencies,
      warnings: [],
      errors: [message],
      computationTime: performance.now() - startTime,
    }
  }

  // ============================================
  // BATCH RESOLUTION
  // ============================================

  resolveAll(): Map<string, ComputedTokenValue> {
    const results = new Map<string, ComputedTokenValue>()
    for (const tokenId of this.topologicalOrder) {
      results.set(tokenId, this.resolve(tokenId))
    }
    return results
  }

  resolveForContext(context: TokenResolutionContext): Map<string, ComputedTokenValue> {
    this.setContext(context)
    return this.resolveAll()
  }

  // ============================================
  // MUTATIONS
  // ============================================

  queueMutation(mutation: TokenMutation): void {
    this.mutationQueue.push(mutation)
  }

  queueMutations(mutations: TokenMutation[]): void {
    this.mutationQueue.push(...mutations)
  }

  applyMutations(): Map<string, ComputedTokenValue> {
    if (this.applying) {
      throw new Error('Mutations already being applied')
    }
    this.applying = true

    const results = new Map<string, ComputedTokenValue>()

    // Collect affected tokens first
    const affectedTokens = new Set<string>()
    for (const mutation of this.mutationQueue) {
      const tokenId = mutation.path || mutation.target
      if (tokenId) {
        this.collectAffectedTokens(tokenId, affectedTokens)
      }
    }

    // Apply all mutations
    for (const mutation of this.mutationQueue) {
      this.applyMutation(mutation)
    }

    this.mutationQueue = []
    this.rebuildGraph()

    // Re-resolve affected tokens
    for (const tokenId of affectedTokens) {
      results.set(tokenId, this.resolve(tokenId))
    }

    this.applying = false
    this.notifyAllSubscribers()
    return results
  }

  private applyMutation(mutation: TokenMutation): void {
    const tokenId = mutation.path || mutation.target
    if (!tokenId) {
      console.warn('[TokenGraph] Mutation target not found: missing path/target')
      return
    }
    const token = this.nodes.get(tokenId)
    if (!token) {
      console.warn(`[TokenGraph] Mutation target not found: ${tokenId}`)
      return
    }

    switch (mutation.op) {
      case 'set':
        this.updateToken(tokenId, { value: mutation.value })
        break
      case 'add':
        if (Array.isArray(token.value)) {
          this.updateToken(tokenId, { value: [...token.value, mutation.value] })
        }
        break
      case 'remove':
        if (Array.isArray(token.value)) {
          this.updateToken(tokenId, { value: token.value.filter((v: any) => v !== mutation.value) })
        }
        break
      case 'replace':
        this.updateToken(tokenId, { value: mutation.value })
        break
      case 'transform':
        if (mutation.transform) {
          // Would look up transform function
          console.warn('[TokenGraph] Transform functions not yet implemented')
        }
        break
      case 'scale':
        if (typeof token.value === 'number' && typeof mutation.value === 'number') {
          this.updateToken(tokenId, { value: token.value * mutation.value })
        }
        break
      case 'shift':
        if (typeof token.value === 'number' && typeof mutation.value === 'number') {
          this.updateToken(tokenId, { value: token.value + mutation.value })
        }
        break
      case 'blend':
        // Blend two colors/values
        break
      case 'invert':
        if (typeof token.value === 'number') {
          this.updateToken(tokenId, { value: -token.value })
        }
        break
      case 'derive':
        // Derive from other tokens
        break
    }
  }

  private collectAffectedTokens(tokenId: string, affected: Set<string>): void {
    affected.add(tokenId)
    const dependents = this.edges.get(tokenId) || new Set()
    for (const depId of dependents) {
      this.collectAffectedTokens(depId, affected)
    }
  }

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  subscribe(tokenId: string, listener: (value: ComputedTokenValue) => void): () => void {
    if (!this.subscribers.has(tokenId)) {
      this.subscribers.set(tokenId, new Set())
    }
    this.subscribers.get(tokenId)!.add(listener)

    // Immediately notify with current value
    const current = this.computedCache.get(tokenId)
    if (current) {
      listener(current)
    } else {
      listener(this.resolve(tokenId))
    }

    return () => this.unsubscribe(tokenId, listener)
  }

  unsubscribe(tokenId: string, listener: (value: ComputedTokenValue) => void): void {
    this.subscribers.get(tokenId)?.delete(listener)
  }

  private notifyAllSubscribers(): void {
    for (const [tokenId, listeners] of this.subscribers) {
      const value = this.resolve(tokenId)
      listeners.forEach(listener => listener(value))
    }
  }

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  invalidateCache(tokenId?: string): void {
    if (tokenId) {
      this.computedCache.delete(tokenId)
      this.notifySubscribers(tokenId)
    } else {
      this.computedCache.clear()
      this.notifyAllSubscribers()
    }
  }

  private notifySubscribers(tokenId: string): void {
    const listeners = this.subscribers.get(tokenId)
    if (listeners) {
      const value = this.resolve(tokenId)
      listeners.forEach(listener => listener(value))
    }
  }

  // ============================================
  // INSPECTION
  // ============================================

  getToken(tokenId: string): PrimitiveToken | undefined {
    return this.nodes.get(tokenId)
  }

  getAllTokens(): PrimitiveToken[] {
    return Array.from(this.nodes.values())
  }

  getDependents(tokenId: string): string[] {
    return Array.from(this.edges.get(tokenId) || new Set())
  }

  getDependencies(tokenId: string): string[] {
    return Array.from(this.reverseEdges.get(tokenId) || new Set())
  }

  getTopologicalOrder(): string[] {
    return [...this.topologicalOrder]
  }

  getVersion(): string {
    return this.version
  }

  getChecksum(): string {
    return this.checksum
  }

  getResolutionTime(tokenId: string): number {
    return this.resolutionTimes.get(tokenId) || 0
  }

  getAverageResolutionTime(): number {
    const times = Array.from(this.resolutionTimes.values())
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  }

  exportGraph(): TokenGraph {
    return {
      nodes: new Map(this.nodes),
      edges: new Map(this.edges),
      reverseEdges: new Map(this.reverseEdges),
      topologicalOrder: [...this.topologicalOrder],
      version: this.version,
      checksum: this.checksum,
    }
  }

  importGraph(graph: TokenGraph): void {
    this.nodes = new Map(graph.nodes)
    this.edges = new Map(graph.edges)
    this.reverseEdges = new Map(graph.reverseEdges)
    this.topologicalOrder = [...graph.topologicalOrder]
    this.version = graph.version
    this.checksum = graph.checksum
    this.computedCache.clear()
  }
}

// ============================================
// REACTIVE TOKEN MAP (Runtime Interface)
// ============================================

export class ReactiveTokenMapImpl {
  private engine: TokenGraphEngine

  constructor(engine: TokenGraphEngine) {
    this.engine = engine
  }

  get(tokenId: string): ComputedTokenValue {
    return this.engine.resolve(tokenId)
  }

  set(tokenId: string, value: any): void {
    this.engine.queueMutation({
      id: `set-${tokenId}-${Date.now()}`,
      op: 'set',
      path: tokenId,
      value,
    })
    this.engine.applyMutations()
  }

  subscribe(tokenId: string, listener: (value: ComputedTokenValue) => void): () => void {
    return this.engine.subscribe(tokenId, listener)
  }

  unsubscribe(tokenId: string, listener: (value: ComputedTokenValue) => void): void {
    this.engine.unsubscribe(tokenId, listener)
  }

  batch(mutations: TokenMutation[]): void {
    this.engine.queueMutations(mutations)
  }

  flush(): void {
    this.engine.applyMutations()
  }
}

// ============================================
// TYPES FOR EXTERNAL USE
// ============================================

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
// FACTORY
// ============================================

export function createTokenGraph(
  tokens?: Record<string, AnyPrimitiveToken>,
  context?: TokenResolutionContext
): TokenGraphEngine {
  return new TokenGraphEngine(tokens, context)
}

export function createReactiveTokenMap(engine: TokenGraphEngine): ReactiveTokenMapImpl {
  return new ReactiveTokenMapImpl(engine)
}