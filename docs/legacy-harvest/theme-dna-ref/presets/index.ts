// DNA Preset Registry - Centralized export and management of all DNA presets

export { corporateDNA } from './corporate'
export { minimalDNA } from './minimal'
export { boldDNA } from './bold'
export { technicalDNA } from './technical'
export { creativeDNA } from './creative'
export { darkGlassDNA } from './darkGlass'

import type { DNAGenotype, DNAMetadata } from '../types'
import { corporateDNA } from './corporate'
import { minimalDNA } from './minimal'
import { boldDNA } from './bold'
import { technicalDNA } from './technical'
import { creativeDNA } from './creative'
import { darkGlassDNA } from './darkGlass'

// ============================================
// PRESET REGISTRY
// ============================================

export const DNA_PRESETS: Record<string, DNAGenotype> = {
  corporate: corporateDNA,
  minimal: minimalDNA,
  bold: boldDNA,
  technical: technicalDNA,
  creative: creativeDNA,
  darkGlass: darkGlassDNA,
}

export const PRESET_IDS = Object.keys(DNA_PRESETS) as Array<keyof typeof DNA_PRESETS>

export interface PresetInfo {
  id: string
  name: string
  version: string
  description: string
  category: string
  tags: string[]
  author: string
  createdAt: number
  updatedAt: number
}

export function getPresetInfo(id: string): PresetInfo | null {
  const preset = DNA_PRESETS[id]
  if (!preset) return null
  return {
    id: preset.id,
    name: preset.name,
    version: preset.version,
    description: preset.description || '',
    category: preset.metadata.category,
    tags: preset.metadata.tags,
    author: preset.metadata.author,
    createdAt: preset.metadata.createdAt,
    updatedAt: preset.metadata.updatedAt,
  }
}

export function listPresets(): PresetInfo[] {
  return PRESET_IDS.map(getPresetInfo).filter(Boolean) as PresetInfo[]
}

export function getPresetByCategory(category: string): DNAGenotype[] {
  return Object.values(DNA_PRESETS).filter(p => p.metadata.category === category)
}

export function getPreset(id: string): DNAGenotype | null {
  return DNA_PRESETS[id] || null
}

export function getDefaultPreset(): DNAGenotype {
  return DNA_PRESETS.darkGlass || DNA_PRESETS.corporate
}

export function getPresetNames(): string[] {
  return PRESET_IDS
}

export function validatePresetId(id: string): boolean {
  return id in DNA_PRESETS
}

export function getRandomPreset(exclude?: string): DNAGenotype {
  const available = PRESET_IDS.filter(id => id !== exclude)
  const randomIndex = Math.floor(Math.random() * available.length)
  return DNA_PRESETS[available[randomIndex]]
}

export interface PresetComparison {
  id: string
  name: string
  differences: string[]
  similarity: number
}

export function comparePresets(id1: string, id2: string): PresetComparison | null {
  const p1 = DNA_PRESETS[id1]
  const p2 = DNA_PRESETS[id2]
  if (!p1 || !p2) return null

  const diffs: string[] = []
  const allKeys = new Set([...Object.keys(p1.primitives), ...Object.keys(p2.primitives)])

  let matchCount = 0
  let totalCount = 0

  for (const key of allKeys) {
    const v1 = p1.primitives[key]
    const v2 = p2.primitives[key]
    if (v1 && v2) {
      totalCount++
      if (JSON.stringify(v1) === JSON.stringify(v2)) {
        matchCount++
      } else {
        diffs.push(`Primitive '${key}': ${JSON.stringify(v1.value)} vs ${JSON.stringify(v2.value)}`)
      }
    } else if (v1 || v2) {
      totalCount++
      diffs.push(`Primitive '${key}': ${v1 ? 'present' : 'missing'} vs ${v2 ? 'present' : 'missing'}`)
    }
  }

  const similarity = totalCount > 0 ? matchCount / totalCount : 0

  return {
    id: `${id1}-vs-${id2}`,
    name: `${p1.name} vs ${p2.name}`,
    differences: diffs.slice(0, 20),
    similarity,
  }
}

export function getPresetMetadata(): Record<string, DNAMetadata> {
  const meta: Record<string, DNAMetadata> = {}
  for (const [id, preset] of Object.entries(DNA_PRESETS)) {
    meta[id] = preset.metadata
  }
  return meta
}

export const PRESET_CATEGORIES: Record<string, string[]> = {
  corporate: ['corporate'],
  minimal: ['minimal'],
  bold: ['bold'],
  technical: ['technical'],
  creative: ['creative', 'darkGlass'],
}

export function getPresetsByCategory(category: string): DNAGenotype[] {
  const ids = PRESET_CATEGORIES[category] || []
  return ids.map(id => DNA_PRESETS[id]).filter(Boolean)
}

export default {
  presets: DNA_PRESETS,
  ids: PRESET_IDS,
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
}