'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { PRESET_TOKENS, type ChaosIntensity, type Density, type ThemeMode, type ThemePreset } from './tokens'

interface ThemeContextType {
  preset: ThemePreset
  setPreset: (preset: ThemePreset) => void
  chaos: ChaosIntensity
  setChaos: (chaos: ChaosIntensity) => void
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  density: Density
  setDensity: (density: Density) => void
  resolvedDark: boolean
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({
  children,
  defaultPreset = 'overdrive',
  defaultChaos = 'loud',
  defaultMode = 'dark',
  defaultDensity = 'comfortable',
}: {
  children: React.ReactNode
  defaultPreset?: ThemePreset
  defaultChaos?: ChaosIntensity
  defaultMode?: ThemeMode
  defaultDensity?: Density
}) {
  const [preset, setPreset] = useState<ThemePreset>(defaultPreset)
  const [chaos, setChaos] = useState<ChaosIntensity>(defaultChaos)
  const [mode, setMode] = useState<ThemeMode>(defaultMode)
  const [density, setDensity] = useState<Density>(defaultDensity)
  const [resolvedDark, setResolvedDark] = useState<boolean>(true)

  useEffect(() => {
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setResolvedDark(isDark)

    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(isDark ? 'dark' : 'light')
    root.setAttribute('data-theme-preset', preset)
    root.setAttribute('data-chaos-intensity', chaos)
    root.setAttribute('data-density', density)

    const tokens = PRESET_TOKENS[preset][isDark ? 'dark' : 'light']
    root.style.setProperty('--riot-bg', tokens.bg)
    root.style.setProperty('--riot-surface', tokens.surface)
    root.style.setProperty('--riot-surface-raised', tokens.surfaceRaised)
    root.style.setProperty('--riot-fg', tokens.fg)
    root.style.setProperty('--riot-muted', tokens.muted)
    root.style.setProperty('--riot-border', tokens.border)
    root.style.setProperty('--riot-primary', tokens.primary)
    root.style.setProperty('--riot-secondary', tokens.secondary)
    root.style.setProperty('--riot-danger', tokens.danger)
    root.style.setProperty('--riot-warning', tokens.warning)
    root.style.setProperty('--riot-success', tokens.success)
    root.style.setProperty('--riot-accent', tokens.accent)
  }, [preset, chaos, mode, density])

  return (
    <ThemeContext.Provider value={{ preset, setPreset, chaos, setChaos, mode, setMode, density, setDensity, resolvedDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useRiotTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useRiotTheme must be used within ThemeProvider')
  return ctx
}

