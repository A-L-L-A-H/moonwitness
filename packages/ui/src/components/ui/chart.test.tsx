// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AreaChart,
  BarChart,
  ChartContainer,
  LineChart,
  RadialGauge,
  SkinMatrixCompare,
  SkinProvider,
  Sparkline,
  formatSkinTokensAsCss,
  formatSkinTokensAsJson,
} from "../../index";

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

describe("Telemetry charts and SkinMatrixCompare", () => {
  it("renders chart primitives with semantic tokens", () => {
    const series = [
      { label: "T1", value: 12 },
      { label: "T2", value: 28 },
      { label: "T3", value: 19 },
      { label: "T4", value: 44 },
    ] as const;

    renderNode(
      <SkinProvider defaultSkin="technical" persist={false}>
        <ChartContainer title="Telemetry Suite">
          <Sparkline data={[5]} />
          <Sparkline data={series} />
          <LineChart data={series} />
          <AreaChart data={series} />
          <BarChart data={series} />
          <RadialGauge value={74} max={100} label="CPU" />
        </ChartContainer>
      </SkinProvider>,
    );

    expect(container.querySelectorAll('svg[data-mw-chart="sparkline"]').length).toBe(2);
    expect(container.querySelectorAll("svg[aria-hidden='true']")).toHaveLength(6);
    expect(
      container.querySelectorAll("table[data-mw-chart-data-alternative='true']"),
    ).toHaveLength(6);
    expect(container.querySelector('svg[data-mw-chart="line"]')).not.toBeNull();
    expect(container.querySelector('svg[data-mw-chart="area"]')).not.toBeNull();
    const gauge = container.querySelector('svg[data-mw-chart="radial-gauge"]');
    expect(gauge?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("table caption")?.textContent).toBe("CPU 74% data");
  });

  it("exposes chart values as accessible tables while hiding decorative SVGs", () => {
    const inbound = [
      { label: "00:00", value: 12 },
      { label: "00:05", value: 0 },
    ] as const;
    const outbound = [
      { label: "00:00", value: 5 },
      { label: "00:05", value: 18 },
    ] as const;

    renderNode(
      <ChartContainer title="Network traffic">
        <BarChart data={inbound} ariaLabel="Inbound traffic" />
        <LineChart data={outbound} ariaLabel="Outbound traffic" />
        <Sparkline data={[2, 0, 4]} ariaLabel="Packet samples" />
        <RadialGauge value={74} label="CPU" ariaLabel="CPU utilisation" />
      </ChartContainer>,
    );

    const tables = Array.from(
      container.querySelectorAll<HTMLTableElement>("table[data-mw-chart-data-alternative='true']"),
    );
    expect(tables).toHaveLength(4);
    expect(tables[0]?.caption?.textContent).toBe("Inbound traffic data");
    expect(tables[0]?.textContent).toContain("00:05");
    expect(tables[0]?.textContent).toContain("0");
    expect(tables[1]?.caption?.textContent).toBe("Outbound traffic data");
    expect(tables[1]?.textContent).toContain("18");
    expect(tables[2]?.caption?.textContent).toBe("Packet samples data");
    expect(tables[2]?.textContent).toContain("Point 2");
    expect(tables[2]?.textContent).toContain("4");
    expect(tables[3]?.caption?.textContent).toBe("CPU utilisation data");
    expect(tables[3]?.textContent).toContain("74%");
    expect(container.querySelectorAll("svg[role='img']")).toHaveLength(0);
    expect(container.querySelectorAll("svg[aria-hidden='true']")).toHaveLength(4);
  });

  it("renders all 10 skins inside SkinMatrixCompare and formats CSS/JSON exports", () => {
    renderNode(<SkinMatrixCompare dnaId="05-riot-anarchy" mode="dark" density="compact" />);

    const scopes = container.querySelectorAll("[data-mw-matrix-compare='true'] [data-skin]");
    const skinNames = new Set(Array.from(scopes).map((el) => el.getAttribute("data-skin")));
    expect(skinNames).toEqual(
      new Set([
        "default",
        "riot",
        "editorial",
        "technical",
        "archive",
        "transmission",
        "sanctuary",
        "brutalist",
        "noir",
        "kinetic",
      ]),
    );

    const cssOut = formatSkinTokensAsCss("05-riot-anarchy", "technical", "light", "compact");
    expect(cssOut).toContain(
      '[data-skin="technical"][data-dna="05-riot-anarchy"][data-theme="light"]',
    );
    expect(cssOut).toContain("--mw-motion-duration:");

    const jsonOut = JSON.parse(
      formatSkinTokensAsJson("03-rocksoul", "riot", "dark", "comfortable"),
    ) as { dnaId: string; skin: string; variables: Record<string, string> };
    expect(jsonOut.dnaId).toBe("03-rocksoul");
    expect(jsonOut.skin).toBe("riot");
    expect(jsonOut.variables["--primary"]).toBeDefined();
  });
});
