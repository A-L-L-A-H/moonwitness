// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveCanonicalTokens } from "../dna/canonical";
import { getDnaWorld, SkinScope, type MasterDnaId } from "./dna-worlds";

const CASES: Array<{ dnaId: MasterDnaId; mode: "light" | "dark" }> = [
  { dnaId: "01-imperium-lumen", mode: "light" },
  { dnaId: "01-imperium-lumen", mode: "dark" },
  { dnaId: "03-rocksoul", mode: "light" },
  { dnaId: "03-rocksoul", mode: "dark" },
];

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

describe("SkinScope canonical semantic variable precedence", () => {
  it.each(CASES)("keeps canonical semantic variables for $dnaId in $mode mode", ({ dnaId, mode }) => {
    const world = getDnaWorld(dnaId);
    const resolved = resolveCanonicalTokens({
      dnaId,
      skin: world.mappedSkinPreset,
      mode,
      density: "comfortable",
    });

    renderNode(
      <SkinScope dnaId={dnaId} mode={mode}>
        <div>Scoped content</div>
      </SkinScope>,
    );

    const scope = container.firstElementChild as HTMLElement;
    expect(scope.style.getPropertyValue("--dna-canvas")).toBe(resolved.semantic.canvas);
    expect(scope.style.getPropertyValue("--dna-surface")).toBe(resolved.semantic.surface);
    expect(scope.style.getPropertyValue("--dna-text")).toBe(resolved.semantic.foreground);
    expect(scope.style.getPropertyValue("--dna-accent")).toBe(resolved.semantic.primary);
    expect(scope.style.getPropertyValue("--dna-accent-secondary")).toBe(
      resolved.semantic.accentSecondary,
    );
  });

  it("preserves explicit caller overrides after canonical token resolution", () => {
    const accentOverride = "#123456";
    renderNode(
      <SkinScope
        dnaId="03-rocksoul"
        mode="light"
        style={{ "--dna-accent": accentOverride } as React.CSSProperties}
      >
        <div>Scoped content</div>
      </SkinScope>,
    );

    const scope = container.firstElementChild as HTMLElement;
    expect(scope.style.getPropertyValue("--dna-accent")).toBe(accentOverride);
  });
});
