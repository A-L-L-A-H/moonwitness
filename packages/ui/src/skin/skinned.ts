"use client";

import React, { type CSSProperties } from "react";
import { canonicalTokensToCssVariables, resolveCanonicalTokens } from "../dna/canonical";
import type { SkinName } from "./compositions";
import { skinBaseClasses } from "./classes";
import { isValidSkin } from "./constants";

const SEMANTIC_TAG_FOR_SKINNED: Record<string, keyof React.JSX.IntrinsicElements> = {
  button: "button",
  input: "input",
  badge: "span",
  card: "div",
  eventCard: "article",
  kanbanColumn: "section",
  moduleCard: "article",
};

export type SkinnedComponentProps = React.AllHTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
};

/**
 * Create a semantic HTML skin component (e.g. `button` for `'button'`, `input` for `'input'`)
 * carrying real skin recipe classes, `data-skin` attribute, and canonical CSS variables.
 */
export function createSkinComponent(componentName: string, skinName: SkinName) {
  const safeSkin: SkinName = isValidSkin(skinName) ? skinName : "default";
  const defaultTag = SEMANTIC_TAG_FOR_SKINNED[componentName] ?? "div";
  const resolved = resolveCanonicalTokens({ skin: safeSkin });
  const vars = canonicalTokensToCssVariables(resolved);

  const SkinnedComponent = React.forwardRef<HTMLElement, SkinnedComponentProps>(
    function SkinnedComponent({ as, className, style, children, ...rest }, ref) {
      const Tag = as || defaultTag;
      const baseClasses = skinBaseClasses(safeSkin);
      const mergedClass = [baseClasses[componentName] || "", className].filter(Boolean).join(" ");
      const defaultProps: Record<string, unknown> = {};
      if (Tag === "button" && !("type" in rest)) {
        defaultProps["type"] = "button";
      }
      if (Tag === "input" && !("type" in rest)) {
        defaultProps["type"] = "text";
      }

      return React.createElement(
        Tag,
        {
          ...defaultProps,
          ...rest,
          ref,
          className: mergedClass,
          style: { ...(vars as CSSProperties), ...style },
          "data-skin": safeSkin,
        },
        Tag === "input" ? undefined : children,
      );
    },
  );

  SkinnedComponent.displayName = `Skinned(${safeSkin}:${componentName})`;
  return SkinnedComponent;
}

export const Skinned = {
  Button: createSkinComponent("button", "default"),
  RiotButton: createSkinComponent("button", "riot"),
  EditorialButton: createSkinComponent("button", "editorial"),
  TechnicalButton: createSkinComponent("button", "technical"),
  ArchiveButton: createSkinComponent("button", "archive"),
  TransmissionButton: createSkinComponent("button", "transmission"),
  SanctuaryButton: createSkinComponent("button", "sanctuary"),
  BrutalistButton: createSkinComponent("button", "brutalist"),
  NoirButton: createSkinComponent("button", "noir"),
  KineticButton: createSkinComponent("button", "kinetic"),
  Card: createSkinComponent("card", "default"),
  RiotCard: createSkinComponent("card", "riot"),
  EditorialCard: createSkinComponent("card", "editorial"),
  TechnicalCard: createSkinComponent("card", "technical"),
  ArchiveCard: createSkinComponent("card", "archive"),
  TransmissionCard: createSkinComponent("card", "transmission"),
  SanctuaryCard: createSkinComponent("card", "sanctuary"),
  BrutalistCard: createSkinComponent("card", "brutalist"),
  NoirCard: createSkinComponent("card", "noir"),
  KineticCard: createSkinComponent("card", "kinetic"),
  Input: createSkinComponent("input", "default"),
  RiotInput: createSkinComponent("input", "riot"),
  EditorialInput: createSkinComponent("input", "editorial"),
  TechnicalInput: createSkinComponent("input", "technical"),
  ArchiveInput: createSkinComponent("input", "archive"),
  TransmissionInput: createSkinComponent("input", "transmission"),
  SanctuaryInput: createSkinComponent("input", "sanctuary"),
  BrutalistInput: createSkinComponent("input", "brutalist"),
  NoirInput: createSkinComponent("input", "noir"),
  KineticInput: createSkinComponent("input", "kinetic"),
  Badge: createSkinComponent("badge", "default"),
  RiotBadge: createSkinComponent("badge", "riot"),
  EditorialBadge: createSkinComponent("badge", "editorial"),
  TechnicalBadge: createSkinComponent("badge", "technical"),
  ArchiveBadge: createSkinComponent("badge", "archive"),
  TransmissionBadge: createSkinComponent("badge", "transmission"),
  SanctuaryBadge: createSkinComponent("badge", "sanctuary"),
  BrutalistBadge: createSkinComponent("badge", "brutalist"),
  NoirBadge: createSkinComponent("badge", "noir"),
  KineticBadge: createSkinComponent("badge", "kinetic"),
  EventCard: createSkinComponent("eventCard", "default"),
  RiotEventCard: createSkinComponent("eventCard", "riot"),
  EditorialEventCard: createSkinComponent("eventCard", "editorial"),
  TechnicalEventCard: createSkinComponent("eventCard", "technical"),
  ArchiveEventCard: createSkinComponent("eventCard", "archive"),
  TransmissionEventCard: createSkinComponent("eventCard", "transmission"),
  SanctuaryEventCard: createSkinComponent("eventCard", "sanctuary"),
  BrutalistEventCard: createSkinComponent("eventCard", "brutalist"),
  NoirEventCard: createSkinComponent("eventCard", "noir"),
  KineticEventCard: createSkinComponent("eventCard", "kinetic"),
  KanbanColumn: createSkinComponent("kanbanColumn", "default"),
  RiotKanbanColumn: createSkinComponent("kanbanColumn", "riot"),
  EditorialKanbanColumn: createSkinComponent("kanbanColumn", "editorial"),
  TechnicalKanbanColumn: createSkinComponent("kanbanColumn", "technical"),
  ArchiveKanbanColumn: createSkinComponent("kanbanColumn", "archive"),
  TransmissionKanbanColumn: createSkinComponent("kanbanColumn", "transmission"),
  SanctuaryKanbanColumn: createSkinComponent("kanbanColumn", "sanctuary"),
  BrutalistKanbanColumn: createSkinComponent("kanbanColumn", "brutalist"),
  NoirKanbanColumn: createSkinComponent("kanbanColumn", "noir"),
  KineticKanbanColumn: createSkinComponent("kanbanColumn", "kinetic"),
  ModuleCard: createSkinComponent("moduleCard", "default"),
  RiotModuleCard: createSkinComponent("moduleCard", "riot"),
  EditorialModuleCard: createSkinComponent("moduleCard", "editorial"),
  TechnicalModuleCard: createSkinComponent("moduleCard", "technical"),
  ArchiveModuleCard: createSkinComponent("moduleCard", "archive"),
  TransmissionModuleCard: createSkinComponent("moduleCard", "transmission"),
  SanctuaryModuleCard: createSkinComponent("moduleCard", "sanctuary"),
  BrutalistModuleCard: createSkinComponent("moduleCard", "brutalist"),
  NoirModuleCard: createSkinComponent("moduleCard", "noir"),
  KineticModuleCard: createSkinComponent("moduleCard", "kinetic"),
};
