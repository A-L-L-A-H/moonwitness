// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ConsoleShell, type ConsoleShellProps } from "./console-shell";
import { SkinProvider, useSkin, type SkinName } from "../skin";

let container: HTMLDivElement;
let root: Root;
let style: HTMLStyleElement;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  style = document.createElement("style");
  const css = readFileSync(resolve(import.meta.dirname, "../base.css"), "utf8");
  // Isolate the actual HUD rules: jsdom does not support the surrounding Tailwind layer.
  style.textContent = css.slice(
    css.indexOf("/* ---- HUD console"),
    css.indexOf("/* ---- riot grunge"),
  );
  document.head.append(style);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  style.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
});

function shell(overrides: Partial<ConsoleShellProps> = {}) {
  return (
    <ConsoleShell
      title="Shadow Command Center"
      items={[
        { id: "dashboard", label: "Dashboard", iconPath: "M4 4 L20 4", href: "/mission-control" },
      ]}
      active="dashboard"
      {...overrides}
    >
      <h1>Mission control</h1>
    </ConsoleShell>
  );
}
function render(node: ReactNode) {
  act(() => root.render(node));
}

const SKINS: SkinName[] = ["default", "riot", "editorial", "technical", "archive", "transmission"];
function SwitchSkin() {
  const { setSkin } = useSkin();
  return (
    <>
      {SKINS.map((skin) => (
        <button key={skin} onClick={() => setSkin(skin)}>
          {skin}
        </button>
      ))}
    </>
  );
}

describe("ConsoleShell", () => {
  it("renders one navigation tree and leaves the page heading to main", () => {
    render(shell());
    for (const landmark of ["header", "nav", "main#main", "footer"]) {
      expect(container.querySelectorAll(landmark)).toHaveLength(1);
    }
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("main h1")?.textContent).toBe("Mission control");
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it("places the bottom-nav reservation around main AND footer, including safe-area space", () => {
    render(shell({ commandLeft: "Footer remains reachable" }));
    const shellRoot = container.firstElementChild;
    expect(shellRoot?.classList.contains("console-shell")).toBe(true);
    if (!shellRoot) throw new Error("Missing shell");
    const computed = getComputedStyle(shellRoot);
    expect(computed.paddingBottom).toBe("var(--hud-bottom-space)");
    expect(computed.getPropertyValue("--hud-bottom-space")).toContain("env(safe-area-inset-bottom");
    expect(shellRoot.querySelector("footer")?.textContent).toContain("Footer remains reachable");
    expect(getComputedStyle(container.querySelector("main") as HTMLElement).paddingBottom).not.toBe(
      "var(--hud-bottom-space)",
    );
  });

  it("maps the slots and calls the optional navigation callback through an injected native link", () => {
    const navigate = vi.fn();
    render(
      shell({
        headerSearch: <input aria-label="Search" />,
        headerActions: <button>Actions</button>,
        railFooter: <span>Rail footer</span>,
        commandLeft: <span>Left</span>,
        commandRight: <span>Right</span>,
        onNavigate: navigate,
        linkAs: (props) => <a {...props} data-injected="true" />,
      }),
    );
    expect(container.querySelector("header input")?.getAttribute("aria-label")).toBe("Search");
    expect(container.querySelector("header button")?.textContent).toBe("Actions");
    expect(container.querySelector("nav")?.textContent).toContain("Rail footer");
    expect(container.querySelector("footer")?.textContent).toBe("LeftRight");
    const link = container.querySelector<HTMLAnchorElement>("nav a");
    expect(link?.dataset.injected).toBe("true");
    link?.addEventListener("click", (event) => event.preventDefault());
    act(() => link?.click());
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("updates every actual HUD surface and its rendered style when the provider skin switches", () => {
    render(
      <SkinProvider>
        <SwitchSkin />
        {shell()}
      </SkinProvider>,
    );
    const signatures = new Set<string>();
    for (const skin of SKINS) {
      const button = Array.from(container.querySelectorAll("button")).find(
        (item) => item.textContent === skin,
      );
      act(() => button?.click());
      const surfaces = container.querySelectorAll(".hud-panel");
      expect(surfaces).toHaveLength(3);
      for (const surface of surfaces) {
        expect(surface.classList.contains(`skin-${skin}`)).toBe(true);
        expect(surface.classList.contains("hud-layer")).toBe(true);
        expect(surface.className).not.toMatch(
          /halftone|grain|scanlines|cmyk-slip|duotone|brush-underline|sticker/,
        );
      }
      const header = container.querySelector("header");
      if (!header) throw new Error("Missing header");
      const computed = getComputedStyle(header);
      signatures.add(
        [
          computed.borderTopStyle,
          computed.borderTopWidth,
          computed.boxShadow,
          computed.getPropertyValue("--hud-accent"),
        ].join("|"),
      );
      expect(localStorage.getItem("mw-skin")).toBe(skin);
    }
    expect(signatures.size).toBe(6);
  });
});
