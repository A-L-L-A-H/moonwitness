// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DiffViewer, type DiffHunk } from "../../index";

let container: HTMLDivElement;
let root: Root;

function renderDiff(hunks: readonly DiffHunk[]) {
  act(() => {
    root.render(<DiffViewer fileName="src/example.ts" hunks={hunks} data-testid="diff-viewer" />);
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

describe("DiffViewer", () => {
  it("renders an accessible empty state for empty hunks", () => {
    renderDiff([]);

    expect(container.querySelector('[role="region"]')?.getAttribute("aria-label")).toBe(
      "src/example.ts diff",
    );
    expect(container.querySelector('[role="status"]')?.textContent).toBe("No changes to display.");
    expect(container.querySelectorAll("li")).toHaveLength(0);
  });

  it("labels added, removed and unchanged lines without relying on color", () => {
    renderDiff([
      {
        id: "hunk-1",
        header: "@@ -1,2 +1,3 @@",
        lines: [
          {
            id: "line-1",
            kind: "context",
            content: 'const name = "MoonWitness";',
            oldLineNumber: 1,
            newLineNumber: 1,
          },
          {
            id: "line-2",
            kind: "removed",
            content: "const retries = 2;",
            oldLineNumber: 2,
          },
          {
            id: "line-3",
            kind: "added",
            content: "const retries = 3;",
            newLineNumber: 2,
          },
        ],
      },
    ]);

    expect(container.textContent).toContain("src/example.ts");
    expect(container.textContent).toContain("@@ -1,2 +1,3 @@");
    expect(container.querySelectorAll('[data-change-kind="context"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-change-kind="removed"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-change-kind="added"]')).toHaveLength(1);
    expect(container.textContent).toContain("Unchanged");
    expect(container.textContent).toContain("Removed");
    expect(container.textContent).toContain("Added");
    expect(container.querySelector('[aria-label*="Added, new line 2"]')).not.toBeNull();
    expect(container.querySelector('[aria-label*="Removed, old line 2"]')).not.toBeNull();
  });

  it("keeps long lines in a horizontally scrollable read-only view", () => {
    const longLine = `const payload = "${"x".repeat(260)}";`;
    renderDiff([
      {
        id: "hunk-long",
        lines: [
          {
            id: "long-line",
            kind: "added",
            content: longLine,
            newLineNumber: 18,
          },
        ],
      },
    ]);

    expect(container.querySelector(".overflow-x-auto")).not.toBeNull();
    expect(container.querySelector("pre.whitespace-pre")).not.toBeNull();
    expect(container.textContent).toContain(longLine);
  });
});
