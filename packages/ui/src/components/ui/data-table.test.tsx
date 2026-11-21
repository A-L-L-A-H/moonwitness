// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataTable, SkinProvider, type DataTableColumn } from "../../index";

type Row = {
  id: string;
  name: string;
  count: number;
  status: string;
};

let container: HTMLDivElement;
let root: Root;

function renderTable(
  columns: readonly DataTableColumn<Row>[],
  options?: {
    rows?: readonly Row[];
    pageSize?: number;
  },
) {
  const rows: readonly Row[] = options?.rows ?? [
    { id: "1", name: "Alpha", count: 42, status: "Ready" },
    { id: "2", name: "Beta", count: 7, status: "Pending review" },
  ];

  act(() => {
    root.render(
      <SkinProvider defaultSkin="archive" persist={false}>
        <DataTable<Row>
          data={rows}
          columns={columns}
          pageSize={options?.pageSize}
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

  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

  act(() => {
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function clickPaginationButton(label: "Previous" | "Next") {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent === label,
  );
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Pagination button "${label}" was not rendered`);
  }
  act(() => {
    button.click();
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
  it("searches primitive cells and explicit text for React nodes", () => {
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

  it("does not stringify React elements in implicit search", () => {
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

describe("DataTable pagination validation and bounds", () => {
  const columns: readonly DataTableColumn<Row>[] = [
    { id: "name", header: "Name", accessor: (row) => row.name },
  ];

  const makeRows = (count: number): Row[] =>
    Array.from({ length: count }, (_, idx) => ({
      id: String(idx + 1),
      name: `Row ${idx + 1}`,
      count: idx + 1,
      status: "Ready",
    }));

  it("handles zero, negative, non-finite, and fractional page sizes safely", () => {
    const rows = makeRows(12);

    for (const invalidSize of [0, -5, Number.NaN, Number.POSITIVE_INFINITY, 0.5]) {
      renderTable(columns, { rows, pageSize: invalidSize });
      expect(container.querySelectorAll("tbody tr")).toHaveLength(10);
      expect(container.textContent).toContain("Page 1 of 2");
    }

    renderTable(columns, { rows: makeRows(5), pageSize: 2.8 });
    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(container.textContent).toContain("Page 1 of 3");
  });

  it("caps oversized page sizes deterministically", () => {
    const rows = makeRows(120);
    renderTable(columns, { rows, pageSize: 10000 });

    expect(container.querySelectorAll("tbody tr")).toHaveLength(100);
    expect(container.textContent).toContain("Page 1 of 2");
  });

  it("renders a stable empty pagination state when data is empty", () => {
    renderTable(columns, { rows: [], pageSize: 0 });

    expect(container.querySelector("tbody")).toBeNull();
    expect(container.textContent).toContain("No rows");
    expect(container.textContent).toContain("0 rows");
    expect(container.textContent).not.toContain("Page ");
  });

  it("clamps the current page when rows shrink or filtering reduces pages", () => {
    const sixRows = makeRows(6);
    renderTable(columns, { rows: sixRows, pageSize: 2 });

    clickPaginationButton("Next");
    clickPaginationButton("Next");
    expect(container.textContent).toContain("Page 3 of 3");
    expect(container.querySelector("tbody")?.textContent).toContain("Row 5");

    // Shrinking data via props clamps current page to the new last page
    renderTable(columns, { rows: sixRows.slice(0, 3), pageSize: 2 });
    expect(container.textContent).toContain("Page 2 of 2");
    expect(container.querySelector("tbody")?.textContent).toContain("Row 3");

    // Restoring rows does not jump back to stale page 3
    renderTable(columns, { rows: sixRows, pageSize: 2 });
    expect(container.textContent).toContain("Page 2 of 3");

    // Filtering resets page to 1 safely
    setSearchValue("Row 6");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(container.querySelector("tbody")?.textContent).toContain("Row 6");
    expect(container.textContent).not.toContain("Page ");
  });
});
