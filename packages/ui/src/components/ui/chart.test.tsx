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
  it("renders Sparkline, LineChart, AreaChart, BarChart, and RadialGauge with semantic tokens", () => {
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
    expect(container.querySelector('svg[data-mw-chart="line"]')).not.toBeNull();
    expect(container.querySelector('svg[data-mw-chart="area"]')).not.toBeNull();
    const gauge = container.querySelector('svg[data-mw-chart="radial-gauge"]');
    expect(gauge?.getAttribute("aria-label")).toBe("CPU 74%");
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
  it("exposes chart categories and values in an accessible table instead of duplicate SVG announcements", () => {
    const series = [
      { id: "Jan", label: "January", value: 12 },
      { id: "Feb", label: "February", value: 28 },
    ] as const;

    renderNode(
      <SkinProvider defaultSkin="technical" persist={false}>
        <ChartContainer title="Deployment metrics">
          <BarChart data={series} ariaLabel="Deployments by month" />
          <LineChart data={series} ariaLabel="Deployment trend" />
          <Sparkline data={[3, 8]} ariaLabel="Queue depth" />
          <RadialGauge value={76} label="CPU" ariaLabel="CPU utilization" />
          <BarChart data={[]} ariaLabel="Empty chart" />
        </ChartContainer>
      </SkinProvider>,
    );

    const charts = container.querySelectorAll("svg[role='img']");
    expect(charts).toHaveLength(5);
    for (const chart of charts) {
      expect(chart.getAttribute("aria-hidden")).toBe("true");
      expect(chart.hasAttribute("aria-label")).toBe(false);
    }

    const tables = Array.from(container.querySelectorAll("table.sr-only"));
    expect(tables).toHaveLength(5);
    expect(tables[0]?.querySelector("caption")?.textContent).toBe("Deployments by month");
    expect(tables[0]?.textContent).toContain("January");
    expect(tables[0]?.textContent).toContain("12");
    expect(tables[0]?.textContent).toContain("February");
    expect(tables[0]?.textContent).toContain("28");
    expect(tables[1]?.querySelector("caption")?.textContent).toBe("Deployment trend");
    expect(tables[2]?.textContent).toContain("Point 1");
    expect(tables[2]?.textContent).toContain("Point 2");
    expect(tables[3]?.textContent).toContain("CPU");
    expect(tables[3]?.textContent).toContain("76%");
    expect(tables[4]?.textContent).toContain("No data available");
  });

  it("can preserve the SVG image label when the accessible data table is disabled", () => {
    renderNode(
      <BarChart
        data={[{ label: "Active", value: 4 }]}
        ariaLabel="Active sessions"
        accessibleData={false}
      />,
    );

    const chart = container.querySelector("svg[role='img']");
    expect(chart?.getAttribute("aria-label")).toBe("Active sessions");
    expect(chart?.hasAttribute("aria-hidden")).toBe(false);
    expect(container.querySelector("table.sr-only")).toBeNull();
  });

});
