// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Field, FieldControl, FieldDescription, Form, FormField, Input } from "../../index";

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

describe("Field and Form description references", () => {
  it("does not reference a missing description and preserves caller references", () => {
    renderNode(
      <Field>
        <FieldControl>
          <Input aria-label="Name" aria-describedby="external-help external-help" />
        </FieldControl>
      </Field>,
    );

    const input = container.querySelector("input");
    expect(input?.getAttribute("aria-describedby")).toBe("external-help");
    expect(input?.hasAttribute("aria-invalid")).toBe(false);
  });

  it("references rendered description and error nodes exactly once", () => {
    renderNode(
      <>
        <p id="external-help">Additional field guidance.</p>
        <Field error="A value is required">
          <FieldControl>
            <Input aria-label="Name" aria-describedby="external-help" />
          </FieldControl>
          <FieldDescription>Enter your display name.</FieldDescription>
        </Field>
      </>,
    );

    const input = container.querySelector("input");
    const description = container.querySelector("p[id$='-description']");
    const error = container.querySelector('[role="alert"]');
    const references = input?.getAttribute("aria-describedby")?.split(/\s+/) ?? [];

    expect(description).not.toBeNull();
    expect(error).not.toBeNull();
    expect(references).toEqual(["external-help", description?.id, error?.id]);
    expect(new Set(references).size).toBe(references.length);
    expect(references.every((id) => document.getElementById(id) !== null)).toBe(true);
    expect(input?.getAttribute("aria-invalid")).toBe("true");
  });

  it("wires FormField description and validation errors without dangling IDs", () => {
    renderNode(
      <Form errors={{ email: "Email is required" }}>
        <FormField name="email" label="Email" description="Used for account notices.">
          <Input aria-label="Email" />
        </FormField>
      </Form>,
    );

    const input = container.querySelector("input");
    const description = container.querySelector("p[id$='-description']");
    const error = container.querySelector('[role="alert"]');
    const references = input?.getAttribute("aria-describedby")?.split(/\s+/) ?? [];

    expect(references).toEqual([description?.id, error?.id]);
    expect(references.every((id) => document.getElementById(id) !== null)).toBe(true);
  });
});
