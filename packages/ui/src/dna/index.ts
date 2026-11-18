// Moonwitness DNA Core — Public Entrypoint (`@moonwitness/ui/dna`)
// Intentionally server-safe (no React / client directives).

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
} from "./tokens";

export { defaultTheme, type DefaultTheme } from "./default-theme";

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
  type DeepPartial,
} from "./registry";

export {
  BRAND_TOKENS,
  MASTER_DNA_LIGHT_PALETTES,
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
} from "./canonical";

export {
  IMPERIUM_LUMEN_TOKENS,
  LIVING_LIGHT_PALETTE,
  LIVING_LIGHT_TYPOGRAPHY,
  LIVING_LIGHT_MOTION,
  SACRED_VISUAL_COVENANT,
  MASTER_DNA_PALETTES,
  imperiumLumenCssVariables,
  type RenderingCapabilityTier,
  type SpringPhysicsPreset,
  type MasterDnaPaletteMap,
} from "../skin/imperium-tokens";
