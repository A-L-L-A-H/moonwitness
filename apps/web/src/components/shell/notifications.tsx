"use client";

import { Bell } from "@moonwitness/ui/icons";

import { feedItems } from "@/lib/data";
import { Card } from "@moonwitness/ui";

interface NotificationsProps {
  open: boolean;
  onToggle: () => void;
}

export function Notifications({ open, onToggle }: NotificationsProps) {
  return (
    <>
      <button
        onClick={onToggle}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-[var(--foreground)] hover:bg-[var(--muted)]"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[9px] font-bold text-[var(--primary-foreground)]">
          3
        </span>
      </button>
      {open && (
        <Card className="absolute right-0 top-12 w-80 p-3" role="dialog" aria-label="Notifications">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="font-brush text-sm text-[var(--primary)]">COMMAND FEED</span>
            <span className="text-[10px] text-[var(--muted-foreground)]">3 unread</span>
          </div>
          {feedItems.slice(0, 3).map((f) => (
            <div
              key={f.id}
              className="flex items-start gap-2 border-t border-[var(--border)] px-1 py-2.5"
            >
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{ background: f.color }}
              />
              <div>
                <p className="text-xs leading-snug text-[var(--foreground)]">{f.text}</p>
                <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">{f.ago}</p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
