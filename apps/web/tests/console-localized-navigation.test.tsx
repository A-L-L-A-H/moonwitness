// @vitest-environment jsdom
import React, { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SkinProvider } from "@moonwitness/ui";
import { ConsoleCommandPalette } from "@/components/console-command-palette";
import { ShortcutsDropdown } from "@/components/layout/shared/ShortcutsDropdown";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import type { Locale } from "@/configs/i18n";
import { buildEnterpriseNavItems } from "@/data/navigation/verticalMenuData";
import { TranslationWrapper } from "@/hocs/TranslationWrapper";
import { notifySessionChange } from "@/lib/session";
import { getDictionarySync } from "@/utils/getDictionary";

const routing = vi.hoisted(() => ({
  pathname: "/en/dashboards/analytics",
  push: vi.fn(),
}));

const authState = vi.hoisted(() => ({
  role: "admin" as "admin" | "editor" | "viewer",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => routing.pathname,
  useRouter: () => ({ push: routing.push }),
}));

vi.mock("next/link", () => ({
  default: (props: ComponentProps<"a">) => createElement("a", props),
}));

let container: HTMLDivElement;
let root: Root;
const fetchMock = vi.fn<typeof fetch>();

function setInputValue(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("React", React);
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  Element.prototype.scrollIntoView = vi.fn();

  authState.role = "admin";
  notifySessionChange();
  routing.pathname = "/en/dashboards/analytics";
  routing.push.mockReset();
  localStorage.clear();
  document.cookie = "mw-locale=; path=/; max-age=0; SameSite=Lax";

  fetchMock.mockReset().mockImplementation(async (url) => {
    const target = String(url);
    if (target === "/api/v1/auth/me") {
      return Response.json({
        user: {
          id: 7,
          displayName: "Operator",
          username: "operator",
          role: authState.role,
        },
      });
    }
    if (target === "/api/v1/_meta/models") {
      return Response.json({ models: ["timeline.event", "witness.claim", "crm.lead"] });
    }
    if (target === "/api/v1/_meta/navigation") {
      return Response.json({ menus: [] });
    }
    if (target === "/api/v1/m/res.company") {
      return Response.json({ data: [] });
    }
    if (target === "/api/v1/celestial/now") {
      return Response.json({});
    }
    return Response.json({});
  });

  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
});

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function renderWithLocale(locale: Locale, ui: React.ReactNode) {
  await act(async () => {
    root.render(
      <SkinProvider>
        <TranslationWrapper lang={locale}>{ui}</TranslationWrapper>
      </SkinProvider>,
    );
  });
  await flushEffects();
}

describe("Console localized navigation, command palette & shortcuts (#485)", () => {
  it.each(["en", "id", "ar"] as const)(
    "renders ConsoleCommandPalette in %s on prefixed routes without hardcoded /en/ links and preserves ?model=",
    async (locale) => {
      const dict = getDictionarySync(locale);
      routing.pathname = `/${locale}/dashboards/analytics`;

      await renderWithLocale(locale, <ConsoleCommandPalette plane="creator" open={true} />);

      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.textContent).toContain(dict.operations.commandPalette.title);
      expect(dialog?.textContent).toContain(dict.operations.commandPalette.modulesGroup);
      expect(dialog?.textContent).toContain(dict.operations.commandPalette.modelsGroup);
      expect(dialog?.textContent).toContain(dict.operations.commandPalette.skinsGroup);
      expect(dialog?.textContent).toContain(dict.operations.commandPalette.worldsGroup);
      expect(dialog?.textContent).toContain(dict.operations.commandPalette.shortcutHint);

      const input = document.querySelector<HTMLInputElement>(
        `input[placeholder="${dict.operations.commandPalette.placeholder}"]`,
      );
      expect(input).not.toBeNull();

      // Ensure no hardcoded /en/ prefix leaks into non-English prefixed routes
      if (locale !== "en") {
        expect(dialog?.textContent).not.toContain("/en/");
      }

      expect(dialog?.textContent).toContain(`/${locale}/dashboards/analytics`);
      expect(dialog?.textContent).toContain(`/${locale}/apps/addons?model=timeline.event`);

      const modelOption = Array.from(document.querySelectorAll('[role="option"]')).find((el) =>
        el.textContent?.includes("timeline.event"),
      ) as HTMLElement | undefined;
      expect(modelOption).toBeDefined();
      expect(modelOption?.querySelector('[dir="ltr"]')).not.toBeNull();

      await act(async () => {
        modelOption?.click();
      });
      expect(routing.push).toHaveBeenCalledWith(`/${locale}/apps/addons?model=timeline.event`);
    },
  );

  it("shows localized empty state in CommandPalette when query matches nothing", async () => {
    const arDict = getDictionarySync("ar");
    routing.pathname = "/ar/apps/addons";

    await renderWithLocale("ar", <ConsoleCommandPalette plane="creator" open={true} />);

    const input = document.querySelector<HTMLInputElement>(
      `input[placeholder="${arDict.operations.commandPalette.placeholder}"]`,
    );
    expect(input).not.toBeNull();

    await act(async () => {
      if (input) setInputValue(input, "zzzz-no-match-999");
    });

    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      arDict.operations.commandPalette.empty,
    );
  });

  it("translates unprefixed routes into active locale (ID & AR) while keeping unprefixed hrefs", async () => {
    const idDict = getDictionarySync("id");
    routing.pathname = "/mission-control";

    await renderWithLocale(
      "id",
      <ConsoleShellAdapter
        breadcrumb={idDict.navigation.missionControl}
        plane="creator"
        search={{ value: "", onChange: () => {}, placeholder: idDict.shell.searchPlaceholder }}
      >
        <div id="cc-workspace">Workspace</div>
      </ConsoleShellAdapter>,
    );

    expect(container.querySelector(`nav[aria-label="${idDict.shell.theEmpire}"]`)).not.toBeNull();
    expect(
      container.querySelector('nav a[href="/mission-control?module=story-forge"]')?.textContent,
    ).toBe(idDict.navigation.storyStudio);
    expect(container.querySelector('nav a[href="/dock"]')?.textContent).toBe(
      idDict.navigation.archive,
    );
    expect(container.querySelector('.hud-rail-footer a[href="/"]')?.textContent).toContain(
      idDict.navigation.imperiumGate.toUpperCase(),
    );

    // Unprefixed command palette keeps unprefixed hrefs with Arabic labels
    const arDict = getDictionarySync("ar");
    await renderWithLocale("ar", <ConsoleCommandPalette plane="creator" open={true} />);

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain(arDict.operations.commandPalette.title);
    expect(dialog?.textContent).toContain(arDict.navigation.analytics);
    expect(dialog?.textContent).toContain("/addons?model=timeline.event");
    expect(dialog?.textContent).not.toContain("/en/");
    expect(dialog?.textContent).not.toContain("/ar/apps/");
  });

  it("separates ShortcutsDropdown URL prefix from display locale across prefixed and unprefixed routes", async () => {
    const arDict = getDictionarySync("ar");
    routing.pathname = "/mission-control";

    await renderWithLocale("ar", <ShortcutsDropdown />);

    const trigger = container.querySelector<HTMLButtonElement>(
      `button[aria-label="${arDict.shell.shortcuts}"]`,
    );
    expect(trigger).not.toBeNull();
    await act(async () => {
      trigger?.click();
    });

    const popover = document.querySelector(
      `[aria-label="${arDict.shell.shortcuts}"][role="dialog"]`,
    );
    expect(popover).not.toBeNull();
    expect(popover?.textContent).toContain(arDict.navigation.analytics);
    expect(popover?.querySelector('a[href="/mission-control"]')).not.toBeNull();
    expect(popover?.querySelector('a[href="/addons?model=crm.lead"]')).not.toBeNull();
    expect(popover?.querySelector('a[href="/addons"]')).not.toBeNull();

    // Now on a prefixed /id/ route
    const idDict = getDictionarySync("id");
    routing.pathname = "/id/dashboards/analytics";
    await renderWithLocale("id", <ShortcutsDropdown />);

    const idTrigger = container.querySelector<HTMLButtonElement>(
      `button[aria-label="${idDict.shell.shortcuts}"]`,
    );
    await act(async () => {
      idTrigger?.click();
    });

    const idPopover = document.querySelector(
      `[aria-label="${idDict.shell.shortcuts}"][role="dialog"]`,
    );
    expect(idPopover?.querySelector('a[href="/id/dashboards/crm"]')).not.toBeNull();
    expect(idPopover?.querySelector('a[href="/id/apps/addons"]')).not.toBeNull();
  });

  it("preserves Creator vs Operations plane separation and RBAC minRole filtering across locales", async () => {
    const arDict = getDictionarySync("ar");
    const viewerNav = buildEnterpriseNavItems("creator", arDict, "ar", "viewer");
    const adminNav = buildEnterpriseNavItems("creator", arDict, "ar", "admin");
    const opsNav = buildEnterpriseNavItems("operations", arDict, "ar", "viewer");

    expect(viewerNav.some((item) => item.id === "permissions")).toBe(false);
    expect(viewerNav.some((item) => item.id === "roles")).toBe(false);
    expect(viewerNav.some((item) => item.id === "users")).toBe(false);
    expect(adminNav.some((item) => item.id === "permissions")).toBe(true);
    expect(opsNav.map((item) => item.target.href)).toContain("/ar/apps/control?tab=vpn");
    expect(opsNav.some((item) => item.id === "crm")).toBe(false);

    // CommandPalette on operations plane isolates operations routes
    routing.pathname = "/id/apps/control";
    await renderWithLocale("id", <ConsoleCommandPalette plane="operations" open={true} />);
    const opsDialog = document.querySelector('[role="dialog"]');
    expect(opsDialog?.textContent).toContain("/id/apps/control?tab=radius");
    expect(opsDialog?.textContent).not.toContain("/id/dashboards/crm");

    // CommandPalette on creator plane with viewer role hides admin RBAC models
    authState.role = "viewer";
    notifySessionChange();
    await flushEffects();
    routing.pathname = "/id/dashboards/analytics";
    await renderWithLocale("id", <ConsoleCommandPalette plane="creator" open={true} />);
    const creatorDialog = document.querySelector('[role="dialog"]');
    expect(creatorDialog?.textContent).not.toContain("/id/apps/permissions");
    expect(creatorDialog?.textContent).not.toContain("/id/apps/control?tab=radius");
  });
});
