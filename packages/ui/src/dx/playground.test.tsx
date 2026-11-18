// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SkinPlayground } from "./playground";
import { TokenInspector } from "./inspector";

let container: HTMLDivElement;
let root: Root;

function renderNode(node: React.ReactNode) {
  act(() => {
    root.render(node);
  });
}

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
  vi.unstubAllGlobals();
});

describe("PR 8 Component-Driven SkinPlayground & TokenInspector", () => {
  it("renders real @moonwitness/ui components and mutates rendered DOM when skin, DNA, and theme change", () => {
    renderNode(<SkinPlayground />);

    const playground = container.querySelector('[data-testid="mw-skin-playground"]');
    expect(playground).not.toBeNull();

    const realButton = () =>
      Array.from(container.querySelectorAll("button[data-skin]")).find((b) =>
        b.textContent?.includes("Primary"),
      );

    expect(realButton()?.getAttribute("data-skin")).toBe("default");
    expect(realButton()?.getAttribute("data-dna")).toBe("05-riot-anarchy");

    const riotBtn = container.querySelector('button[aria-pressed][class*="border"]');
    const selectSkinBtn = Array.from(
      container.querySelectorAll('[aria-label="Select Skin"] button'),
    ).find((b) => b.textContent === "Riot") as HTMLButtonElement;
    expect(riotBtn).not.toBeNull();
    act(() => {
      selectSkinBtn.click();
    });
    expect(realButton()?.getAttribute("data-skin")).toBe("riot");

    // Change DNA selector -> rendered Button data-dna updates
    const dnaSelect = container.querySelector(
      'select[aria-label="DNA Identity"]',
    ) as HTMLSelectElement;
    act(() => {
      dnaSelect.value = "01-imperium-lumen";
      dnaSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(realButton()?.getAttribute("data-dna")).toBe("01-imperium-lumen");

    // Change viewport preview -> responsive container width updates
    const vpSelect = container.querySelector(
      'select[aria-label="Viewport Preview"]',
    ) as HTMLSelectElement;
    act(() => {
      vpSelect.value = "mobile";
      vpSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const viewport = container.querySelector(
      '[data-testid="playground-viewport"]',
    ) as HTMLDivElement;
    expect(viewport.style.width).toBe("390px");
  });

  it("renders TokenInspector without broken --radius: [object Object] CSS", () => {
    renderNode(<TokenInspector />);
    const pre = container.querySelector("pre");
    expect(pre?.textContent).toContain("--radius: 0.5rem;");
    expect(pre?.textContent).not.toContain("[object Object]");
    expect(pre?.textContent).toContain(
      '[data-dna="05-riot-anarchy"][data-skin="default"][data-theme="dark"]',
    );
  });
});
