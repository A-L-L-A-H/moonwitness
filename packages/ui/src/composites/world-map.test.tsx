// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorldMap, type MapCityItem } from "./world-map";
import { SkinProvider, useSkin, type SkinName } from "../skin";

const SKINS: SkinName[] = ["default", "riot", "editorial", "technical", "archive", "transmission"];
const EFFECTS = ".halftone, .grain, .scanlines, .cmyk-slip, .duotone, .brush-underline, .sticker";

let container: HTMLDivElement;
let root: Root;
const cities: MapCityItem[] = [
  { id: "north", city: "North", x: 20, y: 30, signals: 3 },
  { id: "south", city: "South", x: 70, y: 80, signals: 8 },
];
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

function renderMap(records = cities, selectedId: string | null = null, onSelect = vi.fn()) {
  act(() =>
    root.render(
      <SkinProvider>
        <WorldMap
          cities={records}
          selectedId={selectedId}
          onSelect={onSelect}
          backdrop={<span data-art>Atlas artwork</span>}
        />
      </SkinProvider>,
    ),
  );
  return onSelect;
}

describe("WorldMap atlas contract", () => {
  it("keeps backdrop and list while assigning texture ownership to the consumer", () => {
    renderMap();
    expect(container.querySelector("[data-atlas-stage]")).not.toBeNull();
    expect(container.querySelector("[data-art]")?.textContent).toBe("Atlas artwork");
    expect(container.querySelectorAll("ul button")).toHaveLength(2);
    expect(container.querySelector(".halftone, .grain")).toBeNull();
  });

  it("selects through pointer, Enter, Space and the existing city list", () => {
    const select = renderMap();
    const node = container.querySelector('[role="button"][aria-label="Select North"]');
    expect(node).not.toBeNull();
    act(() => node?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    act(() => node?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    act(() => node?.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true })));
    act(() => container.querySelector<HTMLButtonElement>("ul button")?.click());
    expect(select.mock.calls).toEqual([["north"], ["north"], ["north"], ["north"]]);
  });

  it("keeps controlled selection, coordinates and exactly one edge per pair", () => {
    renderMap(cities, "south");
    expect(
      container.querySelector('[aria-label="Select South"]')?.getAttribute("aria-pressed"),
    ).toBe("true");
    expect(container.querySelectorAll("ul button")[1]?.getAttribute("aria-pressed")).toBe("true");
    const edges = container.querySelectorAll("line");
    expect(edges).toHaveLength(1);
    expect(edges[0]?.getAttribute("y1")).toBe("24");
    expect(edges[0]?.getAttribute("y2")).toBe("64");
    for (const mark of container.querySelectorAll("[fill], [stroke]")) {
      expect(`${mark.getAttribute("fill")} ${mark.getAttribute("stroke")}`).not.toMatch(
        /#[0-9a-f]{3,8}/i,
      );
    }
    renderMap(cities, "north");
    expect(
      container.querySelector('[aria-label="Select South"]')?.getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("renders empty and single-city graphs without phantom connections", () => {
    renderMap([]);
    expect(container.querySelectorAll("svg [role=button], line, ul li")).toHaveLength(0);
    renderMap(cities.slice(0, 1));
    expect(container.querySelectorAll("svg [role=button]")).toHaveLength(1);
    expect(container.querySelectorAll("line")).toHaveLength(0);
  });

  it.each(SKINS)("switches the atlas frame to %s without automatic effects", (skin) => {
    function Switch() {
      const { setSkin } = useSkin();
      return <button onClick={() => setSkin(skin)}>Switch</button>;
    }
    act(() =>
      root.render(
        <SkinProvider>
          <Switch />
          <WorldMap cities={cities} selectedId={null} onSelect={() => {}} />
        </SkinProvider>,
      ),
    );
    expect(container.querySelector(".atlas-layer.skin-default")).not.toBeNull();
    expect(container.querySelector(EFFECTS)).toBeNull();
    act(() => container.querySelector<HTMLButtonElement>("button")?.click());
    expect(container.querySelector(`.atlas-layer.skin-${skin}`)).not.toBeNull();
    expect(container.querySelector(EFFECTS)).toBeNull();
  });
});
