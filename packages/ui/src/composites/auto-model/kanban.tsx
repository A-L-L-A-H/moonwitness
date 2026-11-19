"use client";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import type { SkinName } from "../../skin";
import {
  formatCellValue,
  resolveFieldValue,
  type AutoModelAcl,
  type AutoModelFieldSpec,
  type AutoModelRow,
} from "./types";

interface AutoModelKanbanProps {
  activeSkin: SkinName;
  filteredRows: readonly AutoModelRow[];
  visibleFields: readonly AutoModelFieldSpec[];
  groupField: AutoModelFieldSpec;
  acl: AutoModelAcl;
  canUpdate: boolean;
  onEdit: (row: AutoModelRow) => void;
}

export function AutoModelKanban({
  activeSkin,
  filteredRows,
  visibleFields,
  groupField,
  acl,
  canUpdate,
  onEdit,
}: AutoModelKanbanProps) {
  const groups = Array.from(
    new Set(filteredRows.map((row) => formatCellValue(resolveFieldValue(row, groupField)))),
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-mw-view-mode="kanban">
      {groups.map((group) => {
        const groupRows = filteredRows.filter(
          (row) => formatCellValue(resolveFieldValue(row, groupField)) === group,
        );
        return (
          <section
            key={group}
            aria-label={`${groupField.label}: ${group}`}
            className="space-y-2 border border-[var(--border)] bg-[var(--background)] p-2"
          >
            <header className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
              <Badge skin={activeSkin} variant="outline">
                {group}
              </Badge>
              <span>{groupRows.length}</span>
            </header>
            {groupRows.map((row) => (
              <article
                key={row.id}
                className="space-y-1 border border-[var(--border)] bg-[var(--card)] p-2 text-xs"
              >
                <div className="font-semibold text-[var(--foreground)]">
                  {formatCellValue(resolveFieldValue(row, visibleFields[0] ?? groupField))}
                </div>
                {acl.canUpdate && canUpdate ? (
                  <Button
                    skin={activeSkin}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(row)}
                  >
                    Edit
                  </Button>
                ) : null}
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}
