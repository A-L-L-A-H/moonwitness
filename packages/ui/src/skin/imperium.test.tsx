// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  CrownEmblemIcon,
  DnaBadge,
  DnaButton,
  DnaChamber,
  DnaPortalArch,
  EditorialFeature,
  IMPERIUM_LUMEN_TOKENS,
  IllustratedHero,
  IllustrationFrame,
  MASTER_DNA_WORLDS,
  MotionReveal,
  OctagramMandalaIcon,
  PrimaryAction,
  ResponsiveImage,
  SACRED_VISUAL_COVENANT,
  SecondaryAction,
  SectionHeading,
  SiteNavigation,
  SkinRoot,
  StorySection,
  WorldAtlas,
  WorldExplorer,
  WorldTile,
} from "./imperium";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe("@moonwitness/ui imperium skin & scoped CSS layer", () => {
  it("isolates dna-base.css and imperium.css without :root, html, or body collisions", () => {
    const dnaBase = readFileSync(resolve(import.meta.dirname, "../skins/dna-base.css"), "utf8");
    const imperiumCss = readFileSync(resolve(import.meta.dirname, "../skins/imperium.css"), "utf8");

    expect(dnaBase).not.toMatch(/(?:^|\n)\s*(?::root|body|html)\s*\{/);
    expect(imperiumCss).not.toMatch(/(?:^|\n)\s*(?::root|body|html)\s*\{/);
    expect(imperiumCss).toContain('[data-dna="01-imperium-lumen"]');
    expect(imperiumCss).toContain(".btn-chamfer");
    expect(imperiumCss).toContain(".btn-luxe-secondary");
    expect(imperiumCss).toContain(".octa-bevel-shell");
    expect(imperiumCss).toContain(".portal-arch-card");
    expect(imperiumCss).toContain("prefers-reduced-motion: reduce");
  });

  it("exposes reformed IMPERIUM_LUMEN_TOKENS and SACRED_VISUAL_COVENANT", () => {
    expect(IMPERIUM_LUMEN_TOKENS.brand.ink).toBe("#08090d");
    expect(IMPERIUM_LUMEN_TOKENS.brand.paper).toBe("#f4ecd8");
    expect(IMPERIUM_LUMEN_TOKENS.brand.yellow).toBe("#f6d438");
    expect(IMPERIUM_LUMEN_TOKENS.brand.pink).toBe("#ed149b");
    expect(IMPERIUM_LUMEN_TOKENS.brand.blue).toBe("#2ea8ff");
    expect(IMPERIUM_LUMEN_TOKENS.brand.white).toBe("#fff8e8");
    expect(SACRED_VISUAL_COVENANT.originalIllustrationsAllowed).toBe(true);
    expect(SACRED_VISUAL_COVENANT.cartoonAndAnimeForbidden).toBe(false);
    expect(SACRED_VISUAL_COVENANT.depictionOfAllahForbidden).toBe(true);
    expect(SACRED_VISUAL_COVENANT.humanFacesForbidden).toBe(true);
    expect(SACRED_VISUAL_COVENANT.copyrightImitationForbidden).toBe(true);
    expect(SACRED_VISUAL_COVENANT.violentImageryForbidden).toBe(true);
    expect(SACRED_VISUAL_COVENANT.decorativeSacredTextTexturesForbidden).toBe(true);
  });

  it("renders Imperium Lumen primitives and reusable illustrated components inside SkinRoot", () => {
    const onSelectAtlas = vi.fn();

    act(() => {
      root.render(
        <SkinRoot dnaId="01-imperium-lumen">
          <SiteNavigation
            brand={
              <span>
                <CrownEmblemIcon /> TEST BRAND
              </span>
            }
            items={[{ id: "home", label: "HOME", href: "#home", active: true }]}
            actions={<SecondaryAction>SIGN IN</SecondaryAction>}
          />
          <IllustratedHero
            id="hero"
            backdrop={<ResponsiveImage src="/hero.webp" alt="Universe backdrop" />}
            kicker="UNIVERSE"
            title={<h1>EXPLORE WORLDS</h1>}
            subtitle="ILLUSTRATED EDITION"
            callouts={["FIRST LINE", "SECOND LINE"]}
            description="Discover nine interconnected creative worlds."
            actions={<PrimaryAction>ENTER</PrimaryAction>}
            shelf={
              <WorldExplorer heading={<h2>WORLDS</h2>}>
                <WorldTile
                  indexLabel="01"
                  title="WORLD ONE"
                  tagline="Stories & Archive"
                  ctaLabel="EXPLORE"
                  active
                />
              </WorldExplorer>
            }
          />
          <StorySection id="story" tone="surface">
            <SectionHeading title="STORY" description="Clear reading plane" />
            <MotionReveal disabled>
              <EditorialFeature
                media={
                  <IllustrationFrame scrim>
                    <OctagramMandalaIcon />
                  </IllustrationFrame>
                }
                content={
                  <DnaChamber cornerBrackets>
                    <DnaPortalArch aria-selected={true}>Door I</DnaPortalArch>
                    <DnaBadge>VERIFIED</DnaBadge>
                    <DnaButton tone="primary">Continue</DnaButton>
                  </DnaChamber>
                }
              />
            </MotionReveal>
            <WorldAtlas
              items={[
                { id: "w1", title: "WORLD 1", subtitle: "First world" },
                { id: "w2", title: "WORLD 2", subtitle: "Second world" },
              ]}
              activeId="w1"
              onSelect={onSelectAtlas}
            />
          </StorySection>
        </SkinRoot>,
      );
    });

    const scopeEl = container.querySelector('[data-dna="01-imperium-lumen"]') as HTMLElement;
    expect(scopeEl).not.toBeNull();
    expect(scopeEl.style.getPropertyValue("--dna-canvas")).toBe("#08090d");
    expect(scopeEl.style.getPropertyValue("--dna-accent")).toBe("#f6d438");
    expect(scopeEl.style.getPropertyValue("--dna-accent-secondary")).toBe("#ed149b");

    expect(container.querySelector(".mw-site-nav")).not.toBeNull();
    expect(container.querySelector(".mw-illustrated-hero")).not.toBeNull();
    expect(container.querySelector(".mw-world-explorer")).not.toBeNull();
    expect(container.querySelector(".mw-world-tile.is-active")).not.toBeNull();
    expect(container.querySelector(".mw-motion-reveal.is-static")).not.toBeNull();
    expect(container.innerHTML).toContain("octa-bevel-shell");
    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(6);
  });

  it("adapts the same primitives automatically to 03-rocksoul and 05-riot-anarchy without Imperium classes", () => {
    act(() => {
      root.render(
        <SkinRoot dnaId="03-rocksoul">
          <PrimaryAction>Rocksoul CTA</PrimaryAction>
          <DnaChamber cornerBrackets>
            <DnaBadge>NOISE × SILENCE</DnaBadge>
          </DnaChamber>
        </SkinRoot>,
      );
    });

    const scopeEl = container.querySelector('[data-dna="03-rocksoul"]') as HTMLElement;
    expect(scopeEl).not.toBeNull();
    expect(scopeEl.style.getPropertyValue("--dna-accent")).toBe("#f5b027");
    const button = container.querySelector("button");
    expect(button?.className).toContain("mw-dna-button");
    expect(button?.className).not.toContain("btn-chamfer");
    expect(container.innerHTML).not.toContain("octa-bevel-shell");
  });

  it("keeps imperium-tokens.ts free of 'use client' and in parity with MASTER_DNA_WORLDS['01-imperium-lumen']", () => {
    const tokensSource = readFileSync(resolve(__dirname, "imperium-tokens.ts"), "utf8");
    expect(tokensSource).not.toMatch(/^\s*["']use client["']/m);

    const imperiumPalette = MASTER_DNA_WORLDS["01-imperium-lumen"].palette;
    expect(imperiumPalette.canvas).toBe(IMPERIUM_LUMEN_TOKENS.semantic.canvas);
    expect(imperiumPalette.surface).toBe(IMPERIUM_LUMEN_TOKENS.semantic.surface);
    expect(imperiumPalette.surfaceElevated).toBe(IMPERIUM_LUMEN_TOKENS.semantic.surfaceElevated);
    expect(imperiumPalette.text).toBe(IMPERIUM_LUMEN_TOKENS.semantic.text);
    expect(imperiumPalette.mutedText).toBe(IMPERIUM_LUMEN_TOKENS.semantic.textMuted);
    expect(imperiumPalette.border).toBe(IMPERIUM_LUMEN_TOKENS.semantic.border);
    expect(imperiumPalette.accent).toBe(IMPERIUM_LUMEN_TOKENS.semantic.accent);
    expect(imperiumPalette.accentSecondary).toBe(IMPERIUM_LUMEN_TOKENS.semantic.accentSecondary);
    expect(imperiumPalette.accentForeground).toBe(IMPERIUM_LUMEN_TOKENS.semantic.accentForeground);
    expect(imperiumPalette.focus).toBe(IMPERIUM_LUMEN_TOKENS.semantic.focus);
  });
});
