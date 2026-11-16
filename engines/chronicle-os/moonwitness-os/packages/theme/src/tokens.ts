export type ThemePreset = 'overdrive' | 'xerox' | 'acid-pop' | 'industrial'
export type ChaosIntensity = 'calm' | 'balanced' | 'loud' | 'extreme'
export type ThemeMode = 'light' | 'dark' | 'system'
export type Density = 'compact' | 'comfortable' | 'spacious'

export interface ThemeTokens {
  bg: string
  surface: string
  surfaceRaised: string
  fg: string
  muted: string
  border: string
  primary: string
  secondary: string
  danger: string
  warning: string
  success: string
  accent: string
}

export const PRESET_TOKENS: Record<ThemePreset, { light: ThemeTokens; dark: ThemeTokens }> = {
  overdrive: {
    light: {
      bg: '#F2F0E8',
      surface: '#FFFDF6',
      surfaceRaised: '#FFFFFF',
      fg: '#11110F',
      muted: '#636560',
      border: '#11110F',
      primary: '#11110F',
      secondary: '#D7FF00',
      danger: '#FF3EA5',
      warning: '#FF5A1F',
      success: '#10B981',
      accent: '#2563EB',
    },
    dark: {
      bg: '#11110F',
      surface: '#1A1B18',
      surfaceRaised: '#242522',
      fg: '#FFFDF6',
      muted: '#A1A39D',
      border: '#333530',
      primary: '#D7FF00',
      secondary: '#FF3EA5',
      danger: '#EF4444',
      warning: '#FF5A1F',
      success: '#10B981',
      accent: '#3B82F6',
    },
  },
  xerox: {
    light: {
      bg: '#EAE8E1',
      surface: '#F5F4EE',
      surfaceRaised: '#FFFFFF',
      fg: '#0D0D0C',
      muted: '#525450',
      border: '#0D0D0C',
      primary: '#0D0D0C',
      secondary: '#E11D48',
      danger: '#DC2626',
      warning: '#EA580C',
      success: '#059669',
      accent: '#4F46E5',
    },
    dark: {
      bg: '#0F0F0E',
      surface: '#171716',
      surfaceRaised: '#21211F',
      fg: '#EAE8E1',
      muted: '#8E918B',
      border: '#2C2D2A',
      primary: '#EAE8E1',
      secondary: '#FB7185',
      danger: '#F87171',
      warning: '#FB923C',
      success: '#34D399',
      accent: '#818CF8',
    },
  },
  'acid-pop': {
    light: {
      bg: '#F5F3FF',
      surface: '#FFFFFF',
      surfaceRaised: '#EDE9FE',
      fg: '#0F172A',
      muted: '#64748B',
      border: '#0F172A',
      primary: '#D7FF00',
      secondary: '#FF3EA5',
      danger: '#F43F5E',
      warning: '#F59E0B',
      success: '#10B981',
      accent: '#8B5CF6',
    },
    dark: {
      bg: '#0B0914',
      surface: '#131124',
      surfaceRaised: '#1E1B38',
      fg: '#F8FAFC',
      muted: '#94A3B8',
      border: '#312E81',
      primary: '#D7FF00',
      secondary: '#FF3EA5',
      danger: '#FB7185',
      warning: '#FBBF24',
      success: '#34D399',
      accent: '#A78BFA',
    },
  },
  industrial: {
    light: {
      bg: '#ECEFF1',
      surface: '#F8FAFC',
      surfaceRaised: '#FFFFFF',
      fg: '#1E293B',
      muted: '#64748B',
      border: '#0F172A',
      primary: '#F97316',
      secondary: '#84CC16',
      danger: '#EF4444',
      warning: '#F59E0B',
      success: '#10B981',
      accent: '#0284C7',
    },
    dark: {
      bg: '#0B0F14',
      surface: '#111822',
      surfaceRaised: '#192231',
      fg: '#E2E8F0',
      muted: '#94A3B8',
      border: '#2A3B4D',
      primary: '#FB923C',
      secondary: '#A3E635',
      danger: '#F87171',
      warning: '#FBBF24',
      success: '#34D399',
      accent: '#38BDF8',
    },
  },
}

