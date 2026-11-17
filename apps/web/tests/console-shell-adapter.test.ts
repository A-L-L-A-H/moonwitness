// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SkinProvider } from "@moonwitness/ui";
import { avatarDataUri } from "@moonwitness/avatars";
import { ConsoleShellAdapter } from "../src/components/shell/console-shell-adapter";
import { applyToStore, DEFAULT_AVATAR_OPTIONS } from "../src/lib/avatar-store";

const routing = vi.hoisted(() => ({ pathname: "/mission-control", push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => routing.pathname,
  useRouter: () => ({ push: routing.push }),
}));
vi.mock("next/link", () => ({
  default: (props: ComponentProps<"a">) => createElement("a", props),
}));

let container: HTMLDivElement;
let root: Root;
let observerCallback: IntersectionObserverCallback;
let observer: IntersectionObserver;
const fetchRequest = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  // Next supplies the JSX runtime in production; the standalone runner uses classic JSX.
  vi.stubGlobal("React", React);
  vi.stubGlobal("fetch", fetchRequest);
  fetchRequest.mockReset().mockImplementation(async (url) => {
    if (url === "/api/v1/auth/me") {
      return Response.json({
        user: { id: 42, displayName: "Pilot Crew", username: "pilot", role: "creator" },
      });
    }
    if (url === "/api/v1/auth/logout") return new Response(null, { status: 204 });
    throw new Error(`Unexpected request: ${String(url)}`);
  });
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
        observer = this as unknown as IntersectionObserver;
      }
      observe() {}
      disconnect() {}
    },
  );
  routing.pathname = "/mission-control";
  routing.push.mockClear();
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
});

async function render(overrides: Partial<ComponentProps<typeof ConsoleShellAdapter>> = {}) {
  await act(async () =>
    root.render(
      createElement(
        SkinProvider,
        null,
        createElement(ConsoleShellAdapter, {
          breadcrumb: "Shadow Command Center",
          search: { value: "story", onChange: () => {}, placeholder: "Search projects" },
          children: createElement(
            "section",
            { id: "cc-workspace" },
            createElement("h1", null, "Mission control"),
          ),
          ...overrides,
        }),
      ),
    ),
  );
}
function button(label: string) {
  const element = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  if (!element) throw new Error(`Missing ${label} button`);
  return element;
}
async function click(element: HTMLElement) {
  await act(async () => element.click());
}
async function openProfile() {
  await act(async () =>
    button("Profile menu").dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    ),
  );
}

describe("ConsoleShellAdapter", () => {
  it("keeps Control on the operations plane with its own routes and branding", async () => {
    routing.pathname = "/control";
    await render({ plane: "operations" });
    const navigation = container.querySelector('nav[aria-label="Operations"]');
    expect(navigation).not.toBeNull();
    expect(navigation?.querySelector('a[href="/radius"]')).not.toBeNull();
    expect(navigation?.querySelector('a[href="/dock"]')).toBeNull();
    expect(navigation?.querySelector('[aria-current="page"]')?.getAttribute("href")).toBe(
      "/control",
    );
    expect(container.querySelector("footer")?.textContent).toContain("ARSY CONTROL PLANE");
  });
  it("restores the real SkinSwitcher and changes all HUD surfaces through the provider", async () => {
    await render();
    expect(document.querySelector('button[aria-label="Change skin"]')).not.toBeNull();
    await click(button("Change skin"));
    const technical = Array.from(document.querySelectorAll("button")).find((item) =>
      item.textContent?.includes("Technical"),
    );
    if (!technical) throw new Error("Missing Technical preset");
    await click(technical);
    expect(button("Change skin").getAttribute("aria-expanded")).toBe("false");
    expect(localStorage.getItem("mw-skin")).toBe("technical");
    for (const surface of container.querySelectorAll(".hud-panel")) {
      expect(surface.classList.contains("skin-technical")).toBe(true);
    }
  });

  it("keeps controlled search in its own slot without introducing another page heading", async () => {
    const onChange = vi.fn();
    await render({ search: { value: "story", onChange, placeholder: "Search projects" } });
    const search = container.querySelector<HTMLInputElement>(
      '.hud-top-search input[aria-label="Search projects"]',
    );
    expect(search?.value).toBe("story");
    if (!search) throw new Error("Missing search slot");
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
        search,
        "new story",
      );
      search.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith("new story");
    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });

  it("passes existing navigation destinations and section kinds without duplicate page-current links", async () => {
    await render();
    const section = container.querySelector<HTMLElement>("#cc-workspace");
    if (!section) throw new Error("Missing workspace section");
    act(() =>
      observerCallback(
        [
          {
            target: section,
            isIntersecting: true,
            intersectionRatio: 1,
            time: 0,
            boundingClientRect: section.getBoundingClientRect(),
            intersectionRect: section.getBoundingClientRect(),
            rootBounds: null,
          },
        ],
        observer,
      ),
    );
    expect(container.querySelectorAll('nav [aria-current="page"]')).toHaveLength(0);
    expect(container.querySelectorAll('nav [aria-current="location"]')).toHaveLength(1);
    expect(container.querySelector('nav [aria-current="location"]')?.getAttribute("href")).toBe(
      "/mission-control#cc-workspace",
    );
    expect(
      container.querySelector('nav a[href="/mission-control?module=story-forge"]')?.textContent,
    ).toBe("Story Studio");
    expect(container.querySelector('nav a[href="/dock"]')?.textContent).toBe("Archive");
  });

  it("closes notifications on rail navigation, including keyboard-generated clicks, and calls onNavigate", async () => {
    const onNavigate = vi.fn();
    await render({ onNavigate });
    await click(button("Notifications"));
    expect(document.querySelector('[role="dialog"][aria-label="Notifications"]')).not.toBeNull();
    const link = container.querySelector<HTMLAnchorElement>('nav a[href="/dock"]');
    if (!link) throw new Error("Missing Archive link");
    link.addEventListener("click", (event) => event.preventDefault());
    await click(link);
    expect(button("Notifications").getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector('[role="dialog"][aria-label="Notifications"]')).toBeNull();
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("preserves identity, saved avatar, popover exclusivity, and existing logout request", async () => {
    applyToStore({}, "Pilot Crew", "saved-pilot-face", DEFAULT_AVATAR_OPTIONS);
    await render();
    expect(fetchRequest).toHaveBeenCalledWith("/api/v1/auth/me", { credentials: "include" });
    expect(button("Profile menu").textContent).toContain("Pilot Crew");
    expect(button("Profile menu").textContent).toContain("creator");
    expect(button("Profile menu").querySelector("img")?.getAttribute("src")).toBe(
      avatarDataUri("saved-pilot-face", { radius: 50 }),
    );
    await click(button("Notifications"));
    await openProfile();
    expect(button("Notifications").getAttribute("aria-expanded")).toBe("false");
    const exit = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(
      (item) => item.textContent?.includes("Exit the shadow"),
    );
    if (!exit) throw new Error("Missing logout menu item");
    await click(exit);
    expect(fetchRequest).toHaveBeenCalledWith("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    expect(routing.push).toHaveBeenCalledWith("/");
  });

  it("keeps fallback identity and outside-click dismissal when no session is available", async () => {
    fetchRequest.mockResolvedValue(new Response(null, { status: 401 }));
    await render();
    expect(button("Profile menu").textContent).toContain("Creator // Empire");
    expect(button("Profile menu").textContent).toContain("Empire crew");
    await click(button("Notifications"));
    act(() => document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
    expect(button("Notifications").getAttribute("aria-expanded")).toBe("false");
  });
});
