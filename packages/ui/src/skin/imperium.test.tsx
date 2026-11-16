// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  DnaBadge,
  DnaButton,
  DnaChamber,
  DnaPortalArch,
  OctagramMandalaIcon,
  SkinRoot,
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
  it("isolates dna-base.css and imperium.css without :root or body collisions", () => {
    const dnaBase = readFileSync(resolve(import.meta.dirname, "../skins/dna-base.css"), "utf8");
    const imperiumCss = readFileSync(resolve(import.meta.dirname, "../skins/imperium.css"), "utf8");

    expect(dnaBase).not.toMatch(/(?:^|\n)\s*(?::root|body|html)\s*\{/);
    expect(imperiumCss).not.toMatch(/(?:^|\n)\s*(?::root|body|html)\s*\{/);
    expect(imperiumCss).toContain('[data-dna="01-imperium-lumen"]');
    expect(imperiumCss).toContain(".btn-chamfer");
    expect(imperiumCss).toContain(".btn-luxe-secondary");
    expect(imperiumCss).toContain(".octa-bevel-shell");
    expect(imperiumCss).toContain(".portal-arch-card");
  });

  it("renders Imperium Lumen primitives inside SkinRoot without zine tokens", () => {
    act(() => {
      root.render(
        <SkinRoot dnaId="01-imperium-lumen">
          <OctagramMandalaIcon />
          <DnaButton tone="primary">Enter Gate</DnaButton>
          <DnaButton tone="secondary">Scriptures</DnaButton>
          <DnaChamber cornerBrackets>
            <DnaPortalArch aria-selected={true}>Door I</DnaPortalArch>
            <DnaBadge>TAURAT</DnaBadge>
          </DnaChamber>
        </SkinRoot>,
      );
    });

    const scopeEl = container.querySelector('[data-dna="01-imperium-lumen"]') as HTMLElement;
    expect(scopeEl).not.toBeNull();
    expect(scopeEl.style.getPropertyValue("--dna-canvas")).toBe("#040509");

    const buttons = container.querySelectorAll("button");
    expect(buttons[0]?.className).toContain("btn-chamfer");
    expect(buttons[1]?.className).toContain("btn-luxe-secondary");
    expect(buttons[2]?.className).toContain("portal-arch-card");
    expect(container.innerHTML).toContain("octa-bevel-shell");
    // SacredCornerBrackets renders 4 corner SVGs + 1 OctagramMandalaIcon
    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(5);
  });

  it("adapts the same primitives automatically to 03-rocksoul without Imperium classes", () => {
    act(() => {
      root.render(
        <SkinRoot dnaId="03-rocksoul">
          <DnaButton tone="primary">Rocksoul CTA</DnaButton>
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
});
