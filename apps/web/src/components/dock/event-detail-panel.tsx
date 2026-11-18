"use client";

import type { Era, TimelineEvent } from "@moonwitness/types";
import { EventDetail } from "@moonwitness/ui";
import type { TimelineEventAuditEntry } from "@/lib/api/timeline";

interface EventDetailPanelProps {
  variant: "aside" | "drawer";
  event: TimelineEvent;
  era: Era;
  relatedEvents: TimelineEvent[];
  shareUrl: string;
  onRelated: (id: string) => void;
  onClose?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  mutating?: boolean;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  historyEntries?: TimelineEventAuditEntry[];
  historyLoading?: boolean;
}

export function EventDetailPanel({
  variant,
  event,
  era,
  relatedEvents,
  shareUrl,
  onRelated,
  onClose,
  canEdit = false,
  canDelete = false,
  mutating = false,
  onArchive,
  onDelete,
  historyEntries,
  historyLoading = false,
}: EventDetailPanelProps) {
  const customAttrs = (event as TimelineEvent & { _attrs?: Record<string, unknown> })._attrs;
  const customEntries = customAttrs ? Object.entries(customAttrs) : [];

  const detail = (
    <div className="flex h-full flex-col overflow-y-auto border-2 border-[var(--border)] bg-[var(--card)]">
      <EventDetail
        event={event}
        era={era}
        relatedEvents={relatedEvents}
        shareUrl={shareUrl}
        onRelated={onRelated}
        onClose={onClose}
      />

      {customEntries.length > 0 && (
        <div className="border-t border-[var(--border)] bg-[var(--background)]/60 p-4">
          <p className="font-mono text-[10px] tracking-widest text-[var(--primary)]">
            CUSTOM ATTRIBUTES
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px]">
            {customEntries.map(([key, value]) => (
              <div key={key} className="border border-[var(--border)] px-2 py-1">
                <dt className="text-[10px] uppercase text-[var(--muted-foreground)]">{key}</dt>
                <dd className="truncate text-[var(--foreground)]">{String(value ?? "—")}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {(canEdit || canDelete || (historyEntries && historyEntries.length > 0)) && (
        <div className="space-y-3 border-t-2 border-[var(--border)] bg-[var(--muted)]/55 p-4">
          {(canEdit || canDelete) && (
            <div className="flex flex-wrap gap-2">
              {canEdit && onArchive && (
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() => onArchive(event.id)}
                  className="btn-zine btn-yellow min-h-10 px-3 py-1.5 text-[11px] disabled:opacity-50"
                >
                  ARCHIVE EVENT
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() => onDelete(event.id)}
                  className="btn-zine min-h-10 border-red-400 px-3 py-1.5 text-[11px] text-red-300 disabled:opacity-50"
                >
                  DELETE EVENT
                </button>
              )}
            </div>
          )}

          <div>
            <p className="font-mono text-[10px] tracking-widest text-[var(--primary)]">
              AUDIT HISTORY
            </p>
            {historyLoading ? (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">Loading history…</p>
            ) : !historyEntries || historyEntries.length === 0 ? (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                No recorded mutations for this event.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5 font-mono text-[11px] text-[var(--foreground)]">
                {historyEntries.slice(0, 6).map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-2 border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5"
                  >
                    <span>
                      <strong className="text-[var(--primary)]">{entry.action}</strong> v
                      {entry.entity_version}
                    </span>
                    <span className="truncate text-[10px] text-[var(--muted-foreground)]">
                      {entry.changed_by ?? entry.source} ·{" "}
                      {new Date(entry.changed_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (variant === "aside") {
    return (
      <aside className="hidden xl:block" aria-label="Event detail">
        <div className="sticky top-20 h-[calc(100vh-6rem)]">{detail}</div>
      </aside>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 xl:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Event detail"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-md">{detail}</div>
    </div>
  );
}
