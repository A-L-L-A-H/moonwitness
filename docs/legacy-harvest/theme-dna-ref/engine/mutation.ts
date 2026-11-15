// DNA System - Mutation Engine
// Context-aware mutations with conditions and scheduling

import type {
  TokenMutation,
  ContextMutation,
  MutationOperation,
  TokenResolutionContext,
  MutationSet,
  DNAVersion,
  TokenPatch,
  MigrationDefinition,
  CompatibilityMatrix,
  DiffResult,
  DiffChange,
  AnyPrimitiveToken,
  TokenGraphEngine,
} from '../types'

// ============================================
// MUTATION ENGINE
// ============================================

export class MutationEngine {
  private graph: TokenGraphEngine
  private contextMutations: Map<string, ContextMutation> = new Map()
  private mutationSets: Map<string, MutationSet> = new Map()
  private scheduledMutations: ScheduledMutation[] = []
  private history: MutationHistoryEntry[] = []
  private maxHistory: number = 100

  constructor(graph: TokenGraphEngine) {
    this.graph = graph
  }

  // ============================================
  // CONTEXT MUTATIONS
  // ============================================

  registerContextMutation(mutation: ContextMutation): void {
    this.contextMutations.set(mutation.id, mutation)
    this.sortContextMutations()
  }

  unregisterContextMutation(id: string): boolean {
    return this.contextMutations.delete(id)
  }

  getContextMutation(id: string): ContextMutation | undefined {
    return this.contextMutations.get(id)
  }

  getAllContextMutations(): ContextMutation[] {
    return Array.from(this.contextMutations.values())
  }

  private sortContextMutations(): void {
    // Sort by priority (highest first)
    const sorted = Array.from(this.contextMutations.values())
      .sort((a, b) => b.priority - a.priority)
    this.contextMutations.clear()
    sorted.forEach(m => this.contextMutations.set(m.id, m))
  }

  evaluateContext(context: TokenResolutionContext): TokenMutation[] {
    const mutations: TokenMutation[] = []

    for (const mutation of this.contextMutations.values()) {
      try {
        if (mutation.condition(context)) {
          mutations.push(...mutation.mutations)
        }
      } catch (error) {
        console.warn(`[MutationEngine] Context mutation ${mutation.id} failed:`, error)
      }
    }

    return mutations
  }

  // ============================================
  // MUTATION SETS
  // ============================================

  registerMutationSet(set: MutationSet): void {
    this.mutationSets.set(set.id, set)
  }

  unregisterMutationSet(id: string): boolean {
    return this.mutationSets.delete(id)
  }

  getMutationSet(id: string): MutationSet | undefined {
    return this.mutationSets.get(id)
  }

  applyMutationSet(setId: string): Map<string, any> {
    const set = this.mutationSets.get(setId)
    if (!set) {
      throw new Error(`Mutation set not found: ${setId}`)
    }

    return this.applyMutations(set.mutations)
  }

  // ============================================
  // SCHEDULED MUTATIONS
  // ============================================

  scheduleMutation(
    mutation: TokenMutation,
    delay: number,
    repeat?: boolean,
    interval?: number
  ): string {
    const id = `scheduled-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const scheduled: ScheduledMutation = {
      id,
      mutation,
      delay,
      repeat: repeat || false,
      interval,
      timeoutId: null,
      startTime: Date.now(),
    }

    scheduled.timeoutId = window.setTimeout(() => {
      this.executeScheduledMutation(scheduled)
    }, delay)

    this.scheduledMutations.push(scheduled)
    return id
  }

  cancelScheduledMutation(id: string): boolean {
    const index = this.scheduledMutations.findIndex(m => m.id === id)
    if (index === -1) return false

    const scheduled = this.scheduledMutations[index]
    if (scheduled.timeoutId) {
      clearTimeout(scheduled.timeoutId)
    }
    this.scheduledMutations.splice(index, 1)
    return true
  }

  private executeScheduledMutation(scheduled: ScheduledMutation): void {
    this.applyMutations([scheduled.mutation])

    if (scheduled.repeat && scheduled.interval) {
      scheduled.timeoutId = window.setTimeout(() => {
        this.executeScheduledMutation(scheduled)
      }, scheduled.interval)
    } else {
      // Remove from scheduled list
      const index = this.scheduledMutations.findIndex(m => m.id === scheduled.id)
      if (index !== -1) {
        this.scheduledMutations.splice(index, 1)
      }
    }
  }

  // ============================================
  // MUTATION APPLICATION
  // ============================================

  applyMutations(mutations: TokenMutation[]): Map<string, any> {
    const results = new Map<string, any>()

    // Queue all mutations
    for (const mutation of mutations) {
      this.graph.queueMutation(mutation)
    }

    // Apply all at once
    const applyResults = this.graph.applyMutations()

    // Record in history
    this.recordHistory(mutations, applyResults)

    return applyResults
  }

  applyMutation(mutation: TokenMutation): Map<string, any> {
    return this.applyMutations([mutation])
  }

  private recordHistory(mutations: TokenMutation[], results: Map<string, any>): void {
    const entry: MutationHistoryEntry = {
      id: `history-${Date.now()}`,
      timestamp: Date.now(),
      mutations: [...mutations],
      results: Object.fromEntries(results),
      contextSnapshot: this.captureContextSnapshot(),
    }

    this.history.push(entry)
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
  }

  private captureContextSnapshot(): any {
    const context = this.graph.getContext()
    if (!context) return null

    return {
      theme: context.theme,
      density: context.density,
      viewport: context.viewport,
      reducedMotion: context.reducedMotion,
      highContrast: context.highContrast,
    }
  }

  // ============================================
  // HISTORY & UNDO
  // ============================================

  getHistory(): MutationHistoryEntry[] {
    return [...this.history]
  }

  undo(steps: number = 1): Map<string, any> {
    const toUndo = this.history.splice(-steps)
    const reversedMutations: TokenMutation[] = []

    for (const entry of toUndo.reverse()) {
      for (const mutation of entry.mutations) {
        reversedMutations.push(this.invertMutation(mutation))
      }
    }

    return this.applyMutations(reversedMutations)
  }

  private invertMutation(mutation: TokenMutation): TokenMutation {
    // Create inverse mutation based on operation
    const inverseOps: Record<MutationOperation, MutationOperation> = {
      'set': 'set', // Would need previous value
      'add': 'remove',
      'remove': 'add',
      'replace': 'replace',
      'transform': 'transform',
      'scale': 'scale', // Would need inverse factor
      'shift': 'shift', // Would need negative shift
      'blend': 'blend',
      'invert': 'invert',
      'derive': 'derive',
    }

    return {
      ...mutation,
      id: `invert-${mutation.id}`,
      op: inverseOps[mutation.op] || 'set',
    }
  }

  // ============================================
  // CONDITIONAL MUTATIONS
  // ============================================

  createConditionalMutation(
    condition: (context: TokenResolutionContext) => boolean,
    mutations: TokenMutation[],
    options: { priority?: number; tags?: string[] } = {}
  ): ContextMutation {
    return {
      id: `conditional-${Date.now()}`,
      name: `Conditional mutation`,
      condition,
      mutations,
      priority: options.priority || 0,
      reversible: true,
      tags: options.tags || [],
    }
  }

  // ============================================
  // BATCH MUTATIONS
  // ============================================

  createBatchMutation(
    mutations: TokenMutation[],
    options: { atomic?: boolean; rollbackOnError?: boolean } = {}
  ): BatchMutation {
    return {
      id: `batch-${Date.now()}`,
      mutations,
      atomic: options.atomic ?? true,
      rollbackOnError: options.rollbackOnError ?? true,
      executed: false,
      results: new Map(),
    }
  }

  executeBatch(batch: BatchMutation): Map<string, any> {
    if (batch.executed) {
      throw new Error('Batch mutation already executed')
    }

    batch.executed = true

    try {
      batch.results = this.applyMutations(batch.mutations)
      return batch.results
    } catch (error) {
      if (batch.rollbackOnError) {
        // Attempt rollback
        const reversed = batch.mutations.map(m => this.invertMutation(m)).reverse()
        this.applyMutations(reversed)
      }
      throw error
    }
  }
}

// ============================================
// SCHEDULED MUTATION TYPE
// ============================================

interface ScheduledMutation {
  id: string
  mutation: TokenMutation
  delay: number
  repeat: boolean
  interval?: number
  timeoutId: number | null
  startTime: number
}

// ============================================
// BATCH MUTATION TYPE
// ============================================

export interface BatchMutation {
  id: string
  mutations: TokenMutation[]
  atomic: boolean
  rollbackOnError: boolean
  executed: boolean
  results: Map<string, any>
}

// ============================================
// HISTORY ENTRY
// ============================================

export interface MutationHistoryEntry {
  id: string
  timestamp: number
  mutations: TokenMutation[]
  results: Record<string, any>
  contextSnapshot: any
}

// ============================================
// MIGRATION ENGINE
// ============================================

export class MigrationEngine {
  private migrations: Map<string, MigrationDefinition> = new Map()
  private migrationGraph: Map<string, string[]> = new Map() // version -> next versions

  registerMigration(migration: MigrationDefinition): void {
    this.migrations.set(`${migration.fromVersion}->${migration.toVersion}`, migration)

    if (!this.migrationGraph.has(migration.fromVersion)) {
      this.migrationGraph.set(migration.fromVersion, [])
    }
    this.migrationGraph.get(migration.fromVersion)!.push(migration.toVersion)
  }

  getMigration(fromVersion: string, toVersion: string): MigrationDefinition | undefined {
    return this.migrations.get(`${fromVersion}->${toVersion}`)
  }

  findMigrationPath(fromVersion: string, toVersion: string): MigrationDefinition[] {
    // BFS to find shortest path
    const queue: { version: string; path: MigrationDefinition[] }[] = [
      { version: fromVersion, path: [] }
    ]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { version, path } = queue.shift()!

      if (version === toVersion) {
        return path
      }

      if (visited.has(version)) continue
      visited.add(version)

      const nextVersions = this.migrationGraph.get(version) || []
      for (const nextVersion of nextVersions) {
        const migration = this.migrations.get(`${version}->${nextVersion}`)
        if (migration) {
          queue.push({ version: nextVersion, path: [...path, migration] })
        }
      }
    }

    return [] // No path found
  }

  migrate(graph: TokenGraphEngine, fromVersion: string, toVersion: string): TokenGraphEngine {
    const path = this.findMigrationPath(fromVersion, toVersion)

    if (path.length === 0) {
      throw new Error(`No migration path from ${fromVersion} to ${toVersion}`)
    }

    let currentGraph = graph
    for (const migration of path) {
      if (migration.breaking) {
        console.warn(`[MigrationEngine] Applying breaking migration: ${migration.description}`)
      }
      currentGraph = migration.up(currentGraph)
    }

    return currentGraph
  }

  canMigrate(fromVersion: string, toVersion: string): boolean {
    return this.findMigrationPath(fromVersion, toVersion).length > 0
  }
}

// ============================================
// VERSION MANAGER
// ============================================

export class VersionManager {
  private versions: Map<string, DNAVersion> = new Map()
  private currentVersion: string
  private compatibility: CompatibilityMatrix

  constructor(initialVersion: string, compatibility: CompatibilityMatrix) {
    this.currentVersion = initialVersion
    this.compatibility = compatibility
  }

  createVersion(
    genotype: any,
    message: string,
    author: string,
    patches: TokenPatch[]
  ): DNAVersion {
    const version: DNAVersion = {
      version: this.bumpVersion(this.currentVersion, patches),
      parent: this.currentVersion,
      patches,
      migrations: [],
      compatibility: this.compatibility,
      timestamp: Date.now(),
      author,
      message,
    }

    this.versions.set(version.version, version)
    this.currentVersion = version.version
    return version
  }

  private bumpVersion(current: string, patches: TokenPatch[]): string {
    const [major, minor, patch] = current.split('.').map(Number)
    const hasBreaking = patches.some(p => p.op === 'remove' || p.op === 'replace')

    if (hasBreaking) {
      return `${major + 1}.0.0`
    } else if (patches.some(p => p.op === 'add')) {
      return `${major}.${minor + 1}.0`
    } else {
      return `${major}.${minor}.${patch + 1}`
    }
  }

  getVersion(version: string): DNAVersion | undefined {
    return this.versions.get(version)
  }

  getCurrentVersion(): string {
    return this.currentVersion
  }

  getAllVersions(): DNAVersion[] {
    return Array.from(this.versions.values()).sort((a, b) =>
      this.compareVersions(b.version, a.version)
    )
  }

  getHistory(): DNAVersion[] {
    const history: DNAVersion[] = []
    let current: string | null = this.currentVersion

    while (current) {
      const version = this.versions.get(current)
      if (!version) break
      history.push(version)
      current = version.parent
    }

    return history
  }

  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number)
    const bParts = b.split('.').map(Number)

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0
      const bPart = bParts[i] || 0
      if (aPart !== bPart) return aPart - bPart
    }
    return 0
  }

  checkCompatibility(targetVersion: string): CompatibilityCheck {
    const target = this.versions.get(targetVersion)
    if (!target) {
      return { compatible: false, reason: 'Version not found' }
    }

    // Check runtime compatibility
    const issues: string[] = []

    // Simplified check
    return { compatible: true, issues }
  }
}

export interface CompatibilityCheck {
  compatible: boolean
  reason?: string
  issues?: string[]
}

// ============================================
// DIFF ENGINE
// ============================================

export class DiffEngine {
  static diff(
    from: Record<string, AnyPrimitiveToken>,
    to: Record<string, AnyPrimitiveToken>
  ): DiffResult {
    const fromIds = new Set(Object.keys(from))
    const toIds = new Set(Object.keys(to))

    const added: string[] = []
    const removed: string[] = []
    const changed: DiffChange[] = []
    const unchanged: string[] = []

    for (const id of toIds) {
      if (!fromIds.has(id)) {
        added.push(id)
      } else {
        const fromToken = from[id]
        const toToken = to[id]
        const diff = this.diffTokens(fromToken, toToken)

        if (diff) {
          changed.push(diff)
        } else {
          unchanged.push(id)
        }
      }
    }

    for (const id of fromIds) {
      if (!toIds.has(id)) {
        removed.push(id)
      }
    }

    return { added, removed, changed, unchanged }
  }

  private static diffTokens(
    from: AnyPrimitiveToken,
    to: AnyPrimitiveToken
  ): DiffChange | null {
    const changes: DiffChange[] = []

    // Compare value
    if (JSON.stringify(from.value) !== JSON.stringify(to.value)) {
      changes.push({
        path: `${from.id}.value`,
        oldValue: from.value,
        newValue: to.value,
        type: 'value',
        breaking: this.isBreakingValueChange(from, to),
      })
    }

    // Compare metadata
    if (JSON.stringify(from.metadata) !== JSON.stringify(to.metadata)) {
      changes.push({
        path: `${from.id}.metadata`,
        oldValue: from.metadata,
        newValue: to.metadata,
        type: 'metadata',
        breaking: false,
      })
    }

    if (changes.length === 0) return null

    // Return first change (simplified)
    return changes[0]
  }

  private static isBreakingValueChange(from: AnyPrimitiveToken, to: AnyPrimitiveToken): boolean {
    // Type change is breaking
    if (from.type !== to.type) return true

    // For colors, check if contrast would be affected
    if (from.type === 'color' && to.type === 'color') {
      // Would need actual contrast check
      return false
    }

    // For numbers, check if scale changed significantly
    if (from.type === 'number' && to.type === 'number') {
      const fromNum = Number(from.value)
      const toNum = Number(to.value)
      if (fromNum !== 0 && Math.abs((toNum - fromNum) / fromNum) > 0.5) {
        return true
      }
    }

    return false
  }

  static diffGenotypes(
    from: any,
    to: any
  ): DiffResult {
    return {
      added: [],
      removed: [],
      changed: [],
      unchanged: [],
    }
  }
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createMutationEngine(graph: TokenGraphEngine): MutationEngine {
  return new MutationEngine(graph)
}

export function createMigrationEngine(): MigrationEngine {
  return new MigrationEngine()
}

export function createVersionManager(
  initialVersion: string,
  compatibility: CompatibilityMatrix
): VersionManager {
  return new VersionManager(initialVersion, compatibility)
}