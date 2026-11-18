// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React, { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SkinProvider,
  SkinRoot,
  Skinned,
  applyThemeMode,
  brushUnderline,
  cmykSlip,
  composeEffects,
  duotone,
  effectPresets,
  grain,
  halftone,
  resolveThemeMode,
  scanlines,
  sticker,
  tape,
  useSkin,
  useThemeMode,
  type SkinName,
} from "./index";
import { BRAND_LOGO_IDS, DnaBrandLogo } from "../artwork/logos";
import { CUTOUT_ARTWORK_IDS, CutoutArtwork } from "../artwork/cutouts";
import { SkinBackdrop } from "../artwork/backdrop";
import { SkinOrnament } from "../primitives/tactile-hardware";
import { SkinPalette, VpnTunnel } from "../icons/modules";

let container: HTMLDivElement;
let root: Root;

function renderNode(node: React.ReactNode) {
  act(() => {
    root.render(node);
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  document.documentElement.removeAttribute("data-skin");
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-dna");
  document.documentElement.removeAttribute("data-density");
  document.getElementById("mw-skin-engine-variables")?.remove();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  document.getElementById("mw-skin-engine-variables")?.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PR 3 Skin Engine & Effect Integrity", () => {
  it("emits valid CSS utility class names from effects helpers without inline CSS syntax", () => {
    const outputs = [
      halftone(),
      halftone({ color: { hex: "#ff2d78" } }),
      grain(),
      cmykSlip(),
      duotone(),
      tape(),
      sticker(),
      brushUnderline(),
      scanlines(),
      composeEffects(halftone(), grain(), cmykSlip()),
      ...Object.values(effectPresets),
    ];

    for (const out of outputs) {
      expect(out).not.toMatch(/[;{}]|&::/);
    }
    expect(halftone()).toBe("halftone");
    expect(halftone({ color: { hex: "#ff2d78" } })).toBe("halftone-pink");
    expect(effectPresets.editorial).toContain("duotone");
    expect(effectPresets.transmission).toContain("scanlines");
  });

  it("renders real semantic HTML tags with forwarded refs for Skinned.*", () => {
    const btnRef = createRef<HTMLButtonElement>();
    const inputRef = createRef<HTMLInputElement>();

    renderNode(
      <div>
        <Skinned.RiotButton ref={btnRef as React.Ref<HTMLElement>} data-testid="r-btn">
          Fire
        </Skinned.RiotButton>
        <Skinned.TechnicalInput
          ref={inputRef as React.Ref<HTMLElement>}
          data-testid="t-in"
          aria-label="Node ID"
          defaultValue="MW-01"
        />
        <Skinned.EditorialBadge data-testid="e-badge">Zine</Skinned.EditorialBadge>
        <Skinned.ArchiveEventCard data-testid="a-ev">Archive item</Skinned.ArchiveEventCard>
      </div>,
    );

    const btn = container.querySelector('[data-testid="r-btn"]') as HTMLButtonElement | null;
    const inp = container.querySelector('[data-testid="t-in"]') as HTMLInputElement | null;
    const badge = container.querySelector('[data-testid="e-badge"]');
    const ev = container.querySelector('[data-testid="a-ev"]');

    expect(btn?.tagName).toBe("BUTTON");
    expect(btn?.type).toBe("button");
    expect(btn?.getAttribute("data-skin")).toBe("riot");
    expect(btnRef.current).toBe(btn);

    expect(inp?.tagName).toBe("INPUT");
    expect(inp?.type).toBe("text");
    expect(inp?.value).toBe("MW-01");
    expect(inp?.getAttribute("data-skin")).toBe("technical");
    expect(inputRef.current).toBe(inp);

    expect(badge?.tagName).toBe("SPAN");
    expect(ev?.tagName).toBe("ARTICLE");
  });

  it("synchronizes SkinProvider context, DOM attributes, CSS vars, and nested local scopes", () => {
    function Controls() {
      const { skin, resolvedMode, dnaId, setSkin, setMode } = useSkin();
      return (
        <div>
          <span data-testid="root-state">{`${skin}|${resolvedMode}|${dnaId}`}</span>
          <button type="button" onClick={() => setSkin("editorial")}>
            to-editorial
          </button>
          <button type="button" onClick={() => setMode("light")}>
            to-light
          </button>
        </div>
      );
    }

    function NestedProbe() {
      const { skin, dnaId } = useSkin();
      return <span data-testid="nested-state">{`${skin}|${dnaId}`}</span>;
    }

    renderNode(
      <SkinProvider defaultSkin="riot" defaultTheme="dark">
        <Controls />
        <SkinRoot dnaId="01-imperium-lumen">
          <SkinProvider defaultSkin="technical">
            <NestedProbe />
          </SkinProvider>
        </SkinRoot>
      </SkinProvider>,
    );

    expect(document.documentElement.getAttribute("data-skin")).toBe("riot");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.getElementById("mw-skin-engine-variables")?.textContent).toContain("--mw-btn-radius: 2px;");

    expect(container.querySelector('[data-testid="root-state"]')?.textContent).toBe(
      "riot|dark|05-riot-anarchy",
    );
    expect(container.querySelector('[data-testid="nested-state"]')?.textContent).toBe(
      "technical|01-imperium-lumen",
    );
    expect(container.querySelector('[data-skin="technical"][data-dna="01-imperium-lumen"]')).not.toBeNull();

    const toEditorial = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "to-editorial",
    );
    const toLight = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "to-light",
    );

    act(() => {
      toEditorial?.click();
      toLight?.click();
    });

    expect(document.documentElement.getAttribute("data-skin")).toBe("editorial");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    // Nested scope stays isolated as technical
    expect(container.querySelector('[data-skin="technical"]')).not.toBeNull();
  });

  it("handles invalid skin IDs, storage errors, and SSR rendering without crashing", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    function Probe() {
      const { skin, setSkin } = useSkin();
      return (
        <button type="button" onClick={() => setSkin("invalid-skin" as SkinName)}>
          {skin}
        </button>
      );
    }

    renderNode(
      <SkinProvider defaultSkin={"bogus-skin" as SkinName}>
        <Probe />
      </SkinProvider>,
    );

    const btn = container.querySelector("button")!;
    expect(btn.textContent).toBe("default");

    act(() => {
      btn.click();
    });
    expect(btn.textContent).toBe("default");

    // Server render under simulated missing window/matchMedia
    const originalWindow = globalThis.window;
    vi.stubGlobal("window", undefined);
    expect(resolveThemeMode("system")).toBe("dark");
    const html = renderToString(
      <SkinProvider defaultSkin="riot" defaultTheme="system">
        <span>ssr-ok</span>
      </SkinProvider>,
    );
    expect(html).toContain("ssr-ok");
    vi.stubGlobal("window", originalWindow);
  });

  it("reacts to OS prefers-color-scheme changes when theme mode is system", () => {
    let matches = false;
    const listeners = new Set<() => void>();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        get matches() {
          return matches;
        },
        media: "(prefers-color-scheme: light)",
        addEventListener: (_event: string, cb: () => void) => listeners.add(cb),
        removeEventListener: (_event: string, cb: () => void) => listeners.delete(cb),
        dispatchEvent: () => true,
      })),
    );

    function ModeProbe() {
      const { mode, resolved } = useThemeMode();
      return <span data-testid="mode-val">{`${mode}:${resolved}`}</span>;
    }

    renderNode(
      <SkinProvider defaultTheme="system" persist={false}>
        <ModeProbe />
      </SkinProvider>,
    );

    expect(container.querySelector('[data-testid="mode-val"]')?.textContent).toBe("system:dark");
    expect(applyThemeMode("system", false)).toBe("dark");

    act(() => {
      matches = true;
      for (const listener of listeners) listener();
    });

    expect(container.querySelector('[data-testid="mode-val"]')?.textContent).toBe("system:light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("keeps base.css global body rules guarded away from 01-imperium-lumen", () => {
    const baseCss = readFileSync(resolve(import.meta.dirname, "../base.css"), "utf8");
    expect(baseCss).not.toMatch(/(?:^|\n)\s*body\s*\{/);
    expect(baseCss).toContain(':where(body:not([data-dna="01-imperium-lumen"]))');
    expect(baseCss).toContain(".duotone");
    expect(baseCss).toContain(".scanlines");
  });

  it("persists and restores mw-dna and mw-density in localStorage and sets data-dna on documentElement", () => {
    localStorage.setItem("mw-dna", "04-nexus-paradox");
    localStorage.setItem("mw-density", "compact");

    function PersistenceProbe() {
      const { dnaId, density, setDna, setDensity } = useSkin();
      return (
        <div>
          <span data-testid="dna-density">{`${dnaId}:${density}`}</span>
          <button
            type="button"
            data-testid="switch-dna-density"
            onClick={() => {
              setDna("09-simpul-nusantara");
              setDensity("spacious");
            }}
          >
            switch
          </button>
        </div>
      );
    }

    renderNode(
      <SkinProvider persist>
        <PersistenceProbe />
      </SkinProvider>,
    );

    expect(container.querySelector('[data-testid="dna-density"]')?.textContent).toBe(
      "04-nexus-paradox:compact",
    );
    expect(document.documentElement.getAttribute("data-dna")).toBe("04-nexus-paradox");
    expect(document.documentElement.getAttribute("data-density")).toBe("compact");

    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="switch-dna-density"]')?.click();
    });

    expect(localStorage.getItem("mw-dna")).toBe("09-simpul-nusantara");
    expect(localStorage.getItem("mw-density")).toBe("spacious");
    expect(document.documentElement.getAttribute("data-dna")).toBe("09-simpul-nusantara");
    expect(document.documentElement.getAttribute("data-density")).toBe("spacious");
  });

  it("renders all 10 DnaBrandLogo lockups and all 12 CutoutArtwork assets", () => {
    expect(BRAND_LOGO_IDS).toHaveLength(10);
    for (const id of BRAND_LOGO_IDS) {
      for (const variant of ["mark", "lockup", "wordmark"] as const) {
        const html = renderToString(<DnaBrandLogo id={id} variant={variant} />);
        expect(html).toContain(`data-mw-brand-logo="${id}"`);
        expect(html).toContain(`data-mw-brand-variant="${variant}"`);
      }
    }

    expect(CUTOUT_ARTWORK_IDS).toHaveLength(12);
    for (const id of CUTOUT_ARTWORK_IDS) {
      const html = renderToString(<CutoutArtwork id={id} />);
      expect(html).toContain(`data-mw-cutout="${id}"`);
    }
  });

  it("renders skin-reactive SkinBackdrop, SkinOrnament, and sovereign domain icons across skins", () => {
    for (const skinName of ["riot", "technical", "editorial", "archive", "transmission"] as const) {
      const html = renderToString(
        <SkinProvider defaultSkin={skinName} persist={false}>
          <div>
            <SkinBackdrop skin={skinName} dnaId="03-rocksoul" />
            <SkinOrnament slot="corner" label={skinName} />
            <VpnTunnel />
            <SkinPalette />
          </div>
        </SkinProvider>,
      );
      expect(html).toContain(`data-mw-backdrop-skin="${skinName}"`);
      expect(html).toContain('data-mw-icon="true"');
      expect(html).toContain("data-mw-ornament");
    }
  });
});
