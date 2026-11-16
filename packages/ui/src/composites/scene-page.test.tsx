// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScenePage, ScenePanel, ChapterBanner, FilmStrip } from "./scene-page";
import { AtlasStage } from "./atlas-stage";
import { SkinProvider, useSkin, type SkinName } from "../skin";

const SKINS: SkinName[] = ["default", "riot", "editorial", "technical", "archive", "transmission"];
const EFFECTS = ".halftone, .grain, .scanlines, .cmyk-slip, .duotone, .brush-underline, .sticker";

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("Scene surfaces", () => {
  it("keeps page landmarks and heading levels owned by the caller", () => {
    act(() =>
      root.render(
        <ScenePage>
          <ChapterBanner
            chapter="01"
            title="Night shift"
            headingAs="h3"
            meta="Fiction"
            actions={<a href="#shot">Read</a>}
          />
          <ScenePanel id="shot" caption="Jakarta">
            <p>The first scene</p>
          </ScenePanel>
        </ScenePage>,
      ),
    );
    expect(container.querySelector("main, h1, h2")).toBeNull();
    expect(container.querySelector("h3")?.textContent).toBe("Night shift");
    expect(container.querySelector("article footer")?.textContent).toBe("Jakarta");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("#shot");
  });

  it("places decorative art behind the content without implicit textures", () => {
    act(() =>
      root.render(
        <ScenePanel art={<span data-art />} scrim="right">
          <button>Open scene</button>
        </ScenePanel>,
      ),
    );
    expect(container.querySelector('[aria-hidden="true"] [data-art]')).not.toBeNull();
    expect(container.querySelector("[data-scene-panel]")?.getAttribute("data-scrim")).toBe("right");
    expect(container.querySelector("button")?.closest('[aria-hidden="true"]')).toBeNull();
    expect(container.querySelector(".halftone, .grain, .scanlines")).toBeNull();
  });

  it("renders film frames as an ordered, keyboard-focusable scroll region", () => {
    act(() =>
      root.render(
        <FilmStrip label="Story chapters">
          <a href="#one">One</a>
          <a href="#two">Two</a>
        </FilmStrip>,
      ),
    );
    const region = container.querySelector('[role="region"]');
    expect(region?.getAttribute("aria-label")).toBe("Story chapters");
    expect(region?.getAttribute("tabindex")).toBe("0");
    expect(region?.querySelectorAll("ol > li > a")).toHaveLength(2);
    expect(region?.querySelector("button")).toBeNull();
  });

  it.each(SKINS)("preserves explicit Scene and Atlas effects when switching to %s", (skin) => {
    function Switch() {
      const { setSkin } = useSkin();
      return <button onClick={() => setSkin(skin)}>Switch</button>;
    }
    act(() =>
      root.render(
        <SkinProvider>
          <Switch />
          <ScenePanel effects={<span className="grain" data-scene-effect />}>Scene</ScenePanel>
          <AtlasStage effects={<span className="halftone" data-atlas-effect />}>Graph</AtlasStage>
        </SkinProvider>,
      ),
    );
    act(() => container.querySelector<HTMLButtonElement>("button")?.click());
    expect(container.querySelectorAll(EFFECTS)).toHaveLength(2);
    for (const selector of ["[data-scene-effect]", "[data-atlas-effect]"]) {
      const effect = container.querySelector(selector);
      expect(effect).not.toBeNull();
      expect(effect?.parentElement?.getAttribute("aria-hidden")).toBe("true");
      expect(effect?.parentElement?.classList.contains("pointer-events-none")).toBe(true);
    }
  });

  it.each(SKINS)("switches Scene and Atlas frames to %s without automatic effects", (skin) => {
    function Switch() {
      const { setSkin } = useSkin();
      return <button onClick={() => setSkin(skin)}>Switch</button>;
    }
    act(() =>
      root.render(
        <SkinProvider>
          <Switch />
          <ScenePanel>Scene</ScenePanel>
          <AtlasStage controls={<button>North</button>} details={<p>City detail</p>}>
            Graph
          </AtlasStage>
        </SkinProvider>,
      ),
    );
    expect(container.querySelector(".scene-layer.skin-default")).not.toBeNull();
    expect(container.querySelector(EFFECTS)).toBeNull();
    act(() => container.querySelector<HTMLButtonElement>("button")?.click());
    expect(container.querySelector(`.scene-layer.skin-${skin}`)).not.toBeNull();
    expect(container.querySelector(`.atlas-layer.skin-${skin}`)).not.toBeNull();
    expect(container.querySelector(EFFECTS)).toBeNull();
    expect(container.querySelector("[data-atlas-stage]")?.textContent).toBe(
      "GraphNorthCity detail",
    );
  });
});
