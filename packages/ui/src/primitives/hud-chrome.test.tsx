// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  CommandStrip,
  CornerBrackets,
  Gauge,
  SideRail,
  TopRail,
  type HudLinkComponent,
  type HudNavItem,
} from "./hud-chrome";

const ITEMS: HudNavItem[] = [
  { id: "dashboard", label: "Dashboard", iconPath: "M4 4 L20 4", href: "/mission-control" },
  { id: "archive", label: "Archive", iconPath: "M4 6 L20 6", href: "/dock" },
  {
    id: "episodes",
    label: "Episodes",
    iconPath: "M4 8 L20 8",
    href: "/mission-control#cc-workspace",
    kind: "section",
  },
];

let container: HTMLDivElement;
let root: Root;
function render(node: ReactNode) {
  act(() => root.render(node));
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("hud-chrome primitives", () => {
  it("distinguishes the current route from the visible section", () => {
    render(<SideRail items={ITEMS} active="dashboard" activeSection="episodes" />);
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(container.querySelector('[aria-current="page"]')?.getAttribute("href")).toBe(
      "/mission-control",
    );
    expect(container.querySelector('[aria-current="location"]')?.getAttribute("href")).toBe(
      "/mission-control#cc-workspace",
    );
    expect(container.querySelector('a[href="/dock"]')?.hasAttribute("aria-current")).toBe(false);
  });

  it("does not mark a section as the current page when its id matches the route fallback", () => {
    render(<SideRail items={ITEMS} active="episodes" activeSection="episodes" />);
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
    expect(container.querySelectorAll('[aria-current="location"]')).toHaveLength(1);
  });

  it("shows labels and hides decorative SVGs from assistive technology", () => {
    render(<SideRail items={ITEMS} navLabel="Empire nav" />);
    expect(container.querySelector("nav")?.getAttribute("aria-label")).toBe("Empire nav");
    for (const link of container.querySelectorAll("a")) {
      expect(link.querySelector("span")?.classList.contains("sr-only")).toBe(false);
      expect(link.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
      expect(link.textContent).not.toBe("");
    }
  });

  it("moves focus with arrows without intercepting native Tab or Enter", () => {
    const navigated = vi.fn();
    const Link: HudLinkComponent = (props) => <a {...props} data-injected="true" />;
    render(<SideRail items={ITEMS} linkAs={Link} onNavigate={navigated} />);
    const links = Array.from(container.querySelectorAll("a"));
    expect(links.every((link) => link.tabIndex === 0 && link.dataset.injected === "true")).toBe(
      true,
    );
    const first = links[0];
    const last = links[2];
    if (!first || !last) throw new Error("Missing rail links");
    first.focus();
    for (const [key, expected] of [
      ["ArrowDown", links[1]],
      ["ArrowRight", last],
      ["ArrowRight", first],
      ["ArrowUp", last],
      ["ArrowLeft", links[1]],
      ["Home", first],
      ["End", last],
    ] as const) {
      act(() =>
        document.activeElement?.dispatchEvent(
          new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
        ),
      );
      expect(document.activeElement).toBe(expected);
    }
    for (const key of ["Tab", "Enter"]) {
      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      last.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    // jsdom does not synthesize a link click from Enter; exercise its native click path.
    last.addEventListener("click", (event) => event.preventDefault());
    act(() => last.click());
    expect(navigated).toHaveBeenCalledTimes(1);
  });

  it("keeps search separate from actions and a readable breadcrumb without adding an h1", () => {
    render(
      <TopRail
        title="Shadow Command Center"
        start={<a href="/">The Empire</a>}
        search={<input aria-label="Search projects" />}
        actions={<button>Notifications</button>}
      />,
    );
    expect(container.querySelector("h1")).toBeNull();
    const title = container.querySelector(".hud-breadcrumb");
    expect(title?.textContent).toContain("Shadow Command Center");
    expect(title?.closest('[aria-hidden="true"]')).toBeNull();
    expect(container.querySelector(".hud-top-search input")).not.toBeNull();
    expect(container.querySelector(".hud-top-actions input")).toBeNull();
    expect(container.querySelector(".hud-top-actions button")?.textContent).toBe("Notifications");
  });

  it("renders all four decorative corner brackets without wrapping the content in them", () => {
    render(
      <CornerBrackets>
        <button>Content</button>
      </CornerBrackets>,
    );
    expect(container.querySelector(".hud-bracket > button")?.textContent).toBe("Content");
    const corners = container.querySelectorAll('.hud-bracket > [aria-hidden="true"]');
    expect(corners).toHaveLength(4);
    for (const corner of corners) expect(corner.childElementCount).toBe(0);
  });

  it("renders the footer slots and clamps gauge fill without changing the supplied value", () => {
    render(
      <>
        <CommandStrip left={<span>Left</span>} right={<span>Right</span>} />
        <Gauge label="SIGNAL" value="87" tone="blue" percent={120} />
      </>,
    );
    expect(container.querySelector("footer")?.textContent).toBe("LeftRight");
    expect(container.textContent).toContain("SIGNAL87");
    expect(container.querySelector<HTMLElement>('[role="presentation"] > div')?.style.width).toBe(
      "100%",
    );
    render(<Gauge label="SIGNAL" value="unknown" />);
    expect(container.querySelector('[role="presentation"]')).toBeNull();
  });
});
