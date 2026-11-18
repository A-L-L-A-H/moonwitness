"use client";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import type { SkinName } from "../../skin";
import {
  formatCellValue,
  resolveFieldValue,
  type AutoModelAcl,
  type AutoModelCustomAction,
  type AutoModelFieldSpec,
  type AutoModelRow,
} from "./types";

interface AutoModelTableProps {
  activeSkin: SkinName;
  filteredRows: readonly AutoModelRow[];
  visibleFields: readonly AutoModelFieldSpec[];
  acl: AutoModelAcl;
  hasUpdateHandler: boolean;
  hasDeleteHandler: boolean;
  hasHistoryHandler: boolean;
  onArchive?: ((id: string) => Promise<void> | void) | undefined;
  onRestore?: ((id: string) => Promise<void> | void) | undefined;
  customActions: readonly AutoModelCustomAction[];
  onInspectHistory: (id: string) => void;
  onEdit: (row: AutoModelRow) => void;
  onDelete: (id: string) => void;
}

export function AutoModelTable({
  activeSkin,
  filteredRows,
  visibleFields,
  acl,
  hasUpdateHandler,
  hasDeleteHandler,
  hasHistoryHandler,
  onArchive,
  onRestore,
  customActions,
  onInspectHistory,
  onEdit,
  onDelete,
}: AutoModelTableProps) {
  const showActionsColumn =
    (acl.canUpdate && hasUpdateHandler) ||
    (acl.canDelete && hasDeleteHandler) ||
    Boolean(onArchive) ||
    Boolean(onRestore) ||
    hasHistoryHandler ||
    customActions.length > 0;

  return (
    <div className="overflow-x-auto border border-[var(--border)]">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/60 font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
            {visibleFields.map((field) => (
              <th key={field.name} className="px-3 py-2">
                {field.label}
                {field.isCustom ? " *" : ""}
              </th>
            ))}
            {showActionsColumn ? <th className="px-3 py-2 text-right">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[var(--border)]/60 transition-colors hover:bg-[var(--muted)]/35"
            >
              {visibleFields.map((field) => {
                const rawVal = resolveFieldValue(row, field);
                const textVal = formatCellValue(rawVal);
                return (
                  <td key={field.name} className="px-3 py-2 text-[var(--foreground)]">
                    {field.type === "boolean" || field.name === "status" ? (
                      <Badge skin={activeSkin} variant="outline">
                        {textVal}
                      </Badge>
                    ) : (
                      textVal
                    )}
                  </td>
                );
              })}
              {showActionsColumn ? (
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    {hasHistoryHandler ? (
                      <Button
                        skin={activeSkin}
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onInspectHistory(row.id)}
                      >
                        History
                      </Button>
                    ) : null}
                    {acl.canUpdate && hasUpdateHandler ? (
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
                    {onArchive && row.status !== "archived" ? (
                      <Button
                        skin={activeSkin}
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void onArchive(row.id)}
                      >
                        Archive
                      </Button>
                    ) : null}
                    {onRestore && row.status === "archived" ? (
                      <Button
                        skin={activeSkin}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void onRestore(row.id)}
                      >
                        Restore
                      </Button>
                    ) : null}
                    {customActions.map((act) => (
                      <Button
                        key={act.id}
                        skin={activeSkin}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void act.onTrigger(row.id)}
                      >
                        {act.label}
                      </Button>
                    ))}
                    {acl.canDelete && hasDeleteHandler ? (
                      <Button
                        skin={activeSkin}
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(row.id)}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
