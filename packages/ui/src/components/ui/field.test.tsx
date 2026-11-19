// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Form, FormField, Input, SkinProvider } from "../../index";

let container: HTMLDivElement;
let root: Root;

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
  it("keeps FieldControl descriptions valid and preserves caller IDs", () => {
    renderNode(
      <SkinProvider defaultSkin="archive" persist={false}>
        <Form
          errors={{
            errorOnly: "This field is required.",
            describedAndError: "This value is invalid.",
          }}
        >
          <FormField name="plain" label="Plain field">
            <Input data-testid="plain-control" aria-describedby="external-help" />
          </FormField>
          <FormField
            name="help"
            label="Field with help"
            description="Helpful context."
          >
            <Input data-testid="help-control" aria-describedby="external-help" />
          </FormField>
          <FormField name="errorOnly" label="Field with error">
            <Input data-testid="error-control" />
          </FormField>
          <FormField
            name="describedAndError"
            label="Field with help and error"
            description="Additional context."
          >
            <Input data-testid="described-error-control" aria-describedby="external-help" />
          </FormField>
        </Form>
        <p id="external-help">Shared help text.</p>
      </SkinProvider>,
    );

    const getControl = (testId: string) => {
      const control = container.querySelector(`[data-testid="${testId}"]`);
      if (!(control instanceof HTMLInputElement)) {
        throw new Error(`Expected input for ${testId}`);
      }
      return control;
    };
    const getReferencedIds = (control: HTMLInputElement) =>
      (control.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);

    const plainIds = getReferencedIds(getControl("plain-control"));
    expect(plainIds).toEqual(["external-help"]);

    const helpIds = getReferencedIds(getControl("help-control"));
    expect(helpIds).toContain("external-help");
    expect(helpIds.some((id) => id !== "external-help")).toBe(true);
    expect(new Set(helpIds).size).toBe(helpIds.length);

    const errorControl = getControl("error-control");
    const errorIds = getReferencedIds(errorControl);
    expect(errorControl.getAttribute("aria-invalid")).toBe("true");
    expect(errorIds).toHaveLength(1);
    expect(document.getElementById(errorIds[0] ?? "")?.textContent).toBe(
      "This field is required.",
    );

    const describedErrorControl = getControl("described-error-control");
    const describedErrorIds = getReferencedIds(describedErrorControl);
    expect(describedErrorControl.getAttribute("aria-invalid")).toBe("true");
    expect(describedErrorIds).toContain("external-help");
    expect(new Set(describedErrorIds).size).toBe(describedErrorIds.length);
    expect(
      describedErrorIds
        .filter((id) => id !== "external-help")
        .every((id) => document.getElementById(id) !== null),
    ).toBe(true);
  });
});
