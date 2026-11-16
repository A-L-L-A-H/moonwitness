import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CommandStrip,
  CornerBrackets,
  Gauge,
  SideRail,
  TopRail,
  type HudNavItem,
} from "./hud-chrome";

const ITEMS: HudNavItem[] = [
  { id: "dashboard", label: "Dashboard", iconPath: "M4 4 L20 4", href: "/mission-control" },
  { id: "archive", label: "Archive", iconPath: "M4 6 L20 6", href: "/dock" },
];

describe("hud-chrome primitives", () => {
  it("SideRail marks only the active item with aria-current", () => {
    const html = renderToStaticMarkup(
      <SideRail items={ITEMS} active="archive" navLabel="Empire" />,
    );
    expect(html).toContain("hud-panel");
    const anchors = html.match(/<a [^>]*>/g) ?? [];
    expect(anchors).toHaveLength(2);
    const activeAnchor = anchors.find((a) => a.includes('aria-current="page"'));
    const inactiveAnchor = anchors.find((a) => !a.includes('aria-current="page"'));
    expect(activeAnchor).toContain('href="/dock"');
    expect(inactiveAnchor).toContain('href="/mission-control"');
  });

  it("SideRail renders icons and labels accessibly", () => {
    const html = renderToStaticMarkup(<SideRail items={ITEMS} active="" navLabel="Empire nav" />);
    expect(html).toContain("<nav");
    expect(html).toContain("M4 4 L20 4");
    expect(html).toContain("Dashboard");
    expect(html).toContain('aria-label="Empire nav"');
  });

  it("TopRail renders landmark header with title and action slots", () => {
    const html = renderToStaticMarkup(
      <TopRail title="Shadow Command Center" actions={<span data-slot="act">bell</span>} />,
    );
    expect(html).toContain("<header");
    expect(html).toContain("Shadow Command Center");
    expect(html).toContain('data-slot="act"');
  });

  it("CommandStrip renders footer with left/right slots", () => {
    const html = renderToStaticMarkup(
      <CommandStrip left={<span>L</span>} right={<span>R</span>} />,
    );
    expect(html).toContain("<footer");
    expect(html).toContain("L");
    expect(html).toContain("R");
  });

  it("CornerBrackets wraps children with hud-bracket class", () => {
    const html = renderToStaticMarkup(
      <CornerBrackets>
        <div>inner</div>
      </CornerBrackets>,
    );
    expect(html).toContain("hud-bracket");
    expect(html).toContain("inner");
  });

  it("Gauge renders label, value and tone class", () => {
    const html = renderToStaticMarkup(<Gauge label="SIGNAL" value="87" tone="blue" percent={87} />);
    expect(html).toContain("SIGNAL");
    expect(html).toContain("87");
    expect(html).toContain("text-[var(--blue)]");
  });
});
