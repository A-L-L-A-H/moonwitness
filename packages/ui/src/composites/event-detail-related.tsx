"use client";

import { useSkin } from "../skin";
import { defaultKindColors } from "./kind-colors";

export interface RelatedEventItem {
  id: string;
  title: string;
  kind: string;
  date: string;
}

export interface EventDetailRelatedProps<R extends RelatedEventItem = RelatedEventItem> {
  relatedEvents: R[];
  onRelated: (id: string) => void;
}

export function EventDetailRelated<R extends RelatedEventItem>({
  relatedEvents,
  onRelated,
}: EventDetailRelatedProps<R>) {
  const { skin } = useSkin();
  return (
    <>
      <h3 className="font-brush mt-5 text-sm text-[var(--primary)]">RELATED EVENTS</h3>
      <div className="mt-2 space-y-1.5" data-skin={skin}>
        {relatedEvents.map((r) => (
          <button
            key={r.id}
            onClick={() => onRelated(r.id)}
            className="flex w-full items-center gap-2 border border-[var(--border)] px-3 py-2 text-left hover:border-[var(--primary)]"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: defaultKindColors[r.kind] ?? "var(--muted-foreground)" }}
            />
            <span className="text-[10px] text-[var(--muted-foreground)]">{r.date}</span>
            <span className="flex-1 truncate text-xs text-[var(--foreground)]">{r.title}</span>
            <span
              className="text-[10px]"
              style={{ color: defaultKindColors[r.kind] ?? "var(--muted-foreground)" }}
            >
              ({r.kind})
            </span>
          </button>
        ))}
        {relatedEvents.length === 0 && (
          <p className="text-xs text-[var(--muted-foreground)]">No related signals yet.</p>
        )}
      </div>
    </>
  );
}
