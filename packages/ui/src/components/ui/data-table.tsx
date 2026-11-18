"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "../../icons";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { Button } from "./button";
import { Empty, EmptyDescription, EmptyTitle } from "./empty";
import { Input } from "./input";
import { useComponentSkin } from "./skin-adapter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export interface DataTableColumn<T> {
  readonly id: string;
  readonly header: React.ReactNode;
  readonly accessor: (row: T) => React.ReactNode;
  readonly sortValue?: (row: T) => string | number;
  readonly searchText?: (row: T) => string;
}

export interface DataTableProps<T> {
  data: readonly T[];
  columns: readonly DataTableColumn<T>[];
  getRowKey: (row: T, index: number) => string;
  searchPlaceholder?: string;
  searchable?: boolean;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  skin?: SkinName;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  searchPlaceholder = "Filter rows...",
  searchable = true,
  pageSize = 10,
  emptyTitle = "No rows",
  emptyDescription = "No matching records are available.",
  skin,
  className,
}: DataTableProps<T>) {
  const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
  const [query, setQuery] = React.useState("");
  const [sortCol, setSortCol] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...data];
    return data.filter((row) =>
      columns.some((col) => {
        const raw = col.searchText ? col.searchText(row) : String(col.accessor(row) ?? "");
        return raw.toLowerCase().includes(q);
      }),
    );
  }, [data, columns, query]);

  const sorted = React.useMemo(() => {
    if (!sortCol) return filtered;
    const col = columns.find((c) => c.id === sortCol);
    if (!col?.sortValue) return filtered;
    const getVal = col.sortValue;
    return [...filtered].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, columns, sortCol, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (colId: string) => {
    setPage(0);
    if (sortCol !== colId) {
      setSortCol(colId);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortCol(null);
    }
  };

  return (
    <div
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn("space-y-3 p-3", recipe.card, className)}
    >
      {searchable ? (
        <div className="flex items-center justify-between gap-2">
          <Input
            skin={skin}
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            className="max-w-sm"
          />
          <span className="font-mono text-xs text-[var(--muted-foreground)]">
            {sorted.length} {sorted.length === 1 ? "row" : "rows"}
          </span>
        </div>
      ) : null}

      {pageRows.length === 0 ? (
        <Empty skin={skin}>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </Empty>
      ) : (
        <Table skin={skin}>
          <TableHeader>
            <TableRow>
              {columns.map((col) => {
                const isSorted = sortCol === col.id;
                const ariaSort = col.sortValue
                  ? isSorted
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                  : undefined;
                return (
                  <TableHead key={col.id} aria-sort={ariaSort}>
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.id)}
                        className="inline-flex min-h-9 items-center gap-1.5 font-inherit uppercase hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortDir === "asc" ? (
                            <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5 opacity-60" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row, idx) => (
              <TableRow key={getRowKey(row, safePage * pageSize + idx)}>
                {columns.map((col) => (
                  <TableCell key={col.id}>{col.accessor(row)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
          <span>
            Page {safePage + 1} of {pageCount}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              skin={skin}
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              skin={skin}
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
