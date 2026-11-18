"use client";

import { useSkin, isValidSkin, type SkinName } from "../../skin/index";
import { useOptionalDnaWorld } from "../../skin/dna-worlds";

export type LegacyComponentSkin = "zine" | "dna" | "imperium";
export type ComponentSkinProp = SkinName | LegacyComponentSkin;

export interface ComponentSkinRecipe {
  readonly button: string;
  readonly card: string;
  readonly input: string;
  readonly badge: string;
  readonly dialog: string;
  readonly selectTrigger: string;
  readonly selectContent: string;
  readonly tabsList: string;
  readonly tabsTrigger: string;
}

const SKIN_RECIPES: Readonly<Record<SkinName, ComponentSkinRecipe>> = {
  default: {
    button:
      "rounded-[var(--mw-btn-radius,0.375rem)] border-[var(--mw-btn-border-width,1px)] shadow-[var(--mw-btn-shadow)]",
    card: "rounded-[var(--mw-card-radius,0.5rem)] border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-[var(--mw-card-shadow)]",
    input:
      "rounded-[var(--mw-input-radius,0.375rem)] border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)]",
    badge: "rounded-[var(--mw-badge-radius,9999px)] font-semibold",
    dialog:
      "rounded-[var(--mw-dialog-radius,0.5rem)] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[var(--mw-dialog-shadow)]",
    selectTrigger:
      "rounded-[var(--mw-input-radius,0.375rem)] border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)]",
    selectContent:
      "rounded-[var(--mw-dialog-radius,0.5rem)] border border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)]",
    tabsList:
      "rounded-[var(--mw-input-radius,0.375rem)] bg-[var(--muted)] text-[var(--muted-foreground)]",
    tabsTrigger:
      "rounded-[var(--mw-btn-radius,0.25rem)] data-[state=active]:bg-[var(--background)] data-[state=active]:text-[var(--foreground)]",
  },
  riot: {
    button:
      "rounded-[var(--mw-btn-radius,2px)] border-2 border-[var(--border)] font-brush uppercase tracking-wider shadow-[4px_4px_0_var(--ink)]",
    card: "zine-card rounded-[var(--mw-card-radius,2px)] border-2 border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-[5px_5px_0_var(--ink)]",
    input:
      "zine-input rounded-[var(--mw-input-radius,2px)] border-2 border-[var(--primary)] bg-[var(--background)] text-[var(--foreground)] font-mono",
    badge: "rounded-[var(--mw-badge-radius,2px)] font-brush uppercase tracking-wider",
    dialog:
      "rounded-[var(--mw-dialog-radius,2px)] border-2 border-[var(--primary)] bg-[var(--background)] text-[var(--foreground)] shadow-[8px_8px_0_var(--primary)]",
    selectTrigger:
      "rounded-[var(--mw-input-radius,2px)] border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-mono",
    selectContent:
      "rounded-[var(--mw-dialog-radius,2px)] border-2 border-[var(--primary)] bg-[var(--popover)] text-[var(--popover-foreground)] shadow-[6px_6px_0_var(--ink)]",
    tabsList:
      "rounded-[var(--mw-input-radius,2px)] border-2 border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]",
    tabsTrigger:
      "rounded-none font-brush uppercase tracking-wider data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--primary-foreground)]",
  },
  editorial: {
    button:
      "rounded-[var(--mw-btn-radius,4px)] border border-[var(--primary)] font-serif tracking-wide shadow-none",
    card: "rounded-[var(--mw-card-radius,6px)] border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] font-serif shadow-sm",
    input:
      "rounded-[var(--mw-input-radius,4px)] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-serif",
    badge: "rounded-full border font-serif tracking-wide",
    dialog:
      "rounded-[var(--mw-dialog-radius,6px)] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-serif shadow-xl",
    selectTrigger:
      "rounded-[var(--mw-input-radius,4px)] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-serif",
    selectContent:
      "rounded-[var(--mw-dialog-radius,6px)] border border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] font-serif",
    tabsList:
      "rounded-none border-b border-[var(--border)] bg-transparent text-[var(--muted-foreground)]",
    tabsTrigger:
      "rounded-none font-serif data-[state=active]:border-b-2 data-[state=active]:border-[var(--primary)] data-[state=active]:text-[var(--foreground)]",
  },
  technical: {
    button:
      "rounded-[var(--mw-btn-radius,2px)] border border-[var(--accent)] font-mono uppercase tracking-widest",
    card: "rounded-[var(--mw-card-radius,2px)] border border-[var(--accent)]/60 bg-[var(--card)] text-[var(--card-foreground)] font-mono",
    input:
      "rounded-[var(--mw-input-radius,2px)] border border-[var(--accent)]/70 bg-[var(--background)] text-[var(--foreground)] font-mono",
    badge: "rounded-[var(--mw-badge-radius,2px)] font-mono uppercase tracking-widest",
    dialog:
      "rounded-[var(--mw-dialog-radius,2px)] border border-[var(--accent)] bg-[var(--background)] text-[var(--foreground)] font-mono shadow-lg",
    selectTrigger:
      "rounded-[var(--mw-input-radius,2px)] border border-[var(--accent)]/70 bg-[var(--background)] text-[var(--foreground)] font-mono",
    selectContent:
      "rounded-[var(--mw-dialog-radius,2px)] border border-[var(--accent)] bg-[var(--popover)] text-[var(--popover-foreground)] font-mono",
    tabsList:
      "rounded-[var(--mw-input-radius,2px)] border border-[var(--border)] bg-[var(--muted)] font-mono text-[var(--muted-foreground)]",
    tabsTrigger:
      "rounded-[var(--mw-btn-radius,2px)] font-mono uppercase data-[state=active]:bg-[var(--background)] data-[state=active]:text-[var(--accent)]",
  },
  archive: {
    button:
      "rounded-[var(--mw-btn-radius,6px)] border-2 border-[var(--border)] font-serif shadow-[2px_3px_0_var(--ink)]",
    card: "rounded-[var(--mw-card-radius,10px)] border-2 border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] font-serif shadow-[3px_4px_0_var(--ink)]",
    input:
      "rounded-[var(--mw-input-radius,6px)] border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-serif",
    badge: "rounded-full border-2 font-serif",
    dialog:
      "rounded-[var(--mw-dialog-radius,10px)] border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-serif shadow-[6px_6px_0_var(--ink)]",
    selectTrigger:
      "rounded-[var(--mw-input-radius,6px)] border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-serif",
    selectContent:
      "rounded-[var(--mw-dialog-radius,10px)] border-2 border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] font-serif",
    tabsList:
      "rounded-[var(--mw-input-radius,6px)] border border-[var(--border)] bg-[var(--muted)] font-serif text-[var(--muted-foreground)]",
    tabsTrigger:
      "rounded-[var(--mw-btn-radius,4px)] font-serif data-[state=active]:bg-[var(--background)] data-[state=active]:text-[var(--foreground)]",
  },
  transmission: {
    button:
      "rounded-[var(--mw-btn-radius,6px)] border border-[var(--accent)] font-mono uppercase tracking-wider shadow-[0_0_12px_rgba(46,168,255,0.22)]",
    card: "rounded-[var(--mw-card-radius,8px)] border border-[var(--accent)]/60 bg-[var(--card)] text-[var(--card-foreground)] shadow-[0_0_16px_rgba(46,168,255,0.12)]",
    input:
      "rounded-[var(--mw-input-radius,6px)] border border-[var(--accent)]/60 bg-[var(--background)] text-[var(--foreground)] font-mono",
    badge: "rounded-full border font-mono uppercase tracking-wider",
    dialog:
      "rounded-[var(--mw-dialog-radius,8px)] border border-[var(--accent)] bg-[var(--background)] text-[var(--foreground)] shadow-[0_0_24px_rgba(46,168,255,0.2)]",
    selectTrigger:
      "rounded-[var(--mw-input-radius,6px)] border border-[var(--accent)]/60 bg-[var(--background)] text-[var(--foreground)] font-mono",
    selectContent:
      "rounded-[var(--mw-dialog-radius,8px)] border border-[var(--accent)] bg-[var(--popover)] text-[var(--popover-foreground)] font-mono",
    tabsList:
      "rounded-[var(--mw-input-radius,6px)] border border-[var(--accent)]/40 bg-[var(--muted)] font-mono text-[var(--muted-foreground)]",
    tabsTrigger:
      "rounded-[var(--mw-btn-radius,4px)] font-mono uppercase data-[state=active]:bg-[var(--background)] data-[state=active]:text-[var(--foreground)]",
  },
};

export function resolveComponentSkinName(
  explicitSkin: ComponentSkinProp | undefined,
  contextSkin: SkinName,
): { skin: SkinName; legacySkin?: LegacyComponentSkin } {
  if (explicitSkin === "imperium" || explicitSkin === "dna" || explicitSkin === "zine") {
    return { skin: contextSkin, legacySkin: explicitSkin };
  }
  if (explicitSkin && isValidSkin(explicitSkin)) {
    return { skin: explicitSkin };
  }
  return { skin: isValidSkin(contextSkin) ? contextSkin : "default" };
}

export function useComponentSkin(explicitSkin?: ComponentSkinProp) {
  const skinCtx = useSkin();
  const optionalDnaWorld = useOptionalDnaWorld();
  const contextOrDnaSkin = skinCtx.isProvided
    ? skinCtx.skin
    : (optionalDnaWorld?.mappedSkinPreset ?? skinCtx.skin);
  const resolved = resolveComponentSkinName(explicitSkin, contextOrDnaSkin);
  const resolvedDnaId = skinCtx.hasExplicitDna
    ? skinCtx.dnaId
    : (optionalDnaWorld?.id ?? skinCtx.dnaId);
  const recipe = SKIN_RECIPES[resolved.skin];
  return {
    skin: resolved.skin,
    legacySkin: resolved.legacySkin,
    dnaId: resolvedDnaId,
    resolvedMode: skinCtx.resolvedMode,
    recipe,
  };
}
