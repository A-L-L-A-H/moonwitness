import type { SkinName } from "./compositions";
import {
  badgeSkinCompositions,
  cardSkinCompositions,
  eventCardVariants,
  inputSkinCompositions,
  kanbanColumnVariants,
  moduleCardVariants,
} from "./compositions";
import { applyPreset, getPreset } from "./presets";
import { buttonVariants as skinButtonVariants } from "./variants";
import { isValidSkin } from "./constants";

export function skinBaseClasses(skin: SkinName): Record<string, string> {
  const safeSkin: SkinName = isValidSkin(skin) ? skin : "default";
  const applied = applyPreset(safeSkin);
  const preset = getPreset(safeSkin);
  const skinKey = safeSkin === "default" ? null : safeSkin;
  return {
    button: [
      `skin-${safeSkin}`,
      skinButtonVariants({ variant: applied.variant as never, skin: applied.skin }),
      preset.effects,
    ]
      .filter(Boolean)
      .join(" "),
    card: [
      `skin-${safeSkin}`,
      skinKey ? cardSkinCompositions[skinKey] : "bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)]",
    ]
      .filter(Boolean)
      .join(" "),
    input: [
      `skin-${safeSkin}`,
      skinKey ? inputSkinCompositions[skinKey] : "border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)]",
    ]
      .filter(Boolean)
      .join(" "),
    badge: [
      `skin-${safeSkin}`,
      skinKey ? badgeSkinCompositions[skinKey] : "bg-[var(--primary)] text-[var(--primary-foreground)]",
    ]
      .filter(Boolean)
      .join(" "),
    eventCard: eventCardVariants({ skin: safeSkin, density: applied.density }),
    kanbanColumn: kanbanColumnVariants({ skin: safeSkin, compact: applied.compact }),
    moduleCard: moduleCardVariants({
      skin: safeSkin,
      size: applied.moduleSize,
      elevated: applied.elevated,
    }),
    hudPanel: `skin-${applied.hudSkin} hud-layer`,
    scenePanel: `skin-${applied.sceneSkin} scene-layer`,
    atlasStage: `skin-${applied.atlasSkin} atlas-layer`,
  };
}
