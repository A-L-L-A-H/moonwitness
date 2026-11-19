// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Form, FormField, Input, SkinProvider } from "../../index";

let container: HTMLDivElement;
let root: Root;

function renderNode(node: React.ReactNode) {
  act(() => {
    root.render(node);
  });
}

function getInput(testId: string): HTMLInputElement {
  const input = container.querySelector(`[data-testid="${testId}"]`);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`Expected input: ${testId}`);
  }
  return input;
}

function describedByIds(input: HTMLInputElement): string[] {
  return (input.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
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

describe("FieldControl description references", () => {
  it("keeps caller IDs and references only rendered descriptions and errors", () => {
    renderNode(
      <SkinProvider defaultSkin="archive" persist={false}>
        <Form errors={{ combined: "This value is invalid." }}>
          <FormField name="plain" label="Plain field">
            <Input data-testid="plain" aria-describedby="external-help" />
          </FormField>
          <FormField
            name="combined"
            label="Field with help and error"
            description="Helpful context."
          >
            <Input data-testid="combined" aria-describedby="external-help" />
          </FormField>
        </Form>
        <p id="external-help">Shared help text.</p>
      </SkinProvider>,
    );

    const plainIds = describedByIds(getInput("plain"));
    expect(plainIds).toEqual(["external-help"]);

    const combined = getInput("combined");
    const combinedIds = describedByIds(combined);
    expect(combined.getAttribute("aria-invalid")).toBe("true");
    expect(combinedIds).toContain("external-help");
    expect(new Set(combinedIds).size).toBe(combinedIds.length);
    expect(combinedIds.every((id) => document.getElementById(id) !== null)).toBe(true);
    expect(combinedIds.some((id) => document.getElementById(id)?.textContent?.includes("Helpful context."))).toBe(true);
    expect(combinedIds.some((id) => document.getElementById(id)?.textContent?.includes("This value is invalid."))).toBe(true);
  });
});
