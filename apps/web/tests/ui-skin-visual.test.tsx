// @vitest-environment jsdom
import React, { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SkinProvider, listPresets } from "@moonwitness/ui";
import { SkinLaboratory } from "../src/components/skin-lab/SkinLaboratory";
import { MTimeInteractiveEngine } from "../src/components/mtime-observatory";
import { CodexWorkbench } from "../src/components/codex-workbench";
import { SanctuaryLocaleProvider } from "../src/lib/sanctuary-locale";

vi.mock("next/navigation", () => ({
  usePathname: () => "/skin-lab",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: Record<string, unknown>) =>
    React.createElement("img", {
      src: typeof src === "string" ? src : "/art/mock.webp",
      alt: typeof alt === "string" ? alt : "",
      className: props.className as string | undefined,
    }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("React", React);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ user: null }, { status: 200 })),
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("Multi-skin Visual & Component Surface Suite", () => {
  it("renders SkinLaboratory across 10 skins, 10-Skin Matrix, Logos & Cutouts tabs without errors", async () => {
    await act(async () => {
      root.render(
        <SkinProvider defaultSkin="technical" defaultDna="04-nexus-paradox" persist={false}>
          <SkinLaboratory />
        </SkinProvider>,
      );
    });

    expect(container.textContent).toContain("SKIN LABORATORY");
    expect(document.documentElement.getAttribute("data-skin")).toBe("technical");
    expect(document.documentElement.getAttribute("data-dna")).toBe("04-nexus-paradox");

    const matrixTab = Array.from(container.querySelectorAll('[role="tab"]')).find((el) =>
      el.textContent?.includes("10-SKIN MATRIX"),
    ) as HTMLElement | undefined;
    expect(matrixTab).toBeDefined();
    await act(async () => {
      matrixTab?.click();
    });
    expect(container.querySelector('[data-mw-matrix-compare="true"]')).not.toBeNull();
    for (const skin of listPresets()) {
      expect(container.querySelector(`[data-skin="${skin}"]`)).not.toBeNull();
    }

    const assetsTab = Array.from(container.querySelectorAll('[role="tab"]')).find((el) =>
      el.textContent?.includes("LOGOS & CUTOUTS"),
    ) as HTMLElement | undefined;
    expect(assetsTab).toBeDefined();
    await act(async () => {
      assetsTab?.click();
    });
    expect(container.querySelectorAll("svg[data-mw-brand-logo]").length).toBeGreaterThanOrEqual(18);
    expect(container.querySelectorAll("svg[data-mw-cutout]").length).toBeGreaterThanOrEqual(24);
    expect(container.querySelectorAll('svg[data-mw-icon="true"]').length).toBeGreaterThanOrEqual(
      12,
    );
  });

  it("renders MTimeInteractiveEngine and CodexWorkbench with gauges, cutouts, and ornaments", async () => {
    await act(async () => {
      root.render(
        <SkinProvider
          defaultSkin="editorial"
          defaultDna="01-imperium-lumen"
          defaultTheme="light"
          persist={false}
        >
          <SanctuaryLocaleProvider>
            <div>
              <MTimeInteractiveEngine compact />
              <CodexWorkbench />
            </div>
          </SanctuaryLocaleProvider>
        </SkinProvider>,
      );
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(
      container.querySelectorAll('svg[data-mw-chart="radial-gauge"]').length,
    ).toBeGreaterThanOrEqual(2);
    expect(container.querySelector('[data-mw-cutout="lunar-disc"]')).not.toBeNull();
    expect(container.querySelector('[data-mw-ornament="editorial"]')).not.toBeNull();
  });
});
