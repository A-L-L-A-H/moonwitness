// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataTable, SkinProvider } from "../../index";

type Row = {
  id: string;
  name: string;
  count: number;
  status: string;
};

let container: HTMLDivElement;
let root: Root;

function renderTable(columns: Parameters<typeof DataTable<Row>>[0]["columns"]) {
  const rows: Row[] = [
    { id: "1", name: "Alpha", count: 42, status: "Ready" },
    { id: "2", name: "Beta", count: 7, status: "Pending review" },
  ];

  act(() => {
    root.render(
      <SkinProvider defaultSkin="archive" persist={false}>
        <DataTable<Row>
          data={rows}
          columns={columns}
          getRowKey={(row) => row.id}
        />
      </SkinProvider>,
    );
  });
}

function setSearchValue(value: string) {
  const input = container.querySelector("input");
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("DataTable search input was not rendered");
  }

  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;

  act(() => {
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
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

describe("DataTable search values", () => {
  it("filters primitive text and numeric cells and uses explicit text for React nodes", () => {
    renderTable([
      { id: "name", header: "Name", accessor: (row) => row.name },
      { id: "count", header: "Count", accessor: (row) => row.count },
      {
        id: "status",
        header: "Status",
        accessor: (row) => <span>{row.status}</span>,
        searchText: (row) => row.status,
      },
    ]);

    setSearchValue("42");
    expect(container.querySelector("tbody")?.textContent).toContain("Alpha");
    expect(container.querySelector("tbody")?.textContent).not.toContain("Beta");

    setSearchValue("pending");
    expect(container.querySelector("tbody")?.textContent).toContain("Beta");
    expect(container.querySelector("tbody")?.textContent).not.toContain("Alpha");
  });

  it("does not stringify React elements when no raw search text is provided", () => {
    renderTable([
      {
        id: "status",
        header: "Status",
        accessor: (row) => <span>{row.status}</span>,
      },
    ]);

    setSearchValue("[object Object]");

    expect(container.querySelector("tbody")).toBeNull();
    expect(container.textContent).toContain("No rows");
  });
});
