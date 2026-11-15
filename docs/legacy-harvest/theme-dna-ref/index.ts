// DNA System - Main Entry Point
// Exports all DNA system functionality

// Types
export * from './types'

// Primitives
export * from './primitives'

// Engine - explicitly re-export to avoid TokenGraphEngine conflict
export * from './engine/compiler'
export * from './engine/runtime'
export * from './engine/mutation'
export { TokenGraphEngine, createTokenGraph, ReactiveTokenMapImpl } from './engine/token-graph'
export type { ComputedTokenValue, TokenSubscriber } from './engine/token-graph'

// Intelligence
export * from './intelligence'

// Presets
export * from './presets'

// Legacy DNA compatibility
export {
  type DNAConfig,
  type DNAPreset,
  dnaPresets as legacyDnaPresets,
  getDNAPreset,
  listDNAPresets,
  getDNAPresetsByCategory,
  generateDNACSS,
  applyDNA,
  getActiveDNA,
  initDNA,
} from '../dna'

// New DNA presets
export {
  corporateDNA,
  minimalDNA,
  boldDNA,
  technicalDNA,
  creativeDNA,
  darkGlassDNA,
} from './presets'

// Preset registry
export {
  DNA_PRESETS,
  PRESET_IDS,
  getPreset,
  getPresetInfo,
  listPresets,
  getPresetByCategory,
  getDefaultPreset,
  getPresetNames,
  validatePresetId,
  getRandomPreset,
  comparePresets,
  getPresetMetadata,
  getPresetsByCategory,
  type PresetInfo,
} from './presets/index'

// Factory functions
import { createRuntime, createDefaultContext, DNARuntimeImpl } from './engine/runtime'
import { createCompiler } from './engine/compiler'
import { createTokenGraph } from './engine/token-graph'
import type { DNAGenotype, TokenResolutionContext, DNARuntime } from './types'

// Import presets for default export
import {
  corporateDNA,
  minimalDNA,
  boldDNA,
  technicalDNA,
  creativeDNA,
  darkGlassDNA,
} from './presets'

export function createDNARuntime(
  genotype: DNAGenotype,
  context?: Partial<TokenResolutionContext>
): DNARuntime {
  return createRuntime(genotype, createDefaultContext(context))
}

export function createDNAContext(overrides?: Partial<TokenResolutionContext>): TokenResolutionContext {
  return createDefaultContext(overrides)
}

// React hooks
export {
  DNARuntimeProvider,
  useDNA,
  useToken,
  useComponent,
  useThemeTransition,
  useContextMutation,
  type ResolvedComponentRecipe,
  type TransitionConfig,
} from './engine/runtime'

// Default export
export default {
  createRuntime: createDNARuntime,
  createContext: createDNAContext,
  presets: {
    corporate: corporateDNA,
    minimal: minimalDNA,
    bold: boldDNA,
    technical: technicalDNA,
    creative: creativeDNA,
    darkGlass: darkGlassDNA,
  },
}