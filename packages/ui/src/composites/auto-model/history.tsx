"use client";

import { Button } from "../../components/ui/button";
import type { SkinName } from "../../skin";
import type { AutoModelHistoryEntry } from "./types";

interface AutoModelHistoryPanelProps {
  activeSkin: SkinName;
  rowId: string;
  loading: boolean;
  entries: readonly AutoModelHistoryEntry[];
  onClose: () => void;
}

export function AutoModelHistoryPanel({
  activeSkin,
  rowId,
  loading,
  entries,
  onClose,
}: AutoModelHistoryPanelProps) {
  return (
    <div className="space-y-2 border border-[var(--border)] bg-[var(--background)] p-3 text-xs">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
        <span>Audit History · {rowId}</span>
        <Button skin={activeSkin} type="button" size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      {loading ? (
        <p className="text-[var(--muted-foreground)]">Loading audit entries…</p>
      ) : entries.length === 0 ? (
        <p className="text-[var(--muted-foreground)]">No audit entries recorded.</p>
      ) : (
        <ul className="space-y-1 font-mono text-[11px]">
          {entries.slice(0, 8).map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between border border-[var(--border)] px-2 py-1"
            >
              <span>
                <strong>{entry.action}</strong> v{entry.entity_version}
              </span>
              <span className="text-[var(--muted-foreground)]">
                {entry.changed_by ?? "system"} · {new Date(entry.changed_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
