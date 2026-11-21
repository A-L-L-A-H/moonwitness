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
    const hiddenSvgs = container.querySelectorAll("svg[aria-hidden='true']");
    expect(hiddenSvgs).toHaveLength(6);
    expect(container.querySelectorAll("table[data-mw-chart-data-alternative='true']")).toHaveLength(
      6,
    );
    expect(container.querySelector('svg[data-mw-chart="line"]')).not.toBeNull();
    expect(container.querySelector('svg[data-mw-chart="area"]')).not.toBeNull();
    const gauge = container.querySelector('svg[data-mw-chart="radial-gauge"]');
    expect(gauge?.getAttribute("aria-hidden")).toBe("true");
    const captions = Array.from(container.querySelectorAll("table caption"));
    expect(captions.at(-1)?.textContent).toBe("CPU 74% data");
  });

  it("exposes accessible chart data and hides decorative SVGs", () => {
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
        <BarChart data={[]} ariaLabel="Empty chart" />
      </ChartContainer>,
    );

    const tables = Array.from(
      container.querySelectorAll<HTMLTableElement>("table[data-mw-chart-data-alternative='true']"),
    );
    expect(tables).toHaveLength(5);
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
    const hiddenSvgs = container.querySelectorAll("svg[aria-hidden='true']");
    expect(hiddenSvgs).toHaveLength(4);
    const emptyState = container.querySelector('[role="status"][data-mw-chart-empty="true"]');
    expect(emptyState?.textContent).toBe("No data available");
    expect(tables[4]?.caption?.textContent).toBe("Empty chart data");
    expect(tables[4]?.textContent).toContain("No data available");
  });

  it("supports SVG-only mode when accessible data is disabled", () => {
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
    const alternativeTable = container.querySelector(
      "table[data-mw-chart-data-alternative='true']",
    );
    expect(alternativeTable).toBeNull();
  });

  it("renders accessible empty states for empty or non-plottable data and renders custom text safely", () => {
    const unsafeMessage = '<img src="x" onerror="alert(1)" /> No telemetry yet';
    renderNode(
      <ChartContainer title="Empty Suite">
        <BarChart data={[]} ariaLabel="Empty bar" emptyMessage={unsafeMessage} />
        <Sparkline
          data={[Number.NaN]}
          ariaLabel="Non-finite sparkline"
          accessibleData={false}
          emptyMessage="Awaiting signal"
        />
        <LineChart data={[]} ariaLabel="Empty line" />
        <AreaChart data={[]} ariaLabel="Empty area" />
      </ChartContainer>,
    );

    const emptyStates = Array.from(
      container.querySelectorAll('[role="status"][data-mw-chart-empty="true"]'),
    );
    expect(emptyStates).toHaveLength(4);
    expect(container.querySelectorAll("svg")).toHaveLength(0);
    expect(container.querySelector("img")).toBeNull();
    expect(emptyStates[0]?.textContent).toBe(unsafeMessage);
    expect(emptyStates[1]?.textContent).toBe("Awaiting signal");
    expect(emptyStates[2]?.textContent).toBe("No data available");
    expect(emptyStates[3]?.textContent).toBe("No data available");
  });

  it("plots all-zero measurements as data rather than empty state", () => {
    const zeroSeries = [
      { label: "Z1", value: 0 },
      { label: "Z2", value: 0 },
    ] as const;

    renderNode(
      <ChartContainer title="All-Zero Series">
        <BarChart data={zeroSeries} ariaLabel="Zero bar" />
        <Sparkline data={[0, 0, 0]} ariaLabel="Zero sparkline" />
        <LineChart data={zeroSeries} ariaLabel="Zero line" />
        <AreaChart data={zeroSeries} ariaLabel="Zero area" />
      </ChartContainer>,
    );

    expect(container.querySelectorAll('[data-mw-chart-empty="true"]')).toHaveLength(0);
    expect(container.querySelector('svg[data-mw-chart="bar"] rect')).not.toBeNull();
    expect(container.querySelector('svg[data-mw-chart="sparkline"] polyline')).not.toBeNull();
    expect(container.querySelector('svg[data-mw-chart="line"] polyline')).not.toBeNull();
    expect(container.querySelector('svg[data-mw-chart="area"] polygon')).not.toBeNull();
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
