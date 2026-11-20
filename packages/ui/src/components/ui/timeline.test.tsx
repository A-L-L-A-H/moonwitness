// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Timeline, type TimelineItem } from "../../index";

let container: HTMLDivElement;
let root: Root;

function renderTimeline(
  items: readonly TimelineItem[],
  density: "compact" | "comfortable" = "comfortable",
) {
  act(() => {
    root.render(
      <Timeline
        ariaLabel="Deployment activity"
        data-testid="timeline"
        density={density}
        items={items}
      />,
    );
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

describe("Timeline", () => {
  it("renders a stable accessible empty state", () => {
    renderTimeline([]);

    expect(container.querySelector('[role="status"]')?.textContent).toBe("No events to display.");
    expect(container.querySelector("ol")).toBeNull();
  });

  it("renders a single item with optional metadata and compact density", () => {
    renderTimeline(
      [
        {
          id: "event-1",
          title: "Build completed",
          timestamp: "2026-11-20 09:15 UTC",
          description: "The production bundle is ready.",
          status: "verified",
        },
      ],
      "compact",
    );

    const timeline = container.querySelector('[data-testid="timeline"]');
    expect(timeline?.getAttribute("data-density")).toBe("compact");
    expect(container.querySelector("ol")?.getAttribute("aria-label")).toBe("Deployment activity");
    expect(container.querySelectorAll("li")).toHaveLength(1);
    expect(container.textContent).toContain("Build completed");
    expect(container.textContent).toContain("2026-11-20 09:15 UTC");
    expect(container.textContent).toContain("verified");
    expect(container.textContent).toContain("The production bundle is ready.");
  });

  it("preserves caller order and keeps unknown statuses neutral", () => {
    renderTimeline([
      { id: "later", title: "Later event", label: "Step 2", status: "awaiting-owner" },
      { id: "earlier", title: "Earlier event", label: "Step 1" },
      { id: "unknown", title: "Unclassified event", status: "unmapped-state" },
    ]);

    const titles = Array.from(container.querySelectorAll("li > div > div > span:first-child"));
    expect(titles.map((title) => title.textContent)).toEqual([
      "Later event",
      "Earlier event",
      "Unclassified event",
    ]);
    const statuses = Array.from(container.querySelectorAll("[data-status]"));
    expect(statuses.map((status) => status.textContent)).toEqual([
      "awaiting-owner",
      "unmapped-state",
    ]);
    expect(statuses.every((status) => !status.className.includes("success"))).toBe(true);
    expect(container.querySelectorAll("li")).toHaveLength(3);
  });
});
