// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AutoModelView, SkinProvider, type AutoModelViewDescriptor } from "../index";

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

const SAMPLE_DESCRIPTOR: AutoModelViewDescriptor = {
  model: "snmp.probe",
  title: "SNMP Probes",
  description: "Active device telemetry pollers",
  domainIcon: "snmp",
  cutoutId: "satellite-dish",
  fields: [
    { name: "hostname", label: "Hostname", type: "text", required: true },
    { name: "community", label: "Community", type: "select", selection: ["public", "private"] },
    { name: "priority", label: "Priority", type: "integer", isCustom: true },
  ],
  acl: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
};

describe("AutoModelView pure schema UI composite", () => {
  it("renders cutout empty state when rows are empty", () => {
    renderNode(
      <SkinProvider defaultSkin="technical" persist={false}>
        <AutoModelView descriptor={SAMPLE_DESCRIPTOR} rows={[]} onCreate={() => {}} />
      </SkinProvider>,
    );

    expect(container.querySelector('[data-mw-cutout="satellite-dish"]')).not.toBeNull();
    expect(container.querySelector('[data-mw-auto-model="snmp.probe"]')).not.toBeNull();
    expect(container.textContent).toContain("+ Create");
  });

  it("renders standard and custom _attrs columns and respects ACL flags", () => {
    renderNode(
      <SkinProvider defaultSkin="editorial" persist={false}>
        <AutoModelView
          descriptor={SAMPLE_DESCRIPTOR}
          rows={[
            {
              id: "row-1",
              hostname: "core-gw-01",
              community: "public",
              _attrs: { priority: 99 },
            },
          ]}
          onCreate={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      </SkinProvider>,
    );

    expect(container.textContent).toContain("core-gw-01");
    expect(container.textContent).toContain("99");
    expect(container.textContent).toContain("Edit");
    expect(container.textContent).not.toContain("Delete");
  });

  it("submits valid standard + _attrs fields via onCreate", async () => {
    const onCreate = vi.fn(async () => {});
    renderNode(
      <SkinProvider defaultSkin="riot" persist={false}>
        <AutoModelView descriptor={SAMPLE_DESCRIPTOR} rows={[]} onCreate={onCreate} />
      </SkinProvider>,
    );

    const createBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("+ Create"),
    );
    expect(createBtn).toBeDefined();
    act(() => {
      createBtn?.click();
    });

    const inputs = container.querySelectorAll("form input");
    const hostnameInput = inputs[0] as HTMLInputElement;
    const priorityInput = inputs[1] as HTMLInputElement;

    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(hostnameInput, "edge-rtr-02");
      hostnameInput.dispatchEvent(new Event("input", { bubbles: true }));
      hostnameInput.dispatchEvent(new Event("change", { bubbles: true }));

      setter?.call(priorityInput, "5");
      priorityInput.dispatchEvent(new Event("input", { bubbles: true }));
      priorityInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const form = container.querySelector("form");
    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(onCreate).toHaveBeenCalledWith({
      hostname: "edge-rtr-02",
      community: "",
      _attrs: { priority: 5 },
    });
  });
});
