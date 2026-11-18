import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  IMPERIUM_LUMEN_TOKENS as UI_IMPERIUM_TOKENS,
  LIVING_LIGHT_PALETTE as UI_LIVING_LIGHT_PALETTE,
  SkinRoot,
} from "@moonwitness/ui/imperium";
import { IMPERIUM_LUMEN_TOKENS, LIVING_LIGHT_PALETTE } from "@/data/design-tokens";
import { SanctuaryLocaleProvider } from "@/lib/sanctuary-locale";
import { EmpireOfLightExperience } from "@/components/empire-of-light-experience";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const src = typeof props.src === "string" ? props.src : "/art/mock.webp";
    const alt = typeof props.alt === "string" ? props.alt : "";
    return React.createElement("img", {
      src,
      alt,
      className: props.className as string | undefined,
    });
  },
}));

describe("EmpireOfLightExperience centralized UI integration", () => {
  it("aliases design tokens directly to @moonwitness/ui without duplication", () => {
    expect(IMPERIUM_LUMEN_TOKENS).toBe(UI_IMPERIUM_TOKENS);
    expect(LIVING_LIGHT_PALETTE).toBe(UI_LIVING_LIGHT_PALETTE);
  });

  it("renders Nine Worlds through centralized @moonwitness/ui components", () => {
    const html = renderToStaticMarkup(
      React.createElement(SkinRoot, {
        dnaId: "01-imperium-lumen",
        children: React.createElement(SanctuaryLocaleProvider, {
          children: React.createElement(EmpireOfLightExperience),
        }),
      }),
    );

    expect(html).toContain('data-dna="01-imperium-lumen"');
    expect(html).toContain("mw-site-nav");
    expect(html).toContain("mw-illustrated-hero");
    expect(html).toContain("mw-world-explorer");
    expect(html.match(/mw-world-tile/g)?.length ?? 0).toBeGreaterThanOrEqual(9);

    for (const expectedWorld of [
      "MOONWITNESS",
      "ARSY",
      "HUMAN-PEN",
      "SIDRA",
      "ROCKSOUL DX",
      "CRAYON",
      "SIN CAN",
      "MYTHOS",
      "ANGEL WITH SHOTGUN",
    ]) {
      expect(html).toContain(expectedWorld);
    }
  });
});
